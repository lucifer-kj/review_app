import { describe, it, expect, vi } from 'vitest';
import { AppError, handleServiceError } from '../errorHandler';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ErrorHandler', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const message = 'Test error message';
      const code = 'TEST_ERROR';
      const context = {
        service: 'TestService',
        operation: 'testOperation',
        userId: 'test-user-id'
      };
      const isOperational = true;

      const error = new AppError(message, code, context, isOperational);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.context).toEqual(context);
      expect(error.isOperational).toBe(isOperational);
      expect(error.name).toBe('AppError');
    });

    it('should use default values when not provided', () => {
      const message = 'Test error message';
      const error = new AppError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.context).toEqual({});
      expect(error.isOperational).toBe(true);
    });

    it('should handle non-operational errors', () => {
      const error = new AppError('Critical error', 'CRITICAL_ERROR', {}, false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('handleServiceError', () => {
    it('should return existing AppError unchanged', () => {
      const originalError = new AppError('Original error', 'ORIGINAL_ERROR', {
        service: 'TestService'
      });

      const result = handleServiceError(originalError, 'TestService', 'testOperation');

      expect(result).toBe(originalError);
      expect(result.message).toBe('Original error');
      expect(result.code).toBe('ORIGINAL_ERROR');
    });

    it('should convert Error to AppError with correct properties', () => {
      const originalError = new Error('Database connection failed');
      originalError.name = 'DatabaseError';

      const result = handleServiceError(originalError, 'DatabaseService', 'connect');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Database connection failed');
      expect(result.code).toBe('SERVICE_ERROR');
      expect(result.context).toEqual({
        service: 'DatabaseService',
        operation: 'connect'
      });
      expect(result.isOperational).toBe(true);
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error';

      const result = handleServiceError(unknownError, 'TestService', 'testOperation');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error occurred');
      expect(result.code).toBe('SERVICE_ERROR');
    });

    it('should preserve error code from objects with code property', () => {
      const errorWithCode = {
        message: 'Supabase error',
        code: 'PGRST301',
        details: 'Row not found'
      };

      const result = handleServiceError(errorWithCode, 'SupabaseService', 'query');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Supabase error');
      expect(result.code).toBe('PGRST301');
    });

    it('should include additional context', () => {
      const originalError = new Error('Validation failed');
      const additionalContext = {
        userId: 'user-123',
        tenantId: 'tenant-456',
        metadata: { field: 'email', value: 'invalid' }
      };

      const result = handleServiceError(originalError, 'ValidationService', 'validateEmail', additionalContext);

      expect(result.context).toEqual({
        service: 'ValidationService',
        operation: 'validateEmail',
        userId: 'user-123',
        tenantId: 'tenant-456',
        metadata: { field: 'email', value: 'invalid' }
      });
    });

    it('should handle null or undefined errors', () => {
      const result = handleServiceError(null, 'TestService', 'testOperation');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error occurred');
      expect(result.code).toBe('SERVICE_ERROR');
    });

    it('should handle errors with stack traces', () => {
      const originalError = new Error('Network error');
      originalError.stack = 'Error: Network error\n    at TestService.testOperation';

      const result = handleServiceError(originalError, 'TestService', 'testOperation');

      expect(result).toBeInstanceOf(AppError);
      expect(result.stack).toBeDefined();
    });
  });

  describe('Error Context', () => {
    it('should support various context properties', () => {
      const context = {
        service: 'ReviewService',
        operation: 'createReview',
        userId: 'user-123',
        tenantId: 'tenant-456',
        metadata: {
          reviewId: 'review-789',
          rating: 5,
          customerEmail: 'customer@example.com'
        },
        timestamp: new Date().toISOString(),
        requestId: 'req-abc-123'
      };

      const error = new AppError('Review creation failed', 'REVIEW_CREATE_FAILED', context);

      expect(error.context).toEqual(context);
    });

    it('should handle empty context', () => {
      const error = new AppError('Simple error');

      expect(error.context).toEqual({});
    });

    it('should support nested objects in context', () => {
      const context = {
        service: 'EmailService',
        operation: 'sendEmail',
        metadata: {
          template: 'review_request',
          variables: {
            customerName: 'John Doe',
            businessName: 'Test Business'
          },
          recipient: {
            email: 'john@example.com',
            name: 'John Doe'
          }
        }
      };

      const error = new AppError('Email sending failed', 'EMAIL_SEND_FAILED', context);

      expect(error.context.metadata.template).toBe('review_request');
      expect(error.context.metadata.variables.customerName).toBe('John Doe');
    });
  });
});
