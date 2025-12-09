'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Play } from 'lucide-react'
import { useRepositories } from '@/src/hooks/useRepositories'

export default function RepositoriesPage() {
  const [filters, setFilters] = useState({
    owner_team: '',
    scan_frequency: '',
  })
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useRepositories({
    owner_team: filters.owner_team || undefined,
    scan_frequency: filters.scan_frequency || undefined,
  })

  const repositories = data?.data || []

  const filteredRepositories = repositories.filter((repo: any) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFrequencyColor = (frequency: string): string => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-800'
      case 'weekly':
        return 'bg-purple-100 text-purple-800'
      case 'monthly':
        return 'bg-orange-100 text-orange-800'
      case 'manual':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
          <p className="text-muted-foreground mt-1">
            Manage repositories to scan for compliance violations
          </p>
        </div>
        <Link
          href="/repositories/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repositories..."
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
          <input
            type="text"
            placeholder="Filter by owner team..."
            value={filters.owner_team}
            onChange={(e) => setFilters({ ...filters, owner_team: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          />

          <select
            value={filters.scan_frequency}
            onChange={(e) => setFilters({ ...filters, scan_frequency: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">All Frequencies</option>
            <option value="manual">Manual</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Repositories List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading repositories...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          Failed to load repositories. Please try again.
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No repositories found</p>
          <Link
            href="/repositories/new"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Add your first repository
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRepositories.map((repo: any) => (
            <Link
              key={repo.id}
              href={`/repositories/${repo.id}`}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {repo.url}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                      {repo.scan_frequency}
                    </span>
                    {repo.owner_team && (
                      <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs rounded">
                        {repo.owner_team}
                      </span>
                    )}
                    {repo.is_public && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Public
                      </span>
                    )}
                    {repo.auto_create_tickets && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Auto Tickets
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{repo.patterns?.length || 0} patterns</p>
                  <p className="text-xs mt-1">
                    Scans: {repo.scan_count || 0}
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
