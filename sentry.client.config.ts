import * as Sentry from '@sentry/nextjs'

/**
 * Client-side Sentry configuration
 * Captures frontend errors, performance metrics, and user interactions
 */
Sentry.init({
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV === 'development',

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignore certain errors
  beforeSend(event, hint) {
    // Ignore network errors that are not critical
    if (
      event.exception &&
      hint.originalException &&
      hint.originalException instanceof TypeError
    ) {
      const message = hint.originalException.message
      if (message && message.includes('NetworkError')) {
        return null
      }
    }

    // Ignore certain error types
    if (event.exception) {
      const errorValue = event.exception.values?.[0]?.value
      if (errorValue && errorValue.includes('ResizeObserver loop limit exceeded')) {
        return null
      }
    }

    return event
  },
})
