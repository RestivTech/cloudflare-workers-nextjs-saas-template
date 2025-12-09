/**
 * Environment configuration with type-safe validation
 */

const requiredVars = {
  development: [],
  production: [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
  ],
  test: [],
}

const optionalVars = [
  'LOG_LEVEL',
  'NEXT_PUBLIC_ANALYTICS_ID',
  'NEXT_PUBLIC_ENVIRONMENT_NAME',
]

/**
 * Environment configuration object
 */
export const env = {
  // App Configuration
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',

  // Error Tracking (Sentry)
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Logging
  logLevel: (process.env.LOG_LEVEL || 'info') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'fatal',

  // Analytics
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
  environmentName: process.env.NEXT_PUBLIC_ENVIRONMENT_NAME || process.env.NODE_ENV || 'unknown',

  // Feature Flags
  enableDebugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  enableErrorReporting: process.env.NEXT_PUBLIC_ERROR_REPORTING !== 'false',
  enablePerformanceMonitoring: process.env.NEXT_PUBLIC_PERF_MONITORING !== 'false',
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): string[] {
  const errors: string[] = []

  const required = requiredVars[env.nodeEnv as keyof typeof requiredVars] || []

  for (const varName of required) {
    const value = process.env[varName]

    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  return errors
}

/**
 * Log environment information (non-sensitive)
 */
export function logEnvironmentInfo(): void {
  if (typeof window === 'undefined') {
    // Server-side only
    console.log('Environment Configuration:', {
      NODE_ENV: env.nodeEnv,
      LOG_LEVEL: env.logLevel,
      ENVIRONMENT_NAME: env.environmentName,
      DEBUG_MODE: env.enableDebugMode,
      ERROR_REPORTING: env.enableErrorReporting,
      PERF_MONITORING: env.enablePerformanceMonitoring,
    })
  }
}

export default env
