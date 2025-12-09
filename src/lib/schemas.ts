import { z } from 'zod'

/**
 * Pattern validation schema
 */
export const patternSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['Security', 'Architecture', 'CodeStyle', 'Performance', 'Testing'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low'], {
    errorMap: () => ({ message: 'Invalid severity' }),
  }),
  status: z.enum(['active', 'deprecated', 'archived'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  detection_method: z.enum(['regex', 'semantic', 'structural'], {
    errorMap: () => ({ message: 'Invalid detection method' }),
  }),
  detection_config: z.record(z.any()).optional(),
  file_patterns: z.array(z.string()).min(1, 'At least one file pattern is required'),
  exclusion_patterns: z.array(z.string()).optional(),
  remediation_guidance: z.string().min(10, 'Remediation guidance is required'),
  remediation_link: z.string().url('Invalid remediation link URL').optional(),
  created_by: z.string().optional(),
})

export type PatternFormData = z.infer<typeof patternSchema>

/**
 * Repository validation schema
 */
export const repositorySchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  url: z.string().url('Invalid GitHub repository URL'),
  owner_team: z.string().optional(),
  patterns: z.array(z.string()).min(1, 'At least one pattern is required'),
  scan_frequency: z.enum(['manual', 'daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Invalid scan frequency' }),
  }),
  is_public: z.boolean().optional(),
  auto_create_tickets: z.boolean().optional(),
  ticket_system: z.enum(['github', 'jira', 'gitlab']).optional(),
  created_by: z.string().optional(),
})

export type RepositoryFormData = z.infer<typeof repositorySchema>

/**
 * Violation status update schema
 */
export const violationStatusSchema = z.object({
  status: z.enum(['open', 'resolved', 'suppressed', 'wontfix'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  status_comment: z.string().optional(),
  updated_by: z.string().optional(),
})

export type ViolationStatusData = z.infer<typeof violationStatusSchema>

/**
 * Approval decision schema
 */
export const approvalDecisionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Invalid action' }),
  }),
  approver_id: z.string().min(1, 'Approver ID is required'),
  decision_reason: z.string().optional(),
})

export type ApprovalDecisionData = z.infer<typeof approvalDecisionSchema>

/**
 * Filters schema for patterns
 */
export const patternFiltersSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type PatternFilters = z.infer<typeof patternFiltersSchema>

/**
 * Filters schema for repositories
 */
export const repositoryFiltersSchema = z.object({
  owner_team: z.string().optional(),
  scan_frequency: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type RepositoryFilters = z.infer<typeof repositoryFiltersSchema>

/**
 * Filters schema for violations
 */
export const violationFiltersSchema = z.object({
  status: z.string().optional(),
  approval_status: z.string().optional(),
  severity: z.string().optional(),
  repository_id: z.string().optional(),
  pattern_id: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type ViolationFilters = z.infer<typeof violationFiltersSchema>
