'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getViolations } from '@/src/actions/violations'

export default function ViolationsPage() {
  const [violations, setViolations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'severity' | 'date' | 'status'>('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [filters, setFilters] = useState({
    status: '',
    approval_status: '',
    severity: '',
    repository_id: '',
    pattern_id: '',
  })

  useEffect(() => {
    fetchViolations()
  }, [filters])

  const fetchViolations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getViolations({
        status: filters.status || undefined,
        approval_status: filters.approval_status || undefined,
        severity: filters.severity || undefined,
        repository_id: filters.repository_id || undefined,
        pattern_id: filters.pattern_id || undefined,
        limit: 100,
      })
      setViolations(result.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load violations'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredViolations = violations
    .filter((v) =>
      v.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.pattern_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.repository_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let compareValue = 0

      switch (sortBy) {
        case 'severity': {
          const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
          compareValue =
            (severityOrder[a.severity as keyof typeof severityOrder] || 0) -
            (severityOrder[b.severity as keyof typeof severityOrder] || 0)
          break
        }
        case 'date':
          compareValue =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'status': {
          const statusOrder = { open: 3, resolved: 1, suppressed: 0, wontfix: 0 }
          compareValue =
            (statusOrder[a.status as keyof typeof statusOrder] || 0) -
            (statusOrder[b.status as keyof typeof statusOrder] || 0)
          break
        }
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'High':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'Medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'Low':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'suppressed':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'wontfix':
        return <XCircle className="w-4 h-4 text-purple-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'suppressed':
        return 'bg-gray-100 text-gray-800'
      case 'wontfix':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Violations</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage compliance violations across your repositories
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search violations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="suppressed">Suppressed</option>
            <option value="wontfix">Won't Fix</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filters.approval_status}
            onChange={(e) =>
              setFilters({ ...filters, approval_status: e.target.value })
            }
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'severity' | 'date' | 'status')
            }
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="severity">Sort: Severity</option>
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm hover:bg-accent"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Violations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading violations...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          Failed to load violations. Please try again.
        </div>
      ) : filteredViolations.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No violations found</p>
          <p className="text-muted-foreground text-sm mt-2">
            Your repositories are in compliance!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredViolations.map((violation: any) => (
            <Link
              key={violation.id}
              href={`/violations/${violation.id}`}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(violation.severity)}
                    <h3 className="font-semibold text-foreground">
                      {violation.pattern_name}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 truncate">
                    {violation.file_path}:{violation.line_number}
                  </p>

                  <p className="text-sm text-muted-foreground mb-3">
                    {violation.repository_name}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${getSeverityColor(
                        violation.severity
                      )}`}
                    >
                      {violation.severity}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${getStatusColor(
                        violation.status
                      )}`}
                    >
                      {getStatusIcon(violation.status)}
                      <span className="capitalize">{violation.status}</span>
                    </span>
                    {violation.approval_status && (
                      <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs rounded capitalize">
                        {violation.approval_status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                  <p>{new Date(violation.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredViolations.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredViolations.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Open</p>
              <p className="text-2xl font-bold text-red-500">
                {filteredViolations.filter((v) => v.status === 'open').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-500">
                {filteredViolations.filter((v) => v.status === 'resolved').length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Suppressed</p>
              <p className="text-2xl font-bold text-gray-500">
                {
                  filteredViolations.filter((v) => v.status === 'suppressed').length
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
