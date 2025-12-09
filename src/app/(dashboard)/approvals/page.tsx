'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Clock, CheckCircle } from 'lucide-react'

interface Approval {
  id: string
  violation_id: string
  violation_file_path: string
  violation_pattern: string
  violation_severity: string
  repository_name: string
  approval_status: string
  created_at: string
  updated_at: string
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date')

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        '/api/pattern-compliance/approvals?limit=100',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch approvals')
      }

      const result = await response.json()
      setApprovals(result.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load approvals'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApprovals = approvals
    .filter((approval) => {
      const matchesSearch =
        approval.violation_file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.violation_pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.repository_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filterStatus || approval.approval_status === filterStatus

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      // Sort by severity
      const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
      return (
        (severityOrder[b.violation_severity as keyof typeof severityOrder] || 0) -
        (severityOrder[a.violation_severity as keyof typeof severityOrder] || 0)
      )
    })

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingCount = approvals.filter((a) => a.approval_status === 'pending').length
  const approvedCount = approvals.filter((a) => a.approval_status === 'approved').length
  const rejectedCount = approvals.filter((a) => a.approval_status === 'rejected').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approvals Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve compliance violations that require decision
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search approvals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="date">Sort: Date (Newest)</option>
            <option value="severity">Sort: Severity</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          Failed to load approvals. Please try again.
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {filterStatus && filterStatus !== 'pending'
              ? 'No matching approvals'
              : 'No pending approvals'}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {filterStatus && filterStatus !== 'pending'
              ? 'Try adjusting your filters'
              : 'All violations are either approved or rejected'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredApprovals.map((approval: Approval) => (
            <Link
              key={approval.id}
              href={`/approvals/${approval.id}`}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">
                      {approval.violation_pattern}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 truncate">
                    {approval.violation_file_path}
                  </p>

                  <p className="text-sm text-muted-foreground mb-3">
                    {approval.repository_name}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${getSeverityColor(
                        approval.violation_severity
                      )}`}
                    >
                      {approval.violation_severity}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded capitalize ${getStatusColor(
                        approval.approval_status
                      )}`}
                    >
                      {approval.approval_status}
                    </span>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <p>{new Date(approval.created_at).toLocaleDateString()}</p>
                  <p className="text-xs mt-1">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(approval.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                    d old
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
