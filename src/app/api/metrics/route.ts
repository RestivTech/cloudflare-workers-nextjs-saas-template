import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

interface MetricsResponse {
  memory: {
    used: number
    total: number
    percentage: number
  }
  uptime: number
  requestsPerSecond: number
  averageResponseTime: number
  errorRate: number
  timestamp: string
}

// Simple in-memory metrics tracking (in production, use a real time-series DB)
const metricsStore = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  requestTimestamps: [] as number[],
  startTime: Date.now(),
}

/**
 * Track request metrics
 */
export function trackMetrics(
  responseTime: number,
  hasError: boolean
) {
  metricsStore.requests++
  metricsStore.totalResponseTime += responseTime

  if (hasError) {
    metricsStore.errors++
  }

  metricsStore.requestTimestamps.push(Date.now())

  // Keep only last 60 seconds of timestamps
  const sixtySecondsAgo = Date.now() - 60000
  metricsStore.requestTimestamps = metricsStore.requestTimestamps.filter(
    (t) => t > sixtySecondsAgo
  )
}

/**
 * Metrics endpoint
 * Returns current system metrics for monitoring
 */
export async function GET(request: NextRequest): Promise<NextResponse<MetricsResponse>> {
  const startTime = Date.now()
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()

  try {
    // Calculate metrics
    const uptime = Date.now() - metricsStore.startTime
    const requestsInLastMinute = metricsStore.requestTimestamps.length
    const requestsPerSecond = requestsInLastMinute / 60

    const averageResponseTime =
      metricsStore.requests > 0
        ? metricsStore.totalResponseTime / metricsStore.requests
        : 0

    const errorRate =
      metricsStore.requests > 0
        ? (metricsStore.errors / metricsStore.requests) * 100
        : 0

    // Memory metrics (if available in runtime)
    let memoryMetrics = {
      used: 0,
      total: 0,
      percentage: 0,
    }

    if (typeof process !== 'undefined' && process.memoryUsage) {
      try {
        const usage = process.memoryUsage()
        memoryMetrics = {
          used: usage.heapUsed,
          total: usage.heapTotal,
          percentage: (usage.heapUsed / usage.heapTotal) * 100,
        }
      } catch (error) {
        log.warn('Failed to get memory metrics', error)
      }
    }

    const response: MetricsResponse = {
      memory: memoryMetrics,
      uptime,
      requestsPerSecond,
      averageResponseTime,
      errorRate,
      timestamp: new Date().toISOString(),
    }

    log.info('Metrics endpoint called', {
      requestId,
      metrics: {
        requestsPerSecond,
        averageResponseTime: averageResponseTime.toFixed(2),
        errorRate: errorRate.toFixed(2),
      },
    })

    const responseWithHeaders = NextResponse.json(response, { status: 200 })
    responseWithHeaders.headers.set('x-request-id', requestId)
    responseWithHeaders.headers.set('cache-control', 'no-cache, no-store, must-revalidate')

    return responseWithHeaders
  } catch (error) {
    log.error('Metrics endpoint error', error, { requestId })

    return NextResponse.json(
      {
        memory: { used: 0, total: 0, percentage: 0 },
        uptime: 0,
        requestsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}

/**
 * Expose metrics tracking function for use in middleware and handlers
 */
export { trackMetrics }
