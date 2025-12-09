'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RepositoryForm } from '@/src/components/dashboard/RepositoryForm'
import { type RepositoryFormData } from '@/src/lib/schemas'
import {
  updateRepository,
  deleteRepository,
  getRepository,
  triggerRepositoryScan,
} from '@/src/actions/repositories'
import Link from 'next/link'
import { ArrowLeft, Trash2, Play } from 'lucide-react'

export default function RepositoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const repositoryId = params.id as string

  const [repository, setRepository] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanLoading, setIsScanLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchRepository()
  }, [repositoryId])

  const fetchRepository = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getRepository(repositoryId)
      setRepository(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load repository'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: RepositoryFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      await updateRepository(repositoryId, data)

      setIsEditing(false)
      await fetchRepository()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update repository'
      setError(message)
      console.error('Error updating repository:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsSubmitting(true)
      await deleteRepository(repositoryId)
      router.push('/repositories')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete repository'
      setError(message)
      console.error('Error deleting repository:', err)
      setIsSubmitting(false)
    }
  }

  const handleTriggerScan = async () => {
    try {
      setIsScanLoading(true)
      setError(null)
      await triggerRepositoryScan(repositoryId)
      // Show success message
      alert('Scan triggered successfully')
      await fetchRepository()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trigger scan'
      setError(message)
      console.error('Error triggering scan:', err)
    } finally {
      setIsScanLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/repositories" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
        </div>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/repositories" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Repository not found</p>
          <Link href="/repositories" className="text-primary hover:underline mt-2 inline-block">
            Back to repositories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/repositories" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{repository.name}</h1>
            <p className="text-muted-foreground mt-1">{repository.url}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={handleTriggerScan}
                disabled={isScanLoading}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isScanLoading ? 'Scanning...' : 'Scan Now'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium mb-4">Delete this repository?</p>
          <p className="text-sm mb-4">
            This action cannot be undone. The repository will be permanently deleted.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View/Edit Mode */}
      {!isEditing ? (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Scan Frequency</h3>
              <p className="px-2 py-1 bg-accent text-accent-foreground text-sm rounded w-fit capitalize">
                {repository.scan_frequency}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Owner Team</h3>
              <p className="text-foreground">{repository.owner_team || 'Not assigned'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Visibility</h3>
              <p className="text-foreground">{repository.is_public ? 'Public' : 'Private'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Patterns Applied
            </h3>
            <div className="flex flex-wrap gap-2">
              {repository.patterns && repository.patterns.length > 0 ? (
                repository.patterns.map((pattern: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded">
                    {typeof pattern === 'string' ? pattern : pattern.name}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground">No patterns assigned</p>
              )}
            </div>
          </div>

          {repository.auto_create_tickets && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Ticket System
              </h3>
              <p className="text-foreground capitalize">{repository.ticket_system}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            <p>Last Scan: {repository.last_scan_at
              ? new Date(repository.last_scan_at).toLocaleDateString()
              : 'Never'}</p>
            <p>Total Scans: {repository.scan_count || 0}</p>
            <p>Created: {new Date(repository.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Edit Repository</h2>
            <p className="text-sm text-muted-foreground mt-1">Update repository details below</p>
          </div>
          <RepositoryForm
            initialData={repository}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
          <button
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
            className="mt-4 px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
