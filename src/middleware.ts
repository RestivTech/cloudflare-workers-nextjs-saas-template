import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

/**
 * Global middleware for request/response handling
 * Handles error logging, security headers, request tracing
 */
export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  // Log request
  log.debug('Incoming request', {
    requestId,
    method: request.method,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
  })

  try {
    // Create response
    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Add security headers
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-content-type-options', 'nosniff')
    response.headers.set('x-frame-options', 'SAMEORIGIN')
    response.headers.set('x-xss-protection', '1; mode=block')
    response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'permissions-policy',
      'geolocation=(), microphone=(), camera=()'
    )

    // CORS headers (if needed)
    const origin = request.headers.get('origin')
    if (origin && process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.includes(origin)) {
      response.headers.set('access-control-allow-origin', origin)
      response.headers.set(
        'access-control-allow-methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      )
      response.headers.set('access-control-allow-headers', 'Content-Type')
    }

    // Log response
    const duration = Date.now() - startTime
    log.debug('Request completed', {
      requestId,
      status: response.status,
      duration,
      pathname: request.nextUrl.pathname,
    })

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    log.error('Middleware error', error, {
      requestId,
      duration,
      pathname: request.nextUrl.pathname,
    })

    // Return error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        requestId,
      },
      { status: 500 }
    )
  }
}

/**
 * Matcher configuration - apply middleware to specific paths
 * Exclude static files, API health check, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
