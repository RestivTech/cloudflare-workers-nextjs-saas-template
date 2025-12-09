'use client'

import { ViolationStatusData } from '@/src/lib/schemas'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export async function getViolations(
  filters?: Record<string, any>
) {
  try {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/violations?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch violations: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching violations:', error)
    throw error
  }
}

export async function getViolation(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/violations/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch violation: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching violation:', error)
    throw error
  }
}

export async function updateViolationStatus(
  id: string,
  data: ViolationStatusData
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/violations/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update violation: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating violation:', error)
    throw error
  }
}

export async function getViolationHistory(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/violations/${id}/history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch violation history: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching violation history:', error)
    throw error
  }
}

export async function suppressViolation(id: string, reason?: string) {
  return updateViolationStatus(id, {
    status: 'suppressed',
    status_comment: reason,
  })
}

export async function resolveViolation(id: string, comment?: string) {
  return updateViolationStatus(id, {
    status: 'resolved',
    status_comment: comment,
  })
}

export async function reopenViolation(id: string, reason?: string) {
  return updateViolationStatus(id, {
    status: 'open',
    status_comment: reason,
  })
}
