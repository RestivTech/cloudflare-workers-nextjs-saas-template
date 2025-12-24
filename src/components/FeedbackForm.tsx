'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useCreateFeedback } from '@/hooks/useFeedback'
import type { FeedbackCreateRequest } from '@/hooks/useFeedback'

interface FeedbackFormProps {
  incidentId: number
  onSuccess?: () => void
}

export function FeedbackForm({ incidentId, onSuccess }: FeedbackFormProps) {
  const [form, setForm] = useState({
    falsePositive: false,
    actionEffectiveness: 50,
    confidenceScore: 75,
    rootCause: '',
    suggestedAction: '',
    feedbackType: 'true-positive',
  })

  const createFeedbackMutation = useCreateFeedback()

  const handleSubmit = async () => {
    try {
      const request: FeedbackCreateRequest = {
        incident_id: incidentId,
        false_positive: form.falsePositive,
        action_effectiveness: form.actionEffectiveness,
        confidence_score: form.confidenceScore,
        root_cause: form.rootCause || undefined,
        suggested_action: form.suggestedAction || undefined,
        feedback_type: form.feedbackType,
      }

      await createFeedbackMutation.mutateAsync(request)

      // Reset form
      setForm({
        falsePositive: false,
        actionEffectiveness: 50,
        confidenceScore: 75,
        rootCause: '',
        suggestedAction: '',
        feedbackType: 'true-positive',
      })

      onSuccess?.()
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* False Positive Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.falsePositive}
            onChange={(e) => setForm({ ...form, falsePositive: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">This was a false positive</span>
        </label>
      </div>

      {/* Feedback Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
        <select
          value={form.feedbackType}
          onChange={(e) => setForm({ ...form, feedbackType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="true-positive">True Positive</option>
          <option value="false-positive">False Positive</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Action Effectiveness */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Action Effectiveness: {form.actionEffectiveness}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={form.actionEffectiveness}
          onChange={(e) => setForm({ ...form, actionEffectiveness: parseInt(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">How effective was the recommended action?</p>
      </div>

      {/* Confidence Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confidence Score: {form.confidenceScore}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={form.confidenceScore}
          onChange={(e) => setForm({ ...form, confidenceScore: parseInt(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">How confident are you in this diagnosis?</p>
      </div>

      {/* Root Cause */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Root Cause</label>
        <textarea
          value={form.rootCause}
          onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
          placeholder="Describe the root cause of this incident..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Suggested Action */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Action</label>
        <textarea
          value={form.suggestedAction}
          onChange={(e) => setForm({ ...form, suggestedAction: e.target.value })}
          placeholder="Suggest remediation steps for future occurrences..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={createFeedbackMutation.isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {createFeedbackMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Feedback'
        )}
      </button>

      {/* Error Message */}
      {createFeedbackMutation.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to submit feedback. Please try again.</span>
        </div>
      )}

      {/* Success Message */}
      {createFeedbackMutation.isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Feedback submitted successfully!</span>
        </div>
      )}
    </div>
  )
}
