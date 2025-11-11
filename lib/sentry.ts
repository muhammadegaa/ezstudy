/**
 * Sentry Error Logging Configuration
 * Production-grade error tracking and monitoring
 */

import * as Sentry from '@sentry/react';

// Initialize Sentry (only in production or when DSN is provided)
export function initSentry() {
  if (typeof window === 'undefined') return; // Skip SSR

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    // Sentry is optional - only log if DSN is configured
    console.log('Sentry DSN not configured. Error logging disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        // Ignore network errors that are expected
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          return null;
        }
        // Ignore Firebase offline errors (handled gracefully)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'unavailable') {
          return null;
        }
      }
      return event;
    },
  });
}

// Helper function to capture exceptions
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error (Sentry not configured):', error, context);
  }
}

// Helper function to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

// Set user context
export function setUserContext(user: { id: string; email?: string; name?: string }) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
}

// Clear user context
export function clearUserContext() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

