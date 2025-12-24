'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Incident {
  id: number
  namespace: string
  pod_name: string
  alert_name: string
  severity?: string
  anomaly_score?: number
  created_at: string
  resolved_at?: string
  feedback_count: number
}

export interface IncidentsListFilters {
  namespace?: string
  scan_type?: string
  severity?: string
  limit?: number
  offset?: number
}

export interface Feedback {
  id: number
  incident_id: number
  false_positive: boolean
  action_effectiveness?: number
  confidence_score?: number
  root_cause?: string
  suggested_action?: string
  feedback_type?: string
  scan_type?: string
  user_email?: string
  created_at: string
}

export interface IncidentWithFeedback {
  id: number
  namespace: string
  pod_name: string
  alert_name: string
  severity?: string
  anomaly_score?: number
  created_at: string
  resolved_at?: string
  feedback_count: number
  feedback: Feedback[]
}

export interface PatternAnalysis {
  scan_type: string
  total_feedback: number
  approval_rate: number
  false_positive_rate: number
  avg_effectiveness: number
  common_root_causes: string[]
  recommendation?: string
}

export interface ScanTypeConfig {
  id: number
  scan_type: string
  feature_flag_enabled: boolean
  execution_mode: string
  escalation_threshold: number
  ml_confidence_threshold: number
  risk_level?: string
  description?: string
  last_updated: string
}

export interface FeedbackCreateRequest {
  incident_id: number
  false_positive: boolean
  action_effectiveness?: number
  confidence_score?: number
  root_cause?: string
  suggested_action?: string
  feedback_type?: string
  scan_type?: string
  user_email?: string
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch list of incidents with feedback counts
 */
export function useIncidents(filters?: IncidentsListFilters) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.namespace) params.append('namespace', filters.namespace)
      if (filters?.scan_type) params.append('scan_type', filters.scan_type)
      if (filters?.severity) params.append('severity', filters.severity)
      if (filters?.limit) params.append('limit', String(filters.limit ?? 20))
      if (filters?.offset) params.append('offset', String(filters.offset ?? 0))

      const response = await fetch(
        `/api/incidents/list/with-feedback?${params.toString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch incidents')
      const data = await response.json()
      return data
    },
  })
}

/**
 * Fetch single incident with feedback history
 */
export function useFeedback(incidentId?: number) {
  return useQuery({
    queryKey: ['feedback', incidentId],
    queryFn: async () => {
      if (!incidentId) throw new Error('Incident ID is required')
      const response = await fetch(
        `/api/incidents/${incidentId}/feedback`
      )
      if (!response.ok) throw new Error('Failed to fetch feedback')
      return response.json() as Promise<IncidentWithFeedback>
    },
    enabled: !!incidentId,
  })
}

/**
 * Fetch pattern analysis for learning loop insights
 */
export function usePatternAnalysis(windowDays: number = 7) {
  return useQuery({
    queryKey: ['pattern-analysis', windowDays],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('window_days', String(windowDays))

      const response = await fetch(
        `/api/patterns/analysis?${params.toString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch pattern analysis')
      const data = await response.json()
      return data as PatternAnalysis[]
    },
  })
}

/**
 * Fetch all scan type configurations
 */
export function useScanTypes() {
  return useQuery({
    queryKey: ['scan-types'],
    queryFn: async () => {
      const response = await fetch('/api/scan-types')
      if (!response.ok) throw new Error('Failed to fetch scan types')
      const data = await response.json()
      return data as ScanTypeConfig[]
    },
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create feedback mutation
 */
export function useCreateFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: FeedbackCreateRequest) => {
      const response = await fetch(
        `/api/incidents/${request.incident_id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      )
      if (!response.ok) throw new Error('Failed to create feedback')
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate incidents list (feedback count changed)
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      // Invalidate specific incident feedback
      queryClient.invalidateQueries({
        queryKey: ['feedback', variables.incident_id]
      })
      // Invalidate pattern analysis (new feedback)
      queryClient.invalidateQueries({ queryKey: ['pattern-analysis'] })
    },
  })
}

/**
 * Update scan type configuration (admin only)
 */
export function useUpdateScanType(scanType: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      execution_mode: string
      escalation_threshold?: number
    }) => {
      const response = await fetch(
        `/api/scan-types/${scanType}/config`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) throw new Error('Failed to update scan type')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate scan types list
      queryClient.invalidateQueries({ queryKey: ['scan-types'] })
      // Invalidate pattern analysis (config affects recommendations)
      queryClient.invalidateQueries({ queryKey: ['pattern-analysis'] })
    },
  })
}
