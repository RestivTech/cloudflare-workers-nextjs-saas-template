'use server'

import { RepositoryFormData } from '@/src/lib/schemas'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export async function createRepository(data: RepositoryFormData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/repositories`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create repository: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating repository:', error)
    throw error
  }
}

export async function updateRepository(id: string, data: RepositoryFormData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/repositories/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update repository: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating repository:', error)
    throw error
  }
}

export async function deleteRepository(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/repositories/${id}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete repository: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting repository:', error)
    throw error
  }
}

export async function getRepository(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/repositories/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching repository:', error)
    throw error
  }
}

export async function triggerRepositoryScan(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/repositories/${id}/scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to trigger scan: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error triggering scan:', error)
    throw error
  }
}
