'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patternSchema, type PatternFormData } from '@/src/lib/schemas'
import { X } from 'lucide-react'

interface PatternFormProps {
  initialData?: PatternFormData
  onSubmit: (data: PatternFormData) => Promise<void>
  isLoading?: boolean
}

export function PatternForm({ initialData, onSubmit, isLoading }: PatternFormProps) {
  const [filePatterns, setFilePatterns] = useState(
    initialData?.file_patterns || ['*.ts', '*.js']
  )
  const [exclusionPatterns, setExclusionPatterns] = useState(
    initialData?.exclusion_patterns || ['node_modules/**']
  )
  const [fileInput, setFileInput] = useState('')
  const [exclusionInput, setExclusionInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PatternFormData>({
    resolver: zodResolver(patternSchema),
    defaultValues: initialData || {
      status: 'active',
      detection_method: 'regex',
      file_patterns: ['*.ts', '*.js'],
    },
  })

  const onSubmitForm = async (data: PatternFormData) => {
    await onSubmit({
      ...data,
      file_patterns: filePatterns,
      exclusion_patterns: exclusionPatterns,
    })
  }

  const addFilePattern = () => {
    if (fileInput.trim()) {
      setFilePatterns([...filePatterns, fileInput.trim()])
      setFileInput('')
    }
  }

  const removeFilePattern = (index: number) => {
    setFilePatterns(filePatterns.filter((_, i) => i !== index))
  }

  const addExclusionPattern = () => {
    if (exclusionInput.trim()) {
      setExclusionPatterns([...exclusionPatterns, exclusionInput.trim()])
      setExclusionInput('')
    }
  }

  const removeExclusionPattern = (index: number) => {
    setExclusionPatterns(exclusionPatterns.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Pattern Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Pattern Name *
        </label>
        <input
          type="text"
          placeholder="e.g., Hardcoded Secrets Detection"
          {...register('name')}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description *
        </label>
        <textarea
          placeholder="Describe what this pattern detects and why it matters..."
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Category *
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select category</option>
            <option value="Security">Security</option>
            <option value="Architecture">Architecture</option>
            <option value="CodeStyle">Code Style</option>
            <option value="Performance">Performance</option>
            <option value="Testing">Testing</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Severity *
          </label>
          <select
            {...register('severity')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          {errors.severity && (
            <p className="text-red-500 text-sm mt-1">{errors.severity.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="deprecated">Deprecated</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Detection Method */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Detection Method *
          </label>
          <select
            {...register('detection_method')}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="regex">Regex</option>
            <option value="semantic">Semantic</option>
            <option value="structural">Structural</option>
          </select>
          {errors.detection_method && (
            <p className="text-red-500 text-sm mt-1">{errors.detection_method.message}</p>
          )}
        </div>
      </div>

      {/* File Patterns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          File Patterns * (e.g., *.ts, src/**/*.js)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={fileInput}
            onChange={(e) => setFileInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFilePattern())}
            placeholder="Add file pattern..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addFilePattern}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filePatterns.map((pattern, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full"
            >
              <span className="text-sm">{pattern}</span>
              <button
                type="button"
                onClick={() => removeFilePattern(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusion Patterns */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Exclusion Patterns (e.g., node_modules/**, **/*.test.ts)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={exclusionInput}
            onChange={(e) => setExclusionInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusionPattern())}
            placeholder="Add exclusion pattern..."
            className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addExclusionPattern}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {exclusionPatterns.map((pattern, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full"
            >
              <span className="text-sm">{pattern}</span>
              <button
                type="button"
                onClick={() => removeExclusionPattern(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Remediation Guidance */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Remediation Guidance *
        </label>
        <textarea
          placeholder="Describe how to fix this pattern violation..."
          {...register('remediation_guidance')}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.remediation_guidance && (
          <p className="text-red-500 text-sm mt-1">{errors.remediation_guidance.message}</p>
        )}
      </div>

      {/* Remediation Link */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Remediation Link (Optional)
        </label>
        <input
          type="url"
          placeholder="https://example.com/fix-guide"
          {...register('remediation_link')}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.remediation_link && (
          <p className="text-red-500 text-sm mt-1">{errors.remediation_link.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Pattern'}
        </button>
        <a
          href="/patterns"
          className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
