'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PatternForm } from '@/src/components/dashboard/PatternForm'
import { type PatternFormData } from '@/src/lib/schemas'
import { createPattern } from '@/src/actions/patterns'
import Link from 'next/link'

export default function NewPatternPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: PatternFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      await createPattern(data)

      router.push('/patterns')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pattern'
      setError(message)
      console.error('Error creating pattern:', err)
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
            <h1 className="text-3xl font-bold text-foreground">Create New Pattern</h1>
            <p className="text-muted-foreground mt-1">
              Define a new detection pattern for your organization
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <p className="font-medium">Error creating pattern</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <PatternForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Pattern Guidelines</h3>
        <ul className="text-sm space-y-1">
          <li>• Use meaningful names that describe what the pattern detects</li>
          <li>• Provide detailed remediation guidance to help teams fix violations</li>
          <li>• Select appropriate severity level based on business impact</li>
          <li>• File patterns support glob syntax (e.g., *.ts, src/**/*.js)</li>
          <li>• Test your pattern on a small repository before organization-wide rollout</li>
        </ul>
      </div>
    </div>
  )
}
