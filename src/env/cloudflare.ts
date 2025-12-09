/**
 * Cloudflare Workers environment configuration
 * Manages environment-specific settings for deployment
 */

interface CloudflareEnv {
  CACHE: KVNamespace
  SESSIONS: KVNamespace
  RATE_LIMITS: KVNamespace
  ENVIRONMENT: 'production' | 'staging' | 'development'
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Validate Cloudflare environment
 */
export function validateCloudflareEnv(env: unknown): asserts env is CloudflareEnv {
  if (typeof env !== 'object' || env === null) {
    throw new Error('Invalid Cloudflare environment')
  }

  const cfEnv = env as Record<string, unknown>

  // Validate required KV namespaces
  if (!cfEnv.CACHE) {
    throw new Error('Missing CACHE KV namespace binding')
  }
  if (!cfEnv.SESSIONS) {
    throw new Error('Missing SESSIONS KV namespace binding')
  }
  if (!cfEnv.RATE_LIMITS) {
    throw new Error('Missing RATE_LIMITS KV namespace binding')
  }

  // Validate environment variables
  if (!cfEnv.ENVIRONMENT) {
    throw new Error('Missing ENVIRONMENT variable')
  }
  if (!['production', 'staging', 'development'].includes(cfEnv.ENVIRONMENT as string)) {
    throw new Error('Invalid ENVIRONMENT value')
  }

  if (!cfEnv.LOG_LEVEL) {
    throw new Error('Missing LOG_LEVEL variable')
  }
  if (!['debug', 'info', 'warn', 'error'].includes(cfEnv.LOG_LEVEL as string)) {
    throw new Error('Invalid LOG_LEVEL value')
  }
}

/**
 * KV Cache utility for storing data with TTL
 */
export class KVCache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Failed to get KV value for key: ${key}`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const options: KVNamespacePutOptions = {}
      if (ttl) {
        options.expirationTtl = ttl
      }
      await this.kv.put(key, JSON.stringify(value), options)
    } catch (error) {
      console.error(`Failed to set KV value for key: ${key}`, error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key)
    } catch (error) {
      console.error(`Failed to delete KV value for key: ${key}`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.kv.get(key)
      return value !== null
    } catch (error) {
      console.error(`Failed to check KV existence for key: ${key}`, error)
      return false
    }
  }
}

/**
 * Session management using KV
 */
export class SessionManager {
  private cache: KVCache
  private sessionTTL = 86400 * 7 // 7 days

  constructor(sessionsKV: KVNamespace) {
    this.cache = new KVCache(sessionsKV)
  }

  async createSession(userId: string, data: Record<string, unknown>): Promise<string> {
    const sessionId = crypto.randomUUID()
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    }

    await this.cache.set(`session:${sessionId}`, sessionData, this.sessionTTL)
    return sessionId
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    return this.cache.get<Record<string, unknown>>(`session:${sessionId}`)
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cache.delete(`session:${sessionId}`)
  }

  async validateSession(sessionId: string): Promise<boolean> {
    return this.cache.exists(`session:${sessionId}`)
  }
}

/**
 * Rate limiter using KV
 */
export class RateLimiter {
  private cache: KVCache
  private defaultWindowMs = 60000 // 1 minute
  private defaultLimit = 100

  constructor(rateLimitsKV: KVNamespace) {
    this.cache = new KVCache(rateLimitsKV)
  }

  async checkLimit(
    identifier: string,
    limit: number = this.defaultLimit,
    windowMs: number = this.defaultWindowMs
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${identifier}`
    const now = Date.now()

    try {
      const existing = await this.cache.get<{ count: number; resetAt: number }>(key)

      if (!existing || existing.resetAt < now) {
        // New window
        await this.cache.set(
          key,
          { count: 1, resetAt: now + windowMs },
          Math.ceil(windowMs / 1000)
        )
        return {
          allowed: true,
          remaining: limit - 1,
          resetAt: now + windowMs,
        }
      }

      if (existing.count < limit) {
        // Within limit
        existing.count++
        await this.cache.set(key, existing, Math.ceil((existing.resetAt - now) / 1000))

        return {
          allowed: true,
          remaining: limit - existing.count,
          resetAt: existing.resetAt,
        }
      }

      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
      }
    } catch (error) {
      console.error(`Rate limiter error for identifier: ${identifier}`, error)
      // Fail open - allow the request but log the error
      return {
        allowed: true,
        remaining: 0,
        resetAt: now + windowMs,
      }
    }
  }
}

/**
 * Request context with Cloudflare environment
 */
export interface RequestContext {
  env: CloudflareEnv
  cache: KVCache
  sessions: SessionManager
  rateLimiter: RateLimiter
  requestId: string
  timestamp: number
}

/**
 * Create request context
 */
export function createRequestContext(env: CloudflareEnv): RequestContext {
  return {
    env,
    cache: new KVCache(env.CACHE),
    sessions: new SessionManager(env.SESSIONS),
    rateLimiter: new RateLimiter(env.RATE_LIMITS),
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
  }
}
