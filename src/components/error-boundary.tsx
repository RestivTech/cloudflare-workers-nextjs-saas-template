'use client'

import React, { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

/**
 * Error Boundary component for catching React errors
 * Logs to Sentry and displays user-friendly error message
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry with additional context
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })

    this.setState({ errorId })

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="bg-destructive/10 rounded-full p-3">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground">
                  We're sorry for the inconvenience. Please try again or contact support if the
                  problem persists.
                </p>
              </div>

              {/* Error Details in Development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-3 rounded text-xs text-muted-foreground max-h-40 overflow-y-auto font-mono">
                  <div className="font-semibold mb-1">Error Details:</div>
                  <div>{this.state.error.toString()}</div>
                </div>
              )}

              {/* Error ID for Support */}
              {this.state.errorId && (
                <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
                  <div className="font-semibold mb-1">Error Reference ID:</div>
                  <div className="font-mono break-all">{this.state.errorId}</div>
                  <p className="mt-2 text-xs">
                    Share this ID with support when reporting this issue.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
