'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { usePatterns } from '@/src/hooks/usePatterns'

export default function PatternsPage() {
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    severity: '',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = usePatterns({
    category: filters.category || undefined,
    status: filters.status || undefined,
    severity: filters.severity || undefined,
  })

  const patterns = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patterns</h1>
          <p className="text-muted-foreground mt-1">
            Manage detection patterns for your organization
          </p>
        </div>
        <Link
          href="/patterns/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Pattern
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">All Categories</option>
            <option value="Security">Security</option>
            <option value="Architecture">Architecture</option>
            <option value="CodeStyle">Code Style</option>
            <option value="Performance">Performance</option>
            <option value="Testing">Testing</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Patterns List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading patterns...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          Failed to load patterns. Please try again.
        </div>
      ) : patterns.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No patterns found</p>
          <Link
            href="/patterns/new"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create your first pattern
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {patterns.map((pattern: any) => (
            <Link
              key={pattern.id}
              href={`/patterns/${pattern.id}`}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{pattern.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pattern.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                      {pattern.category}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${getSeverityColor(
                        pattern.severity
                      )}`}
                    >
                      {pattern.severity}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(
                        pattern.status
                      )}`}
                    >
                      {pattern.status}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>v{pattern.version}</p>
                  <p className="text-xs mt-1">
                    {new Date(pattern.updated_at).toLocaleDateString()}
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

function getSeverityColor(severity: string): string {
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

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'deprecated':
      return 'bg-yellow-100 text-yellow-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
