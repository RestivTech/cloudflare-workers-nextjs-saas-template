'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import {
  getViolation,
  updateViolationStatus,
  getViolationHistory,
} from '@/src/actions/violations'

export default function ViolationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const violationId = params.id as string

  const [violation, setViolation] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusComment, setStatusComment] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [violationId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [violationData, historyData] = await Promise.all([
        getViolation(violationId),
        getViolationHistory(violationId),
      ])
      setViolation(violationData)
      setHistory(historyData)
      setSelectedStatus(violationData.status)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load violation'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStatus) return

    try {
      setIsSubmitting(true)
      setError(null)

      await updateViolationStatus(violationId, {
        status: selectedStatus as 'open' | 'resolved' | 'suppressed' | 'wontfix',
        status_comment: statusComment || undefined,
      })

      setStatusComment('')
      await fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update violation'
      setError(message)
      console.error('Error updating violation:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/violations" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!violation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/violations" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Violation not found</p>
        </div>
      </div>
    )
  }

  const getSeverityColor = (severity: string) => {
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

  const getStatusColor = (status: string) => {
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
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/violations" className="p-2 hover:bg-accent rounded-lg transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{violation.pattern_name}</h1>
            <p className="text-muted-foreground mt-2">
              {violation.file_path}:{violation.line_number}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Violation Details */}
        <div className="col-span-2 space-y-4">
          {/* Violation Info */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Repository
                </p>
                <Link
                  href={`/repositories/${violation.repository_id}`}
                  className="text-primary hover:underline"
                >
                  {violation.repository_name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Pattern
                </p>
                <Link
                  href={`/patterns/${violation.pattern_id}`}
                  className="text-primary hover:underline"
                >
                  {violation.pattern_name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Severity
                </p>
                <span className={`inline-block px-2 py-1 text-sm rounded ${getSeverityColor(violation.severity)}`}>
                  {violation.severity}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </p>
                <span className={`inline-block px-2 py-1 text-sm rounded capitalize ${getStatusColor(violation.status)}`}>
                  {violation.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Code Context
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                <code>{violation.code_context || 'No context available'}</code>
              </pre>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Violation Details
              </p>
              <p className="text-foreground whitespace-pre-wrap">
                {violation.violation_details || 'No additional details'}
              </p>
            </div>

            <div className="pt-4 border-t border-border text-sm text-muted-foreground">
              <p>Created: {new Date(violation.created_at).toLocaleString()}</p>
              <p>Last Updated: {new Date(violation.updated_at).toLocaleString()}</p>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">History</h2>
              <div className="space-y-3">
                {history.map((entry: any, index: number) => (
                  <div key={index} className="flex gap-4 pb-3 border-b border-border last:border-0">
                    <div className="flex-shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Status changed to{' '}
                        <span className="capitalize text-primary">{entry.status}</span>
                      </p>
                      {entry.status_comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.status_comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(entry.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status Update Form */}
        <div>
          <div className="bg-card border border-border rounded-lg p-6 sticky top-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Update Status</h2>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="suppressed">Suppressed</option>
                  <option value="wontfix">Won't Fix</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Add a note about this status update..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedStatus === violation.status}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </form>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval Status:</span>
                <span className="font-medium capitalize">{violation.approval_status || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Open:</span>
                <span className="font-medium">
                  {Math.floor(
                    (new Date().getTime() - new Date(violation.created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
