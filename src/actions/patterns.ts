'use server'

import { PatternFormData } from '@/src/lib/schemas'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export async function createPattern(data: PatternFormData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pattern-compliance/patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create pattern: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating pattern:', error)
    throw error
  }
}

export async function updatePattern(id: string, data: PatternFormData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/patterns/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update pattern: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating pattern:', error)
    throw error
  }
}

export async function deletePattern(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/patterns/${id}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete pattern: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting pattern:', error)
    throw error
  }
}

export async function getPattern(id: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/pattern-compliance/patterns/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch pattern: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pattern:', error)
    throw error
  }
}
