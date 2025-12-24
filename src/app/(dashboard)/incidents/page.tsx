'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useIncidents } from '@/hooks/useFeedback'
import { AlertCircle, Loader2 } from 'lucide-react'

interface FiltersState {
  namespace?: string
  severity?: string
  scanType?: string
  limit: number
  offset: number
}

export default function IncidentsPage() {
  const [filters, setFilters] = useState<FiltersState>({
    limit: 20,
    offset: 0,
  })

  const { data, isLoading, error } = useIncidents(filters)

  const incidents = data?.incidents || []
  const totalCount = data?.total || 0
  const totalPages = Math.ceil(totalCount / filters.limit)
  const currentPage = filters.offset / filters.limit + 1

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      offset: 0 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * filters.limit
    }))
  }

  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-gray-600 mt-1">Monitor and respond to system incidents with feedback</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Namespace
            </label>
            <input
              type="text"
              placeholder="Filter by namespace"
              value={filters.namespace || ''}
              onChange={e => handleFilterChange('namespace', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity || ''}
              onChange={e => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Type
            </label>
            <input
              type="text"
              placeholder="Filter by scan type"
              value={filters.scanType || ''}
              onChange={e => handleFilterChange('scanType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-6 flex items-center gap-3 text-red-700 bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load incidents. Please try again.</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No incidents found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pod</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Alert</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Namespace</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Anomaly Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Feedback</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidents.map(incident => (
                  <tr key={incident.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{incident.pod_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{incident.alert_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{incident.namespace}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${severityColor(incident.severity)}`}>
                        {incident.severity || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {incident.anomaly_score ? `${(incident.anomaly_score * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        incident.feedback_count > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.feedback_count} feedback
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && incidents.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages} ({totalCount} total incidents)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
