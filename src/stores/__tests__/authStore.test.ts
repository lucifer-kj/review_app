/**
 * Auth Store Tests
 * Tests for the Zustand authentication store
 */

import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Mock services
jest.mock('@/services/sessionManagementService', () => ({
  SessionManagementService: {
    initializeSession: jest.fn(),
  },
}));

jest.mock('@/services/emailVerificationService', () => ({
  EmailVerificationService: {
    sendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
  },
}));

jest.mock('@/services/invitationService', () => ({
  InvitationService: {
    acceptInvitation: jest.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.tenant).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isEmailVerified).toBe(false);
  });

  it('should update user state correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: '2023-01-01T00:00:00Z',
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isEmailVerified).toBe(true);
  });

  it('should handle user without email confirmation', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: null,
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isEmailVerified).toBe(false);
  });

  it('should clear state when user is set to null', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    } as any;

    // Set user first
    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Clear user
    act(() => {
      result.current.setUser(null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update profile correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'tenant_admin' as const,
      tenant_id: 'test-tenant-id',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    act(() => {
      result.current.setProfile(mockProfile);
    });

    expect(result.current.profile).toEqual(mockProfile);
  });

  it('should update tenant correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockTenant = {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      domain: 'test.example.com',
      status: 'active' as const,
    };

    act(() => {
      result.current.setTenant(mockTenant);
    });

    expect(result.current.tenant).toEqual(mockTenant);
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should update last activity when session is set', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const initialTime = result.current.lastActivity;
    
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600000,
    } as any;

    act(() => {
      result.current.setSession(mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.lastActivity).toBeGreaterThan(initialTime);
  });
});

describe('AuthStore Selectors', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('should provide user selector', () => {
    const { result: userResult } = renderHook(() => useAuthStore((state) => state.user));
    const { result: fullResult } = renderHook(() => useAuthStore());

    expect(userResult.current).toBe(fullResult.current.user);
  });

  it('should provide loading selector', () => {
    const { result: loadingResult } = renderHook(() => useAuthStore((state) => state.loading));
    const { result: fullResult } = renderHook(() => useAuthStore());

    expect(loadingResult.current).toBe(fullResult.current.loading);
  });

  it('should provide isAuthenticated selector', () => {
    const { result: authResult } = renderHook(() => useAuthStore((state) => state.isAuthenticated));
    const { result: fullResult } = renderHook(() => useAuthStore());

    expect(authResult.current).toBe(fullResult.current.isAuthenticated);
  });
});
