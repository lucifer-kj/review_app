/**
 * Test utilities for React components
 * Provides common testing helpers and providers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'user' as const,
  tenant_id: 'test-tenant-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockTenant = (overrides = {}) => ({
  id: 'test-tenant-id',
  name: 'Test Tenant',
  slug: 'test-tenant',
  status: 'active' as const,
  plan: 'free' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockReview = (overrides = {}) => ({
  id: 'test-review-id',
  tenant_id: 'test-tenant-id',
  customer_name: 'Test Customer',
  customer_email: 'customer@example.com',
  rating: 5,
  review_text: 'Great service!',
  status: 'approved' as const,
  source: 'website' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockBusinessSettings = (overrides = {}) => ({
  id: 'test-settings-id',
  user_id: 'test-user-id',
  business_name: 'Test Business',
  business_email: 'business@example.com',
  business_phone: '+1234567890',
  business_address: '123 Test St, Test City, TC 12345',
  google_business_url: 'https://g.page/test-business',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
