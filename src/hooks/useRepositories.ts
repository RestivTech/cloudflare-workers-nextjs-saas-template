'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface RepositoryFilters {
  ownerTeam?: string
  scanFrequency?: string
  limit?: number
  offset?: number
}

interface Repository {
  id: string
  name: string
  url: string
  owner_team: string
  patterns: string[]
  scan_frequency: string
  last_scan_at: string
  last_scan_status: string
  is_public: boolean
  auto_create_tickets: boolean
  ticket_system?: string
  created_at: string
  updated_at: string
  created_by: string
}

/**
 * Fetch all repositories with optional filtering
 */
export function useRepositories(filters?: RepositoryFilters) {
  return useQuery({
    queryKey: ['repositories', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.ownerTeam) params.append('ownerTeam', filters.ownerTeam)
      if (filters?.scanFrequency) params.append('scanFrequency', filters.scanFrequency)
      if (filters?.limit) params.append('limit', String(filters.limit))
      if (filters?.offset) params.append('offset', String(filters.offset))

      const response = await fetch(
        `/api/pattern-compliance/repositories?${params.toString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch repositories')
      return response.json()
    },
  })
}

/**
 * Fetch single repository by ID
 */
export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repository', id],
    queryFn: async () => {
      const response = await fetch(`/api/pattern-compliance/repositories/${id}`)
      if (!response.ok) throw new Error('Failed to fetch repository')
      return response.json()
    },
    enabled: !!id,
  })
}

/**
 * Create repository mutation
 */
export function useCreateRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Repository>) => {
      const response = await fetch('/api/pattern-compliance/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create repository')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    },
  })
}

/**
 * Update repository mutation
 */
export function useUpdateRepository(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Repository>) => {
      const response = await fetch(`/api/pattern-compliance/repositories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update repository')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      queryClient.invalidateQueries({ queryKey: ['repository', id] })
    },
  })
}

/**
 * Delete repository mutation
 */
export function useDeleteRepository(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/pattern-compliance/repositories/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete repository')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      queryClient.invalidateQueries({ queryKey: ['repository', id] })
    },
  })
}
