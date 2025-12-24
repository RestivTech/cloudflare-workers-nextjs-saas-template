/**
 * Cloudflare Workers compatibility layer for Node.js/Docker deployment
 *
 * This module provides stub implementations for @opennextjs/cloudflare
 * when running in a standalone Node.js environment (Docker).
 */

// Check if we're running in Docker/Node.js (not Cloudflare Workers)
const isDockerDeployment = process.env.NODE_ENV === 'production' &&
  typeof (globalThis as unknown as { caches?: unknown }).caches === 'undefined';

interface CloudflareEnv {
  NEXT_TAG_CACHE_D1?: unknown;
  KV?: unknown;
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
 * In Docker, Cloudflare-specific features are not available
 */
export function getCloudflareContext(): CloudflareContext {
  if (isDockerDeployment) {
    // Return stub context - features that depend on D1/KV won't work
    return {
      env: {
        // Cloudflare D1 and KV are not available in Docker
        NEXT_TAG_CACHE_D1: undefined,
        KV: undefined,
      },
      ctx: {
        waitUntil: () => {
          // No-op in Docker
        },
      },
      cf: {},
    };
  }

  // If somehow called outside Docker context, throw helpful error
  throw new Error(
    'getCloudflareContext called but Cloudflare Workers runtime not available. ' +
    'This application is configured for standalone Node.js deployment.'
  );
}
