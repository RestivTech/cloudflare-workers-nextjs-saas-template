import { MonitoringDashboard } from '@/components/monitoring-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Monitoring - Pattern Compliance Dashboard',
  description: 'Real-time system health and performance metrics',
}

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-2">
            <a href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Dashboard
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Real-time health checks and performance metrics
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MonitoringDashboard />
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Health Checks</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ API response time</li>
              <li>✓ Database connectivity</li>
              <li>✓ Cache availability</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Status Indicators</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Healthy
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Degraded
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Unhealthy
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Performance Targets</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>API Response: &lt;500ms (p95)</li>
              <li>Error Rate: &lt;0.1%</li>
              <li>Cache Hit Rate: &gt;80%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
