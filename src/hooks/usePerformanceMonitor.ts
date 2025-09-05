/**
 * Performance monitoring hook for Crux
 * Tracks component render times, user interactions, and performance metrics
 */

import { useEffect, useRef, useCallback } from 'react'
import { logger } from '@/utils/logger'
import { startTransaction, addBreadcrumb } from '@/utils/sentry'

interface PerformanceMetrics {
  componentName: string
  renderTime: number
  mountTime: number
  interactionCount: number
  lastInteraction: number
}

interface UsePerformanceMonitorOptions {
  componentName: string
  trackInteractions?: boolean
  trackRenders?: boolean
  threshold?: number // ms threshold for logging
}

export const usePerformanceMonitor = ({
  componentName,
  trackInteractions = true,
  trackRenders = true,
  threshold = 100, // Log if render takes more than 100ms
}: UsePerformanceMonitorOptions) => {
  const metricsRef = useRef<PerformanceMetrics>({
    componentName,
    renderTime: 0,
    mountTime: 0,
    interactionCount: 0,
    lastInteraction: 0,
  })

  const renderStartRef = useRef<number>(0)
  const mountStartRef = useRef<number>(0)

  // Track component mount time
  useEffect(() => {
    mountStartRef.current = performance.now()
    
    const mountTime = performance.now() - mountStartRef.current
    metricsRef.current.mountTime = mountTime

    logger.performance(componentName, mountTime)

    // Track with Sentry if available
    if (import.meta.env.VITE_SENTRY_DSN) {
      addBreadcrumb(`Component ${componentName} mounted`, 'performance', 'info')
    }
  }, [componentName])

  // Track render performance
  useEffect(() => {
    if (!trackRenders) return

    renderStartRef.current = performance.now()

    return () => {
      const renderTime = performance.now() - renderStartRef.current
      metricsRef.current.renderTime = renderTime

      if (renderTime > threshold) {
        logger.warn(`Slow render detected in ${componentName}`, {
          component: componentName,
          renderTime,
          threshold,
          action: 'slow_render',
        })

        // Track slow renders with Sentry
        if (import.meta.env.VITE_SENTRY_DSN) {
          addBreadcrumb(
            `Slow render in ${componentName}: ${renderTime}ms`,
            'performance',
            'warning'
          )
        }
      }
    }
  }, [componentName, trackRenders, threshold])

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string) => {
    if (!trackInteractions) return

    metricsRef.current.interactionCount++
    metricsRef.current.lastInteraction = Date.now()

    logger.userAction(`${componentName}: ${interactionType}`, {
      component: componentName,
      interactionType,
      interactionCount: metricsRef.current.interactionCount,
      action: 'user_interaction',
    })

    // Track with Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      addBreadcrumb(
        `User interaction: ${interactionType} in ${componentName}`,
        'user',
        'info'
      )
    }
  }, [componentName, trackInteractions])

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      componentName,
      renderTime: 0,
      mountTime: 0,
      interactionCount: 0,
      lastInteraction: 0,
    }
  }, [componentName])

  return {
    trackInteraction,
    getMetrics,
    resetMetrics,
  }
}

// Hook for tracking page load performance
export const usePageLoadMonitor = (pageName: string) => {
  useEffect(() => {
    const startTime = performance.now()

    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      
      logger.performance(`${pageName} page load`, loadTime)

      // Track with Sentry
      if (import.meta.env.VITE_SENTRY_DSN) {
        const transaction = startTransaction(`${pageName} page load`, 'navigation')
        transaction.setData('loadTime', loadTime)
        transaction.finish()
      }
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pageName])
}

// Hook for tracking API call performance
export const useApiPerformanceMonitor = () => {
  const trackApiCall = useCallback((
    endpoint: string,
    method: string,
    startTime: number,
    success: boolean,
    error?: Error
  ) => {
    const duration = performance.now() - startTime

    logger.apiCall(method, endpoint, success ? 200 : 500, duration)

    // Track with Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      const transaction = startTransaction(`${method} ${endpoint}`, 'http.client')
      transaction.setData('duration', duration)
      transaction.setData('success', success)
      if (error) {
        transaction.setData('error', error.message)
      }
      transaction.finish()
    }
  }, [])

  return { trackApiCall }
}

// Hook for tracking user journey
export const useUserJourneyMonitor = () => {
  const trackJourneyStep = useCallback((step: string, data?: Record<string, unknown>) => {
    logger.userAction(`Journey step: ${step}`, {
      step,
      ...data,
      action: 'user_journey',
    })

    // Track with Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      addBreadcrumb(`User journey: ${step}`, 'user', 'info')
    }
  }, [])

  return { trackJourneyStep }
}
