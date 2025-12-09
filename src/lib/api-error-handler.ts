import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

/**
 * API error types for standardized error responses
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
  }
}

/**
 * Standard API response format
 */
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
    requestId: string
  }
}

/**
 * Wrapper function for API route handlers
 * Provides error handling, logging, and Sentry integration
 */
export function withErrorHandler<T = unknown>(
  handler: (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ) => {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
    const startTime = Date.now()

    try {
      // Execute handler
      const response = await handler(request, context)

      // Log successful response
      const duration = Date.now() - startTime
      if (response.status >= 400) {
        log.warn('API error response', {
          requestId,
          method: request.method,
          pathname: request.nextUrl.pathname,
          status: response.status,
          duration,
        })
      } else {
        log.info('API request completed', {
          requestId,
          method: request.method,
          pathname: request.nextUrl.pathname,
          status: response.status,
          duration,
        })
      }

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId)
      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Handle known API errors
      if (error instanceof ApiError) {
        log.warn('API error', {
          requestId,
          method: request.method,
          pathname: request.nextUrl.pathname,
          statusCode: error.statusCode,
          code: error.code,
          message: error.message,
          duration,
        })

        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code || 'INTERNAL_ERROR',
              message: error.message,
              details: error instanceof ValidationError ? error.details : undefined,
              requestId,
            },
          } as ApiResponse,
          { status: error.statusCode, headers: { 'x-request-id': requestId } }
        )
      }

      // Handle unexpected errors
      const errorId = Sentry.captureException(error, {
        tags: {
          component: 'api-handler',
          method: request.method,
          pathname: request.nextUrl.pathname,
        },
        contexts: {
          request: {
            requestId,
            duration,
          },
        },
      })

      log.error('Unexpected API error', error, {
        requestId,
        method: request.method,
        pathname: request.nextUrl.pathname,
        duration,
        errorId,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            requestId,
          },
        } as ApiResponse,
        { status: 500, headers: { 'x-request-id': requestId } }
      )
    }
  }
}

/**
 * Input validation helper
 */
export function validateInput<T>(
  data: unknown,
  schema: {
    validate: (data: unknown) => { error?: { message: string; details?: Record<string, string> }; value?: T }
  }
): T {
  const result = schema.validate(data)

  if (result.error) {
    throw new ValidationError(
      result.error.message,
      result.error.details
    )
  }

  return result.value as T
}

/**
 * Rate limiting helper (basic in-memory, use Redis for production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // Create new entry
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count < limit) {
    entry.count++
    return true
  }

  return false
}
