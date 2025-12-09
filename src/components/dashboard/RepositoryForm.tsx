'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { repositorySchema, type RepositoryFormData } from '@/src/lib/schemas'
import { X, Plus } from 'lucide-react'

interface RepositoryFormProps {
  initialData?: RepositoryFormData & { id?: string }
  onSubmit: (data: RepositoryFormData) => Promise<void>
  isLoading?: boolean
}

export function RepositoryForm({ initialData, onSubmit, isLoading }: RepositoryFormProps) {
  const [patterns, setPatterns] = useState<any[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(
    initialData?.patterns || []
  )

  useEffect(() => {
    // Fetch available patterns
    const fetchPatterns = async () => {
      try {
        const response = await fetch(
          '/api/pattern-compliance/patterns?limit=100'
        )
        if (response.ok) {
          const result = await response.json()
          setPatterns(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching patterns:', error)
      }
    }

    fetchPatterns()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RepositoryFormData>({
    resolver: zodResolver(repositorySchema),
    defaultValues: initialData || {
      scan_frequency: 'weekly',
      is_public: false,
      auto_create_tickets: false,
      ticket_system: 'github',
    },
  })

  const onSubmitForm = async (data: RepositoryFormData) => {
    if (selectedPatterns.length === 0) {
      alert('Please select at least one pattern')
      return
    }

    await onSubmit({
      ...data,
      patterns: selectedPatterns,
    })
  }

  const togglePattern = (patternId: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(patternId)
        ? prev.filter((id) => id !== patternId)
        : [...prev, patternId]
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Repository Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Repository Name *
        </label>
        <input
          type="text"
          placeholder="e.g., restiv-infrastructure"
          {...register('name')}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Repository URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Repository URL *
        </label>
        <input
          type="url"
          placeholder="https://github.com/organization/repository"
          {...register('url')}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.url && (
          <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Owner Team */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Owner Team (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., platform-team"
            {...register('owner_team')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Scan Frequency */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Scan Frequency *
          </label>
          <select
            {...register('scan_frequency')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="manual">Manual</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {errors.scan_frequency && (
            <p className="text-red-500 text-sm mt-1">{errors.scan_frequency.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Is Public */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_public')}
              className="w-4 h-4 border border-border rounded"
            />
            <span className="text-sm font-medium text-foreground">Public Repository</span>
          </label>
        </div>

        {/* Auto Create Tickets */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('auto_create_tickets')}
              className="w-4 h-4 border border-border rounded"
            />
            <span className="text-sm font-medium text-foreground">Auto-create Tickets</span>
          </label>
        </div>
      </div>

      {/* Ticket System (conditional) */}
      {watch('auto_create_tickets') && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ticket System
          </label>
          <select
            {...register('ticket_system')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="github">GitHub Issues</option>
            <option value="jira">Jira</option>
            <option value="gitlab">GitLab Issues</option>
          </select>
        </div>
      )}

      {/* Pattern Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Patterns to Apply * ({selectedPatterns.length} selected)
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {patterns.length > 0 ? (
            patterns.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => togglePattern(pattern.id)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedPatterns.includes(pattern.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{pattern.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{pattern.category}</div>
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              <p>No patterns available. Create patterns first.</p>
            </div>
          )}
        </div>
        {selectedPatterns.length === 0 && patterns.length > 0 && (
          <p className="text-red-500 text-sm">Please select at least one pattern</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Repository'}
        </button>
        <a
          href="/repositories"
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
