'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RepositoryForm } from '@/src/components/dashboard/RepositoryForm'
import { type RepositoryFormData } from '@/src/lib/schemas'
import { createRepository } from '@/src/actions/repositories'
import Link from 'next/link'

export default function NewRepositoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: RepositoryFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await createRepository(data)

      router.push('/repositories')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create repository'
      setError(message)
      console.error('Error creating repository:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Repository</h1>
            <p className="text-muted-foreground mt-1">
              Configure a repository to scan for compliance violations
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Error adding repository</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <RepositoryForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Repository Setup Guide</h3>
        <ul className="text-sm space-y-1">
          <li>• Repository must be accessible via GitHub API or Git URL</li>
          <li>• Select patterns that apply to this repository's codebase</li>
          <li>• Configure scan frequency based on development velocity</li>
          <li>• If auto-tickets is enabled, ensure proper system is configured</li>
          <li>• First scan will run immediately after repository is added</li>
        </ul>
      </div>
    </div>
  )
}
