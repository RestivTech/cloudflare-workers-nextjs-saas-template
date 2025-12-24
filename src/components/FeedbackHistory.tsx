'use client'

import { format } from 'date-fns'
import { CheckCircle, XCircle } from 'lucide-react'
import type { Feedback } from '@/hooks/useFeedback'

interface FeedbackHistoryProps {
  feedback: Feedback[]
  isLoading?: boolean
}

export function FeedbackHistory({ feedback, isLoading }: FeedbackHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-gray-400">Loading feedback history...</div>
      </div>
    )
  }

  if (feedback.length === 0) {
    return <p className="text-center text-gray-500 py-8">No feedback submitted yet</p>
  }

  return (
    <div className="space-y-4">
      {feedback.map((item, idx) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Feedback #{idx + 1}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                {item.user_email && ` by ${item.user_email}`}
              </p>
            </div>
            <div className="flex gap-2">
              {item.false_positive ? (
                <XCircle className="h-5 w-5 text-red-500" title="False Positive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" title="True Positive" />
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.action_effectiveness !== null && (
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Action Effectiveness</p>
                <p className="text-sm font-semibold text-gray-900">{item.action_effectiveness}%</p>
              </div>
            )}
            {item.confidence_score !== null && (
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Confidence Score</p>
                <p className="text-sm font-semibold text-gray-900">{item.confidence_score}%</p>
              </div>
            )}
          </div>

          {/* Root Cause */}
          {item.root_cause && (
            <div>
              <p className="text-xs text-gray-500">Root Cause</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{item.root_cause}</p>
            </div>
          )}

          {/* Suggested Action */}
          {item.suggested_action && (
            <div>
              <p className="text-xs text-gray-500">Suggested Action</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{item.suggested_action}</p>
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
              {item.feedback_type || 'general'}
            </span>
            {item.scan_type && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                {item.scan_type}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
