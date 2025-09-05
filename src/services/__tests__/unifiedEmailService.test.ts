/**
 * Tests for UnifiedEmailService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnifiedEmailService } from '../unifiedEmailService'

// Mock environment variables
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}))

vi.mock('@/services/businessSettingsService', () => ({
  BusinessSettingsService: {
    getBusinessSettingsWithDefaults: vi.fn().mockResolvedValue({
      business_name: 'Test Business',
      business_email: 'business@test.com',
      business_phone: '+1234567890',
      business_address: '123 Test St',
    }),
  },
}))

describe('UnifiedEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://test.example.com',
      },
      writable: true,
    })
  })

  describe('generateReviewEmailTemplate', () => {
    it('generates email template with provided data', async () => {
      const templateData = {
        customerEmail: 'customer@test.com',
        customerName: 'John Doe',
        businessName: 'Test Business',
        managerName: 'Jane Manager',
        trackingId: 'track123',
      }

      const result = await UnifiedEmailService.generateReviewEmailTemplate(templateData)

      expect(result.to).toBe('customer@test.com')
      expect(result.subject).toBe("We'd love your feedback, John Doe!")
      expect(result.body).toContain('John Doe')
      expect(result.body).toContain('Test Business')
      expect(result.html).toContain('John Doe')
      expect(result.html).toContain('Test Business')
      expect(result.html).toContain('track123')
    })

    it('handles missing optional fields gracefully', async () => {
      const templateData = {
        customerEmail: 'customer@test.com',
        customerName: 'John Doe',
        businessName: 'Test Business',
      }

      const result = await UnifiedEmailService.generateReviewEmailTemplate(templateData)

      expect(result.to).toBe('customer@test.com')
      expect(result.subject).toBe("We'd love your feedback, John Doe!")
      expect(result.body).toContain('John Doe')
      expect(result.html).toContain('John Doe')
    })

    it('returns fallback template on error', async () => {
      // Mock BusinessSettingsService to throw an error
      const { BusinessSettingsService } = await import('@/services/businessSettingsService')
      vi.mocked(BusinessSettingsService.getBusinessSettingsWithDefaults).mockRejectedValueOnce(
        new Error('Service error')
      )

      const templateData = {
        customerEmail: 'customer@test.com',
        customerName: 'John Doe',
        businessName: 'Test Business',
      }

      const result = await UnifiedEmailService.generateReviewEmailTemplate(templateData)

      expect(result.to).toBe('customer@test.com')
      expect(result.subject).toBe("We'd love your feedback, John Doe!")
      expect(result.body).toContain('John Doe')
    })
  })

  describe('isEmailJSConfigured', () => {
    it('returns false when EmailJS is not configured', () => {
      // Mock environment variables as empty
      vi.stubEnv('VITE_EMAILJS_USER_ID', '')
      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', '')
      vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', '')

      expect(UnifiedEmailService.isEmailJSConfigured()).toBe(false)
    })

    it('returns true when EmailJS is configured', () => {
      vi.stubEnv('VITE_EMAILJS_USER_ID', 'test-user-id')
      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'test-service-id')
      vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'test-template-id')

      expect(UnifiedEmailService.isEmailJSConfigured()).toBe(true)
    })
  })

  describe('copyEmailToClipboard', () => {
    it('copies email to clipboard successfully', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      })

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      }

      const result = await UnifiedEmailService.copyEmailToClipboard(emailData)

      expect(result).toBe(true)
      expect(mockWriteText).toHaveBeenCalledWith(
        'To: test@example.com\nSubject: Test Subject\n\nTest Body'
      )
    })

    it('handles clipboard API errors', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
      })

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      }

      const result = await UnifiedEmailService.copyEmailToClipboard(emailData)

      expect(result).toBe(false)
    })
  })
})
