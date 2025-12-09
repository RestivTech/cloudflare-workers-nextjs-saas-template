'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: { status: string; latency?: number; error?: string }
    cache: { status: string; latency?: number; error?: string }
    api: { status: string; latency: number }
  }
}

interface MetricsData {
  memory: {
    used: number
    total: number
    percentage: number
  }
  uptime: number
  requestsPerSecond: number
  averageResponseTime: number
  errorRate: number
}

export function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthCheckData | null>(null)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch health check data
        const healthResponse = await fetch('/api/health')
        if (!healthResponse.ok) {
          throw new Error('Failed to fetch health data')
        }
        const healthData = await healthResponse.json()
        setHealth(healthData)

        // Fetch metrics data (if endpoint exists)
        try {
          const metricsResponse = await fetch('/api/metrics')
          if (metricsResponse.ok) {
            const metricsData = await metricsResponse.json()
            setMetrics(metricsData)
          }
        } catch {
          // Metrics endpoint might not be available yet
        }

        setLastUpdated(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓'
      case 'degraded':
        return '⚠'
      case 'unhealthy':
        return '✕'
      default:
        return '?'
    }
  }

  if (loading && !health) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !health) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        {lastUpdated && (
          <p className="text-sm text-gray-600">
            Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Overall Status */}
      {health && (
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(health.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Overall Status</p>
              <p className="text-3xl font-bold capitalize mt-1">{health.status}</p>
              <p className="text-xs opacity-75 mt-2">
                Version: {health.version} • Environment: {health.environment}
              </p>
            </div>
            <div className="text-5xl">{getStatusIcon(health.status)}</div>
          </div>
        </div>
      )}

      {/* Health Checks Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API Health */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">API</h3>
              <span className="text-2xl">{getStatusIcon(health.checks.api.status)}</span>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(health.checks.api.status)}`}>
                {health.checks.api.status}
              </p>
              <p className="text-xs text-gray-600">
                Latency: <span className="font-mono">{health.checks.api.latency}ms</span>
              </p>
            </div>
          </div>

          {/* Database Health */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Database</h3>
              <span className="text-2xl">{getStatusIcon(health.checks.database.status)}</span>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(health.checks.database.status)}`}>
                {health.checks.database.status}
              </p>
              {health.checks.database.latency && (
                <p className="text-xs text-gray-600">
                  Latency: <span className="font-mono">{health.checks.database.latency}ms</span>
                </p>
              )}
              {health.checks.database.error && (
                <p className="text-xs text-red-600">
                  Error: {health.checks.database.error}
                </p>
              )}
            </div>
          </div>

          {/* Cache Health */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Cache</h3>
              <span className="text-2xl">{getStatusIcon(health.checks.cache.status)}</span>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(health.checks.cache.status)}`}>
                {health.checks.cache.status}
              </p>
              {health.checks.cache.latency && (
                <p className="text-xs text-gray-600">
                  Latency: <span className="font-mono">{health.checks.cache.latency}ms</span>
                </p>
              )}
              {health.checks.cache.error && (
                <p className="text-xs text-red-600">
                  Error: {health.checks.cache.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Memory Usage */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Memory Usage</p>
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">
                {metrics.memory.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {(metrics.memory.used / 1024 / 1024).toFixed(1)}MB /{' '}
                {(metrics.memory.total / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics.memory.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Requests per Second */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Requests/sec</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.requestsPerSecond.toFixed(2)}
            </p>
          </div>

          {/* Avg Response Time */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.averageResponseTime.toFixed(0)}ms
            </p>
          </div>

          {/* Error Rate */}
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Error Rate</p>
            <p className={`text-2xl font-bold ${metrics.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
              {metrics.errorRate.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Timestamp */}
      {health && (
        <div className="text-xs text-gray-500 text-center">
          Last checked: {new Date(health.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}
