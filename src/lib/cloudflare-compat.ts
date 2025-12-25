/**
 * Cloudflare Workers compatibility layer for Node.js/Docker deployment
 *
 * This module provides stub implementations for @opennextjs/cloudflare
 * when running in a standalone Node.js environment (Docker).
 */

/**
 * In-memory KV store for Docker deployment
 * Note: This does NOT persist across restarts - for production,
 * consider using Redis or another persistent store
 */
class InMemoryKVStore {
  private store = new Map<string, { value: string; expiration?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiration && Date.now() > entry.expiration) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiration = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : undefined;
    this.store.set(key, { value, expiration });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string; expiration?: number }> }> {
    const keys: Array<{ name: string; expiration?: number }> = [];
    const prefix = options?.prefix || '';

    for (const [key, entry] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        // Skip expired entries
        if (entry.expiration && Date.now() > entry.expiration) {
          this.store.delete(key);
          continue;
        }
        keys.push({
          name: key,
          expiration: entry.expiration ? Math.floor(entry.expiration / 1000) : undefined
        });
      }
    }

    return { keys };
  }
}

// Singleton instances for the mock stores
const mockKVStore = new InMemoryKVStore();
const mockCacheKVStore = new InMemoryKVStore();

interface CloudflareEnv {
  NEXT_TAG_CACHE_D1?: unknown;
  NEXT_INC_CACHE_KV?: InMemoryKVStore;
  KV?: InMemoryKVStore;
  [key: string]: unknown;
}

interface CloudflareContext {
  env: CloudflareEnv;
  ctx: {
    waitUntil: (promise: Promise<unknown>) => void;
  };
  cf: Record<string, unknown>;
}

/**
 * Stub implementation of getCloudflareContext for Docker deployment
 * Provides mock KV stores for session management
 */
export function getCloudflareContext(): CloudflareContext {
  return {
    env: {
      // Cloudflare D1 is not available in Docker
      NEXT_TAG_CACHE_D1: undefined,
      // Provide mock KV stores for session management
      NEXT_INC_CACHE_KV: mockCacheKVStore,
      KV: mockKVStore,
    },
    ctx: {
      waitUntil: (promise: Promise<unknown>) => {
        // In Node.js, we just let the promise run
        // No need to extend request lifetime
        promise.catch(() => {
          // Ignore errors from background tasks
        });
      },
    },
    cf: {
      // Provide some mock Cloudflare request metadata
      country: 'CA',
      city: 'Calgary',
      continent: 'NA',
    },
  };
}
