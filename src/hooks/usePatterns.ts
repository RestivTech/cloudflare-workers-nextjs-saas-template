'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface PatternFilters {
  category?: string
  status?: string
  severity?: string
  limit?: number
  offset?: number
}

interface Pattern {
  id: string
  name: string
  description: string
  category: string
  severity: string
  status: string
  detection_method: string
  detection_config: Record<string, any>
  file_patterns: string[]
  exclusion_patterns: string[]
  remediation_guidance: string
  remediation_link: string
  created_at: string
  updated_at: string
  created_by: string
  version: string
}

/**
 * Fetch all patterns with optional filtering
 */
export function usePatterns(filters?: PatternFilters) {
  return useQuery({
    queryKey: ['patterns', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.severity) params.append('severity', filters.severity)
      if (filters?.limit) params.append('limit', String(filters.limit))
      if (filters?.offset) params.append('offset', String(filters.offset))

      const response = await fetch(
        `/api/pattern-compliance/patterns?${params.toString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch patterns')
      return response.json()
    },
  })
}

/**
 * Fetch single pattern by ID
 */
export function usePattern(id: string) {
  return useQuery({
    queryKey: ['pattern', id],
    queryFn: async () => {
      const response = await fetch(`/api/pattern-compliance/patterns/${id}`)
      if (!response.ok) throw new Error('Failed to fetch pattern')
      return response.json()
    },
    enabled: !!id,
  })
}

/**
 * Create pattern mutation
 */
export function useCreatePattern() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Pattern>) => {
      const response = await fetch('/api/pattern-compliance/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create pattern')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
    },
  })
}

/**
 * Update pattern mutation
 */
export function useUpdatePattern(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Pattern>) => {
      const response = await fetch(`/api/pattern-compliance/patterns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update pattern')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      queryClient.invalidateQueries({ queryKey: ['pattern', id] })
    },
  })
}

/**
 * Delete pattern mutation
 */
export function useDeletePattern(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/pattern-compliance/patterns/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete pattern')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      queryClient.invalidateQueries({ queryKey: ['pattern', id] })
    },
  })
}
