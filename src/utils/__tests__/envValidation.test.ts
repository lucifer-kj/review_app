import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironment,
  getOptionalEnvVars,
  getEnvironmentError
} from '../envValidation';

// Mock import.meta.env for testing
const mockImportMetaEnv = (env: Record<string, string | undefined>) => {
  vi.mocked(import.meta.env).mockImplementation(() => env);
};

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateEnvironment', () => {
    it('should return valid when all required variables are present and valid', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        VITE_FRONTEND_URL: 'https://myapp.com'
      });

      const result = validateEnvironment();

      expect(result.isValid).toBe(true);
      expect(result.missingVars).toHaveLength(0);
    });

    it('should return invalid when required variables are missing', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        // Missing VITE_SUPABASE_ANON_KEY
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        VITE_FRONTEND_URL: 'https://myapp.com'
      });

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('VITE_SUPABASE_ANON_KEY');
      expect(result.missingVars).toHaveLength(1);
    });

    it('should return invalid when required variables contain placeholder values', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'your_supabase_project_url',
        VITE_SUPABASE_ANON_KEY: 'your_supabase_anon_key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        VITE_FRONTEND_URL: 'https://myapp.com'
      });

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('VITE_SUPABASE_URL');
      expect(result.missingVars).toContain('VITE_SUPABASE_ANON_KEY');
      expect(result.missingVars).toHaveLength(2);
    });

    it('should detect multiple placeholder patterns', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'placeholder',
        VITE_SUPABASE_ANON_KEY: 'your-anon-key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'placeholder-value',
        VITE_FRONTEND_URL: 'your-frontend-url'
      });

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toHaveLength(4);
      expect(result.missingVars).toEqual(
        expect.arrayContaining([
          'VITE_SUPABASE_URL',
          'VITE_SUPABASE_ANON_KEY',
          'VITE_SUPABASE_SERVICE_ROLE_KEY',
          'VITE_FRONTEND_URL'
        ])
      );
    });

    it('should handle undefined environment variables', () => {
      mockImportMetaEnv({});

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toHaveLength(4);
      expect(result.missingVars).toEqual(
        expect.arrayContaining([
          'VITE_SUPABASE_URL',
          'VITE_SUPABASE_ANON_KEY',
          'VITE_SUPABASE_SERVICE_ROLE_KEY',
          'VITE_FRONTEND_URL'
        ])
      );
    });

    it('should handle null values', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: null as any,
        VITE_SUPABASE_ANON_KEY: undefined,
        VITE_SUPABASE_SERVICE_ROLE_KEY: '',
        VITE_FRONTEND_URL: 'https://myapp.com'
      });

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toHaveLength(3);
    });
  });

  describe('getOptionalEnvVars', () => {
    it('should return only valid optional environment variables', () => {
      mockImportMetaEnv({
        VITE_APP_NAME: 'Crux',
        VITE_SUPPORT_EMAIL: 'support@example.com',
        VITE_DEV_URL: 'http://localhost:3000',
        VITE_APP_NAME_PLACEHOLDER: 'your-app-name', // Should be excluded
        VITE_INVALID_PLACEHOLDER: 'placeholder' // Should be excluded
      });

      const result = getOptionalEnvVars();

      expect(result).toEqual({
        VITE_APP_NAME: 'Crux',
        VITE_SUPPORT_EMAIL: 'support@example.com',
        VITE_DEV_URL: 'http://localhost:3000'
      });
    });

    it('should exclude placeholder values', () => {
      mockImportMetaEnv({
        VITE_APP_NAME: 'your-app-name',
        VITE_SUPPORT_EMAIL: 'your-support-email',
        VITE_DEV_URL: 'placeholder-url'
      });

      const result = getOptionalEnvVars();

      expect(result).toEqual({});
    });

    it('should handle empty or undefined optional variables', () => {
      mockImportMetaEnv({
        VITE_APP_NAME: '',
        VITE_SUPPORT_EMAIL: undefined,
        VITE_DEV_URL: null as any
      });

      const result = getOptionalEnvVars();

      expect(result).toEqual({});
    });

    it('should handle mixed valid and invalid values', () => {
      mockImportMetaEnv({
        VITE_APP_NAME: 'Crux',
        VITE_SUPPORT_EMAIL: 'your-support-email', // Invalid
        VITE_DEV_URL: 'http://localhost:3000' // Valid
      });

      const result = getOptionalEnvVars();

      expect(result).toEqual({
        VITE_APP_NAME: 'Crux',
        VITE_DEV_URL: 'http://localhost:3000'
      });
    });
  });

  describe('getEnvironmentError', () => {
    it('should return null when environment is valid', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        VITE_FRONTEND_URL: 'https://myapp.com'
      });

      const result = getEnvironmentError();

      expect(result).toBeNull();
    });

    it('should return error message when environment is invalid', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        // Missing required variables
      });

      const result = getEnvironmentError();

      expect(result).toBeDefined();
      expect(result).toContain('Missing or invalid environment variables');
      expect(result).toContain('VITE_SUPABASE_ANON_KEY');
      expect(result).toContain('VITE_SUPABASE_SERVICE_ROLE_KEY');
      expect(result).toContain('VITE_FRONTEND_URL');
    });

    it('should include all missing variables in error message', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'your_supabase_url',
        VITE_SUPABASE_ANON_KEY: 'your-anon-key'
      });

      const result = getEnvironmentError();

      expect(result).toContain('VITE_SUPABASE_URL');
      expect(result).toContain('VITE_SUPABASE_ANON_KEY');
      expect(result).toContain('VITE_SUPABASE_SERVICE_ROLE_KEY');
      expect(result).toContain('VITE_FRONTEND_URL');
    });

    it('should format error message properly', () => {
      mockImportMetaEnv({});

      const result = getEnvironmentError();

      expect(result).toMatch(/^Missing or invalid environment variables: .+$/);
      expect(result).toContain(', ');
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with real environment setup', () => {
      // Simulate a complete environment setup
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://real-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'real-anon-key-12345',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'real-service-key-67890',
        VITE_FRONTEND_URL: 'https://crux-app.com',
        VITE_APP_NAME: 'Crux',
        VITE_SUPPORT_EMAIL: 'support@crux-app.com',
        VITE_SENTRY_DSN: 'https://sentry-dsn@sentry.io/project'
      });

      expect(validateEnvironment().isValid).toBe(true);
      expect(getEnvironmentError()).toBeNull();

      const optionalVars = getOptionalEnvVars();
      expect(optionalVars.VITE_APP_NAME).toBe('Crux');
      expect(optionalVars.VITE_SUPPORT_EMAIL).toBe('support@crux-app.com');
    });

    it('should handle development environment with localhost', () => {
      mockImportMetaEnv({
        VITE_SUPABASE_URL: 'https://dev-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'dev-anon-key',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'dev-service-key',
        VITE_FRONTEND_URL: 'http://localhost:3000',
        VITE_APP_NAME: 'Crux Dev'
      });

      expect(validateEnvironment().isValid).toBe(true);
      expect(getEnvironmentError()).toBeNull();

      const optionalVars = getOptionalEnvVars();
      expect(optionalVars.VITE_APP_NAME).toBe('Crux Dev');
      expect(optionalVars.VITE_FRONTEND_URL).toBeUndefined(); // localhost is valid for dev
    });
  });
});
