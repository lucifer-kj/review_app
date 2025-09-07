/**
 * Performance wrapper component
 * Automatically tracks performance metrics for wrapped components
 */

import React, { Component, ReactNode } from 'react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

interface PerformanceWrapperProps {
  children: ReactNode
  componentName: string
  trackInteractions?: boolean
  trackRenders?: boolean
  threshold?: number
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
  children,
  componentName,
  trackInteractions = true,
  trackRenders = true,
  threshold = 100,
}) => {
  const { trackInteraction } = usePerformanceMonitor({
    componentName,
    trackInteractions,
    trackRenders,
    threshold,
  })

  // Wrap children with interaction tracking
  const wrappedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps = child.props as any;
      return React.cloneElement(child as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          trackInteraction('click')
          if (childProps.onClick) {
            childProps.onClick(e)
          }
        },
        onChange: (e: React.ChangeEvent) => {
          trackInteraction('change')
          if (childProps.onChange) {
            childProps.onChange(e)
          }
        },
        onFocus: (e: React.FocusEvent) => {
          trackInteraction('focus')
          if (childProps.onFocus) {
            childProps.onFocus(e)
          }
        },
        onBlur: (e: React.FocusEvent) => {
          trackInteraction('blur')
          if (childProps.onBlur) {
            childProps.onBlur(e)
          }
        },
      })
    }
    return child
  })

  return <>{wrappedChildren}</>
}

// HOC for wrapping components with performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  options?: {
    trackInteractions?: boolean
    trackRenders?: boolean
    threshold?: number
  }
) => {
  const PerformanceMonitoredComponent = (props: P) => {
    return (
      <PerformanceWrapper
        componentName={componentName}
        trackInteractions={options?.trackInteractions}
        trackRenders={options?.trackRenders}
        threshold={options?.threshold}
      >
        <WrappedComponent {...props} />
      </PerformanceWrapper>
    )
  }

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`

  return PerformanceMonitoredComponent
}

// Class component wrapper for performance monitoring
export class PerformanceBoundary extends Component<
  PerformanceWrapperProps,
  { hasError: boolean }
> {
  constructor(props: PerformanceWrapperProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log performance-related errors
    console.error(`Performance error in ${this.props.componentName}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Performance monitoring error in {this.props.componentName}</div>
    }

    return (
      <PerformanceWrapper {...this.props}>
        {this.props.children}
      </PerformanceWrapper>
    )
  }
}
