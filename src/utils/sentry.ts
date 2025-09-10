/**
 * Sentry configuration and utilities for Crux
 * Provides error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';

// Initialize Sentry
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Check if DSN is valid (not placeholder)
  if (!dsn || dsn === 'your_sentry_dsn' || dsn.includes('placeholder')) {
    // Silent return - no warning in production
    if (import.meta.env.NODE_ENV === 'development') {
      console.info('Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.NODE_ENV || 'development',
    // Performance Monitoring
    tracesSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: import.meta.env.NODE_ENV === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    // User context
    beforeSend(event) {
      // Filter out non-critical errors in production
      if (import.meta.env.NODE_ENV === 'production') {
        // Don't send network errors for external services
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
      }
      return event;
    },
  });

  // Set user context
  Sentry.setContext('app', {
    name: 'Crux',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.NODE_ENV || 'development',
  });
};

// Utility functions for manual error reporting
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, {
    tags: {
      component: 'manual',
    },
    extra: context,
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: {
  id: string;
  email?: string;
  role?: string;
  tenantId?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
  });

  Sentry.setContext('user', {
    role: user.role,
    tenantId: user.tenantId,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Performance monitoring utilities
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
};

export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// React Error Boundary integration
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Performance monitoring hooks
export const withProfiler = Sentry.withProfiler;

export default Sentry;
