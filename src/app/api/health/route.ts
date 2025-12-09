import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: {
      status: 'healthy' | 'unhealthy'
      latency?: number
      error?: string
    }
    cache: {
      status: 'healthy' | 'unhealthy'
      latency?: number
      error?: string
    }
    api: {
      status: 'healthy' | 'unhealthy'
      latency: number
    }
  }
}

/**
 * Health check endpoint
 * Returns status of critical services
 * Used for load balancer health checks and monitoring
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now()
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()

  try {
    // Check database connectivity
    let dbStatus: 'healthy' | 'unhealthy' = 'healthy'
    let dbLatency = 0
    let dbError: string | undefined

    try {
      const dbStart = Date.now()
      // TODO: Add actual database health check
      // Example: await db.execute('SELECT 1')
      dbLatency = Date.now() - dbStart
    } catch (error) {
      dbStatus = 'unhealthy'
      dbError = error instanceof Error ? error.message : 'Unknown error'
      log.error('Database health check failed', error, { requestId })
    }

    // Check cache connectivity
    let cacheStatus: 'healthy' | 'unhealthy' = 'healthy'
    let cacheLatency = 0
    let cacheError: string | undefined

    try {
      const cacheStart = Date.now()
      // TODO: Add actual cache health check
      // Example: await redis.ping()
      cacheLatency = Date.now() - cacheStart
    } catch (error) {
      cacheStatus = 'unhealthy'
      cacheError = error instanceof Error ? error.message : 'Unknown error'
      log.warn('Cache health check failed', error, { requestId })
    }

    const apiLatency = Date.now() - startTime

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (dbStatus === 'unhealthy') {
      overallStatus = 'unhealthy'
    } else if (cacheStatus === 'unhealthy') {
      overallStatus = 'degraded'
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          ...(dbLatency > 0 && { latency: dbLatency }),
          ...(dbError && { error: dbError }),
        },
        cache: {
          status: cacheStatus,
          ...(cacheLatency > 0 && { latency: cacheLatency }),
          ...(cacheError && { error: cacheError }),
        },
        api: {
          status: 'healthy',
          latency: apiLatency,
        },
      },
    }

    // Log health check
    log.info('Health check completed', {
      requestId,
      status: overallStatus,
      latency: apiLatency,
    })

    // Return 200 for healthy/degraded, 503 for unhealthy
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    log.error('Health check endpoint error', error, { requestId })

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: { status: 'unhealthy', error: 'Check failed' },
          cache: { status: 'unhealthy', error: 'Check failed' },
          api: { status: 'unhealthy', latency: Date.now() - startTime },
        },
      },
      { status: 503 }
    )
  }
}
