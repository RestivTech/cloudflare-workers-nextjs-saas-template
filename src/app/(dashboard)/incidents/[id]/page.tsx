'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useFeedback, useCreateFeedback, useUpdateScanType } from '@/hooks/useFeedback'
import { AlertCircle, Loader2, ChevronDown, CheckCircle, XCircle } from 'lucide-react'

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const incidentId = parseInt(params.id as string)

  const [activeTab, setActiveTab] = useState<'overview' | 'feedback-history' | 'submit-feedback'>('overview')
  const [feedbackForm, setFeedbackForm] = useState({
    falsePositive: false,
    actionEffectiveness: 50,
    confidenceScore: 75,
    rootCause: '',
    suggestedAction: '',
    feedbackType: 'true-positive',
  })

  const { data: incidentData, isLoading, error } = useFeedback(incidentId)
  const createFeedbackMutation = useCreateFeedback()
  const updateScanTypeMutation = useUpdateScanType('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !incidentData) {
    return (
      <div className="p-6 flex items-center gap-3 text-red-700 bg-red-50 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load incident details. Please try again.</span>
      </div>
    )
  }

  const incident = incidentData
  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const handleSubmitFeedback = async () => {
    try {
      await createFeedbackMutation.mutateAsync({
        incident_id: incidentId,
        false_positive: feedbackForm.falsePositive,
        action_effectiveness: feedbackForm.actionEffectiveness,
        confidence_score: feedbackForm.confidenceScore,
        root_cause: feedbackForm.rootCause || undefined,
        suggested_action: feedbackForm.suggestedAction || undefined,
        feedback_type: feedbackForm.feedbackType,
      })

      // Reset form
      setFeedbackForm({
        falsePositive: false,
        actionEffectiveness: 50,
        confidenceScore: 75,
        rootCause: '',
        suggestedAction: '',
        feedbackType: 'true-positive',
      })

      // Switch to feedback history tab
      setActiveTab('feedback-history')
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Details</h1>
          <p className="text-gray-600 mt-1">ID: {incident.id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-md"
        >
          Back
        </button>
      </div>

      {/* Incident Overview Card */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Pod Name</label>
              <p className="text-lg font-semibold text-gray-900">{incident.pod_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Namespace</label>
              <p className="text-lg font-semibold text-gray-900">{incident.namespace}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Alert Name</label>
              <p className="text-lg font-semibold text-gray-900">{incident.alert_name}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Severity</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColor(incident.severity)}`}>
                {incident.severity || 'Unknown'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Anomaly Score</label>
              <p className="text-lg font-semibold text-gray-900">
                {incident.anomaly_score ? `${(incident.anomaly_score * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Feedback Count</label>
              <p className="text-lg font-semibold text-gray-900">{incident.feedback_count}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-sm text-gray-900">{format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm:ss')}</p>
            </div>
            {incident.resolved_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Resolved At</label>
                <p className="text-sm text-gray-900">{format(new Date(incident.resolved_at), 'MMM dd, yyyy HH:mm:ss')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {['overview', 'feedback-history', 'submit-feedback'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'feedback-history' && `Feedback History (${incident.feedback.length})`}
              {tab === 'submit-feedback' && 'Submit Feedback'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Pod Name</p>
                  <p className="text-lg font-semibold">{incident.pod_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Namespace</p>
                  <p className="text-lg font-semibold">{incident.namespace}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Alert</p>
                  <p className="text-lg font-semibold">{incident.alert_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Severity</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityColor(incident.severity)}`}>
                    {incident.severity || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback History Tab */}
          {activeTab === 'feedback-history' && (
            <div className="space-y-4">
              {incident.feedback.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No feedback submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {incident.feedback.map((feedback, idx) => (
                    <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Feedback #{idx + 1}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}
                            {feedback.user_email && ` by ${feedback.user_email}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {feedback.false_positive ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feedback.action_effectiveness !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Action Effectiveness</p>
                            <p className="text-sm font-semibold">{feedback.action_effectiveness}%</p>
                          </div>
                        )}
                        {feedback.confidence_score !== null && (
                          <div>
                            <p className="text-xs text-gray-500">Confidence Score</p>
                            <p className="text-sm font-semibold">{feedback.confidence_score}%</p>
                          </div>
                        )}
                      </div>

                      {feedback.root_cause && (
                        <div>
                          <p className="text-xs text-gray-500">Root Cause</p>
                          <p className="text-sm text-gray-900">{feedback.root_cause}</p>
                        </div>
                      )}

                      {feedback.suggested_action && (
                        <div>
                          <p className="text-xs text-gray-500">Suggested Action</p>
                          <p className="text-sm text-gray-900">{feedback.suggested_action}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {feedback.feedback_type || 'general'}
                        </span>
                        {feedback.scan_type && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {feedback.scan_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Feedback Tab */}
          {activeTab === 'submit-feedback' && (
            <div className="space-y-6 max-w-2xl">
              {/* False Positive Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedbackForm.falsePositive}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, falsePositive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">This was a false positive</span>
                </label>
              </div>

              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
                <select
                  value={feedbackForm.feedbackType}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value })}
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
                  Action Effectiveness: {feedbackForm.actionEffectiveness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={feedbackForm.actionEffectiveness}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, actionEffectiveness: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">How effective was the recommended action?</p>
              </div>

              {/* Confidence Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Score: {feedbackForm.confidenceScore}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={feedbackForm.confidenceScore}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, confidenceScore: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">How confident are you in this diagnosis?</p>
              </div>

              {/* Root Cause */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Root Cause</label>
                <textarea
                  value={feedbackForm.rootCause}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rootCause: e.target.value })}
                  placeholder="Describe the root cause of this incident..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Suggested Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Action</label>
                <textarea
                  value={feedbackForm.suggestedAction}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestedAction: e.target.value })}
                  placeholder="Suggest remediation steps for future occurrences..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitFeedback}
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

              {createFeedbackMutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>Failed to submit feedback. Please try again.</span>
                </div>
              )}

              {createFeedbackMutation.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Feedback submitted successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
