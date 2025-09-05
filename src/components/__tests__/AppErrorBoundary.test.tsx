/**
 * Tests for AppErrorBoundary component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { AppErrorBoundary } from '../AppErrorBoundary'

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('AppErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AppErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AppErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('renders component-specific error message when componentName is provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </AppErrorBoundary>
    )

    expect(screen.getByText('TestComponent Error')).toBeInTheDocument()
    expect(screen.getByText(/TestComponent encountered an error/)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('shows error details in development mode', () => {
    const originalEnv = import.meta.env.NODE_ENV
    import.meta.env.NODE_ENV = 'development'
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AppErrorBoundary>
    )

    expect(screen.getByText('Error Details:')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    consoleSpy.mockRestore()
    import.meta.env.NODE_ENV = originalEnv
  })

  it('renders fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </AppErrorBoundary>
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
