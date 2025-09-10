/**
 * Authentication Integration Tests
 * Tests the complete authentication flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from '@/services/authService';

// Mock Supabase for integration tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  })),
}));

describe('Authentication Integration', () => {
  let supabaseClient: any;

  beforeEach(() => {
    supabaseClient = createClient('test-url', 'test-key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      // Mock successful login response
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const result = await AuthService.signIn('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle login failure', async () => {
      // Mock failed login response
      supabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const result = await AuthService.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Registration Flow', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
      };

      supabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await AuthService.signUp('newuser@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
    });

    it('should handle registration with existing email', async () => {
      supabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      });

      const result = await AuthService.signUp('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should handle logout successfully', async () => {
      supabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await AuthService.signOut();

      expect(result.success).toBe(true);
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should get current session', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: 'user-123', email: 'test@example.com' },
      };

      supabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await AuthService.getSession();

      expect(result.success).toBe(true);
      expect(result.data?.session).toEqual(mockSession);
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change callbacks', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      supabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const unsubscribe = AuthService.onAuthStateChange(mockCallback);

      expect(supabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
