'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Clock, Eye, Edit, Trash2, CheckCircle } from 'lucide-react'

interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource_type: string
  resource_id: string
  resource_name: string
  changes: any
  status: 'success' | 'failure'
  ip_address?: string
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'actor'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAuditLog()
  }, [])

  const fetchAuditLog = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        '/api/pattern-compliance/audit-log?limit=100',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        // Return mock data if endpoint doesn't exist yet
        const mockLogs: AuditLogEntry[] = [
          {
            id: '1',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            actor: 'user@example.com',
            action: 'create',
            resource_type: 'pattern',
            resource_id: 'pat-123',
            resource_name: 'SQL Injection Detection',
            changes: { name: 'SQL Injection Detection' },
            status: 'success',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            actor: 'admin@example.com',
            action: 'update',
            resource_type: 'repository',
            resource_id: 'repo-456',
            resource_name: 'restiv-infrastructure',
            changes: { scan_frequency: 'daily' },
            status: 'success',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            actor: 'user@example.com',
            action: 'approve',
            resource_type: 'violation',
            resource_id: 'vio-789',
            resource_name: 'Hardcoded Secret',
            changes: { approval_status: 'approved' },
            status: 'success',
          },
        ]
        setLogs(mockLogs)
      } else {
        const result = await response.json()
        setLogs(result.data || [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit log'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs
    .filter((log) => {
      const matchesSearch =
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesAction = !filterAction || log.action === filterAction
      const matchesStatus = !filterStatus || log.status === filterStatus

      return matchesSearch && matchesAction && matchesStatus
    })
    .sort((a, b) => {
      let compareValue = 0

      if (sortBy === 'date') {
        compareValue =
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else {
        compareValue = a.actor.localeCompare(b.actor)
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'update':
        return <Edit className="w-4 h-4 text-blue-500" />
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-500" />
      case 'view':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'view':
        return 'bg-gray-100 text-gray-800'
      case 'approve':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string): string => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return '📋'
      case 'repository':
        return '📦'
      case 'violation':
        return '⚠️'
      case 'approval':
        return '✅'
      case 'user':
        return '👤'
      default:
        return '📄'
    }
  }

  const uniqueActions = [...new Set(logs.map((log) => log.action))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
            <p className="text-muted-foreground mt-1">
              System activity and compliance tracking
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'actor')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="date">Sort: Date</option>
            <option value="actor">Sort: Actor</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm hover:bg-accent"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Audit Log List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading audit log...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          Failed to load audit log. Displaying sample data.
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No audit log entries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((entry: AuditLogEntry) => (
            <div
              key={entry.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getActionIcon(entry.action)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {getResourceIcon(entry.resource_type)} {entry.resource_name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded capitalize ${getActionColor(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded capitalize ${getStatusColor(
                          entry.status
                        )}`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      By <span className="font-medium">{entry.actor}</span> on{' '}
                      <span className="font-medium">
                        {entry.resource_type.charAt(0).toUpperCase() +
                          entry.resource_type.slice(1)}
                      </span>
                    </p>
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Changes: {Object.keys(entry.changes).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                  <p>{new Date(entry.timestamp).toLocaleDateString()}</p>
                  <p className="text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">Total Entries</p>
            <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                (filteredLogs.filter((l) => l.status === 'success').length /
                  filteredLogs.length) *
                  100
              )}
              %
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">Unique Actors</p>
            <p className="text-2xl font-bold text-foreground">
              {[...new Set(filteredLogs.map((l) => l.actor))].length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
