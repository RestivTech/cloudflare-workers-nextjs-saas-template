'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Check, X } from 'lucide-react'

interface Approval {
  id: string
  violation_id: string
  violation_file_path: string
  violation_line_number: number
  violation_pattern: string
  violation_severity: string
  violation_details: string
  violation_code_context: string
  repository_name: string
  repository_id: string
  approval_status: string
  created_at: string
  updated_at: string
  decision_reason?: string
}

export default function ApprovalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const approvalId = params.id as string

  const [approval, setApproval] = useState<Approval | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchApproval()
  }, [approvalId])

  const fetchApproval = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/pattern-compliance/approvals/${approvalId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch approval')
      }

      const result = await response.json()
      setApproval(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load approval'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decision) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(
        `/api/pattern-compliance/approvals/${approvalId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: decision,
            decision_reason: reason || undefined,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to submit decision: ${response.statusText}`)
      }

      // Redirect back to approvals queue
      router.push('/approvals?status=completed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit decision'
      setError(message)
      console.error('Error submitting decision:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/approvals" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!approval) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/approvals" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Approval not found</p>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            ⏳ Pending Decision
          </span>
        )
      case 'approved':
        return (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
            <Check className="w-4 h-4" /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center gap-1">
            <X className="w-4 h-4" /> Rejected
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/approvals" className="p-2 hover:bg-accent rounded-lg transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                {approval.violation_pattern}
              </h1>
              {getStatusBadge(approval.approval_status)}
            </div>
            <p className="text-muted-foreground">
              {approval.violation_file_path}:{approval.violation_line_number}
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
                  href={`/repositories/${approval.repository_id}`}
                  className="text-primary hover:underline"
                >
                  {approval.repository_name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Severity
                </p>
                <span
                  className={`inline-block px-2 py-1 text-sm rounded ${getSeverityColor(
                    approval.violation_severity
                  )}`}
                >
                  {approval.violation_severity}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Violation Details
              </p>
              <p className="text-foreground whitespace-pre-wrap">
                {approval.violation_details || 'No additional details'}
              </p>
            </div>

            {approval.violation_code_context && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Code Context
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{approval.violation_code_context}</code>
                </pre>
              </div>
            )}

            <div className="pt-4 border-t border-border text-sm text-muted-foreground">
              <p>
                Requested for Approval:{' '}
                {new Date(approval.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Decision History */}
          {approval.decision_reason && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Decision Details
              </h2>
              <div
                className={`p-3 rounded ${
                  approval.approval_status === 'approved'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="font-medium capitalize text-sm mb-2">
                  {approval.approval_status}
                </p>
                <p className="text-sm">{approval.decision_reason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Decision Form */}
        <div>
          <div
            className={`bg-card border rounded-lg p-6 sticky top-6 space-y-4 ${
              approval.approval_status === 'pending'
                ? 'border-border'
                : 'border-gray-300 opacity-75'
            }`}
          >
            <h2 className="text-lg font-semibold text-foreground">
              {approval.approval_status === 'pending' ? 'Make a Decision' : 'Decision Made'}
            </h2>

            {approval.approval_status === 'pending' ? (
              <form onSubmit={handleDecision} className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={(e) => setDecision(e.target.value as 'approve')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-foreground">Approve</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={decision === 'reject'}
                      onChange={(e) => setDecision(e.target.value as 'reject')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-foreground">Reject</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Add a note explaining your decision..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !decision}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    decision === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : decision === 'reject'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Decision'}
                </button>

                <Link
                  href="/approvals"
                  className="block w-full text-center px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  Skip for Now
                </Link>
              </form>
            ) : (
              <div
                className={`p-4 rounded text-sm space-y-2 ${
                  approval.approval_status === 'approved'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className="font-medium flex items-center gap-2">
                  {approval.approval_status === 'approved' ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" /> Approved
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-600" /> Rejected
                    </>
                  )}
                </p>
                {approval.decision_reason && (
                  <p className="text-xs">{approval.decision_reason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
