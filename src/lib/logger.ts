import pino from 'pino'

/**
 * Structured logger using pino
 * Logs to stdout with JSON formatting in production
 * Pretty-printed in development
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
})

/**
 * Log levels
 */
export const log = {
  /**
   * Debug level - detailed information for debugging
   */
  debug: (message: string, data?: Record<string, unknown>) => {
    logger.debug({ ...data }, message)
  },

  /**
   * Info level - informational messages
   */
  info: (message: string, data?: Record<string, unknown>) => {
    logger.info({ ...data }, message)
  },

  /**
   * Warn level - warning messages
   */
  warn: (message: string, data?: Record<string, unknown>) => {
    logger.warn({ ...data }, message)
  },

  /**
   * Error level - error messages
   */
  error: (message: string, error?: Error | string, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(
        {
          ...data,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message
      )
    } else {
      logger.error({ ...data, error }, message)
    }
  },

  /**
   * Fatal level - fatal errors
   */
  fatal: (message: string, error?: Error | string, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.fatal(
        {
          ...data,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message
      )
    } else {
      logger.fatal({ ...data, error }, message)
    }
  },
}

/**
 * Request logging context
 */
export function createRequestLogger(requestId: string, method: string, path: string) {
  return {
    requestId,
    method,
    path,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Performance logging
 */
export function logPerformance(operation: string, duration: number, data?: Record<string, unknown>) {
  if (duration > 1000) {
    log.warn(`Slow operation: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...data,
    })
  } else {
    log.debug(`Operation completed: ${operation} in ${duration}ms`, {
      operation,
      duration,
      ...data,
    })
  }
}

export default logger
