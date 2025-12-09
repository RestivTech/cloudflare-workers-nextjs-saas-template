'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PatternForm } from '@/src/components/dashboard/PatternForm'
import { type PatternFormData } from '@/src/lib/schemas'
import { updatePattern, deletePattern, getPattern } from '@/src/actions/patterns'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function PatternDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patternId = params.id as string

  const [pattern, setPattern] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchPattern()
  }, [patternId])

  const fetchPattern = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getPattern(patternId)
      setPattern(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pattern'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: PatternFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)

      await updatePattern(patternId, data)

      setIsEditing(false)
      await fetchPattern()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update pattern'
      setError(message)
      console.error('Error updating pattern:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsSubmitting(true)
      await deletePattern(patternId)
      router.push('/patterns')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete pattern'
      setError(message)
      console.error('Error deleting pattern:', err)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/patterns" className="p-2 hover:bg-accent rounded-lg transition-colors">
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

  if (!pattern) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/patterns" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Pattern not found</p>
          <Link href="/patterns" className="text-primary hover:underline mt-2 inline-block">
            Back to patterns
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
          <Link href="/patterns" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{pattern.name}</h1>
            <p className="text-muted-foreground mt-1">v{pattern.version}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
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
          <p className="font-medium mb-4">Delete this pattern?</p>
          <p className="text-sm mb-4">
            This action cannot be undone. The pattern will be permanently deleted.
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
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Description
            </h2>
            <p className="text-foreground">{pattern.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
              <p className="px-2 py-1 bg-accent text-accent-foreground text-sm rounded w-fit">
                {pattern.category}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Severity</h3>
              <p className="text-foreground">{pattern.severity}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <p className="text-foreground capitalize">{pattern.status}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Detection Method
            </h3>
            <p className="text-foreground capitalize">{pattern.detection_method}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              File Patterns
            </h3>
            <div className="flex flex-wrap gap-2">
              {pattern.file_patterns?.map((p: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {pattern.exclusion_patterns?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Exclusion Patterns
              </h3>
              <div className="flex flex-wrap gap-2">
                {pattern.exclusion_patterns.map((p: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-destructive/20 text-destructive text-sm rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Remediation Guidance
            </h3>
            <p className="text-foreground whitespace-pre-wrap">{pattern.remediation_guidance}</p>
          </div>

          {pattern.remediation_link && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Remediation Link
              </h3>
              <a
                href={pattern.remediation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {pattern.remediation_link}
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            <p>Created: {new Date(pattern.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(pattern.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Edit Pattern</h2>
            <p className="text-sm text-muted-foreground mt-1">Update the pattern details below</p>
          </div>
          <PatternForm
            initialData={pattern}
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
