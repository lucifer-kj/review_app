/**
 * Authentication Store - Zustand implementation
 * Replaces useAuth and useEnhancedAuth hooks
 */

import React from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionManagementService } from '@/services/sessionManagementService';
import { EmailVerificationService } from '@/services/emailVerificationService';
import { InvitationService } from '@/services/invitationService';
import { env } from '@/utils/env';
import type { BaseStore } from './types';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  settings?: {
    description?: string;
    features?: {
      analytics: boolean;
      custom_domain: boolean;
      api_access: boolean;
      priority_support: boolean;
    };
    limits?: {
      max_users: number;
      max_reviews: number;
      storage_limit: number;
    };
  };
}

export interface AuthState extends BaseStore {
  // Core auth state
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  tenant: TenantInfo | null;
  
  // Computed state
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  sessionExpiringSoon: boolean;
  timeUntilExpiry: number;
  
  // Session management
  lastActivity: number;
  sessionTimeout: number;
}

export interface AuthActions {
  // Core actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setTenant: (tenant: TenantInfo | null) => void;
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateLastActivity: () => void;
  
  // Profile management
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  
  // Invitation system
  acceptInvitation: (token: string, password: string, fullName: string) => Promise<boolean>;
  
  // Email verification
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  
  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  // Base store state
  loading: true,
  error: null,
  setLoading: () => {},
  setError: () => {},
  clearError: () => {},
  
  // Auth state
  user: null,
  session: null,
  profile: null,
  tenant: null,
  
  // Computed state
  isAuthenticated: false,
  isEmailVerified: false,
  sessionExpiringSoon: false,
  timeUntilExpiry: 0,
  
  // Session management
  lastActivity: Date.now(),
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Base store actions
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Core auth actions
        setUser: (user: User | null) => {
          set({ 
            user, 
            isAuthenticated: !!user,
            isEmailVerified: !!user?.email_confirmed_at 
          });
        },

        setSession: (session: Session | null) => {
          set({ session });
          if (session) {
            get().updateLastActivity();
          }
        },

        setProfile: (profile: UserProfile | null) => {
          set({ profile });
        },

        setTenant: (tenant: TenantInfo | null) => {
          set({ tenant });
        },

        // Authentication actions
        signIn: async (email: string, password: string) => {
          try {
            console.log('🔐 AuthStore: Starting sign in process');
            set({ loading: true, error: null });
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              console.error('🔐 AuthStore: Sign in error:', error);
              set({ error: error.message, loading: false });
              return { success: false, error: error.message };
            }

            if (data.user && data.session) {
              console.log('🔐 AuthStore: Sign in successful, setting user and session');
              get().setUser(data.user);
              get().setSession(data.session);
              
              console.log('🔐 AuthStore: Refreshing profile...');
              await get().refreshProfile();
              
              const finalProfile = get().profile;
              console.log('🔐 AuthStore: Final profile after refresh:', finalProfile);
            }

            set({ loading: false });
            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
            console.error('🔐 AuthStore: Sign in exception:', errorMessage);
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        signOut: async () => {
          try {
            set({ loading: true });
            
            await supabase.auth.signOut();
            
            set({
              user: null,
              session: null,
              profile: null,
              tenant: null,
              isAuthenticated: false,
              isEmailVerified: false,
              sessionExpiringSoon: false,
              timeUntilExpiry: 0,
              loading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
            set({ error: errorMessage, loading: false });
          }
        },

        signUp: async (email: string, password: string, fullName: string) => {
          try {
            set({ loading: true, error: null });
            
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                },
              },
            });

            if (error) {
              set({ error: error.message, loading: false });
              return { success: false, error: error.message };
            }

            set({ loading: false });
            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        // Session management
        refreshSession: async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error('Session refresh error:', error);
              return;
            }

            if (data.session) {
              get().setSession(data.session);
              if (data.user) {
                get().setUser(data.user);
              }
            }
          } catch (error) {
            console.error('Session refresh failed:', error);
          }
        },

        checkSession: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session check error:', error);
              return;
            }

            if (session) {
              get().setSession(session);
              if (session.user) {
                get().setUser(session.user);
                await get().refreshProfile();
              }
            } else {
              get().setUser(null);
              get().setSession(null);
              get().setProfile(null);
              get().setTenant(null);
            }
          } catch (error) {
            console.error('Session check failed:', error);
          }
        },

        updateLastActivity: () => {
          set({ lastActivity: Date.now() });
        },

        // Profile management
        refreshProfile: async () => {
          try {
            const { user } = get();
            if (!user) {
              console.log('🔐 AuthStore: No user for profile refresh');
              return;
            }

            console.log('🔐 AuthStore: Fetching profile for user:', user.id);
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (error) {
              console.error('🔐 AuthStore: Profile fetch error:', error);
              return;
            }

            console.log('🔐 AuthStore: Profile fetched successfully:', profile);
            get().setProfile(profile);

            // Fetch tenant info if user has tenant_id
            if (profile.tenant_id) {
              console.log('🔐 AuthStore: Fetching tenant info:', profile.tenant_id);
              const { data: tenant, error: tenantError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', profile.tenant_id)
                .single();

              if (!tenantError && tenant) {
                console.log('🔐 AuthStore: Tenant fetched successfully:', tenant);
                get().setTenant(tenant);
              } else {
                console.warn('🔐 AuthStore: Tenant not found for user:', profile.tenant_id, tenantError);
                get().setTenant(null);
              }
            } else {
              console.log('🔐 AuthStore: User has no tenant assigned');
              get().setTenant(null);
            }
          } catch (error) {
            console.error('🔐 AuthStore: Profile refresh failed:', error);
          }
        },

        updateProfile: async (updates: Partial<UserProfile>) => {
          try {
            const { user } = get();
            if (!user) {
              return { success: false, error: 'No user logged in' };
            }

            const { error } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', user.id);

            if (error) {
              return { success: false, error: error.message };
            }

            await get().refreshProfile();
            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
            return { success: false, error: errorMessage };
          }
        },

        // Invitation system
        acceptInvitation: async (token: string, password: string, fullName: string) => {
          try {
            set({ loading: true, error: null });
            
            const success = await InvitationService.acceptInvitation(token, password, fullName);
            
            if (success) {
              await get().checkSession();
            }
            
            set({ loading: false });
            return success;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invitation acceptance failed';
            set({ error: errorMessage, loading: false });
            return false;
          }
        },

        // Email verification
        sendVerificationEmail: async () => {
          try {
            const { user } = get();
            if (!user) {
              return { success: false, error: 'No user logged in' };
            }

            const result = await EmailVerificationService.sendVerificationEmail(user.email);
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
            return { success: false, error: errorMessage };
          }
        },

        verifyEmail: async (token: string) => {
          try {
            const result = await EmailVerificationService.verifyEmail(token);
            
            if (result.success) {
              await get().checkSession();
            }
            
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
            return { success: false, error: errorMessage };
          }
        },

        // Auto-initialization when store is first accessed
        initialize: async () => {
          // Only initialize if not already initialized
          if (get().loading === false && get().user === null && get().error === null) {
            return; // Already initialized
          }
          
          try {
            set({ loading: true, error: null });
            
            // Check if Supabase is properly configured
            if (!env.supabase.url || env.supabase.url.includes('placeholder') || 
                !env.supabase.anonKey || env.supabase.anonKey.includes('placeholder')) {
              console.warn('Supabase not properly configured, skipping session initialization');
              set({
                user: null,
                session: null,
                profile: null,
                tenant: null,
                isAuthenticated: false,
                isEmailVerified: false,
                sessionExpiringSoon: false,
                timeUntilExpiry: 0,
                loading: false,
                error: 'Supabase not configured',
              });
              return;
            }
            
            // Initialize session management
            const sessionResponse = await SessionManagementService.initializeSession();
            
            if (sessionResponse.success && sessionResponse.data) {
              const sessionInfo = sessionResponse.data;
              
              set({
                user: sessionInfo.user,
                session: sessionInfo.session,
                profile: sessionInfo.profile,
                tenant: sessionInfo.tenant,
                isAuthenticated: true,
                isEmailVerified: !!sessionInfo.user?.email_confirmed_at,
                sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
                timeUntilExpiry: sessionInfo.timeUntilExpiry,
                loading: false,
              });
            } else {
              set({
                user: null,
                session: null,
                profile: null,
                tenant: null,
                isAuthenticated: false,
                isEmailVerified: false,
                sessionExpiringSoon: false,
                timeUntilExpiry: 0,
                loading: false,
              });
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            set({ 
              loading: false, 
              error: error instanceof Error ? error.message : 'Initialization failed' 
            });
          }
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          profile: state.profile,
          tenant: state.tenant,
          lastActivity: state.lastActivity,
        }),
        version: 1,
      }
    ),
    { 
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Selector hooks for performance optimization
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthSession = () => useAuthStore((state) => state.session);
export const useAuthProfile = () => useAuthStore((state) => state.profile);
export const useAuthTenant = () => useAuthStore((state) => state.tenant);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsEmailVerified = () => useAuthStore((state) => state.isEmailVerified);

// Individual action selectors to prevent infinite re-renders
export const useSignIn = () => useAuthStore((state) => state.signIn);
export const useSignOut = () => useAuthStore((state) => state.signOut);
export const useSignUp = () => useAuthStore((state) => state.signUp);
export const useRefreshSession = () => useAuthStore((state) => state.refreshSession);
export const useRefreshProfile = () => useAuthStore((state) => state.refreshProfile);
export const useUpdateProfile = () => useAuthStore((state) => state.updateProfile);
export const useAcceptInvitation = () => useAuthStore((state) => state.acceptInvitation);
export const useSendVerificationEmail = () => useAuthStore((state) => state.sendVerificationEmail);
export const useVerifyEmail = () => useAuthStore((state) => state.verifyEmail);
export const useInitialize = () => useAuthStore((state) => state.initialize);
export const useReset = () => useAuthStore((state) => state.reset);

// Memoized action selector to prevent infinite re-renders
export const useAuthActions = () => {
  const signIn = useSignIn();
  const signOut = useSignOut();
  const signUp = useSignUp();
  const refreshSession = useRefreshSession();
  const refreshProfile = useRefreshProfile();
  const updateProfile = useUpdateProfile();
  const acceptInvitation = useAcceptInvitation();
  const sendVerificationEmail = useSendVerificationEmail();
  const verifyEmail = useVerifyEmail();
  const initialize = useInitialize();
  const reset = useReset();

  return React.useMemo(() => ({
    signIn,
    signOut,
    signUp,
    refreshSession,
    refreshProfile,
    updateProfile,
    acceptInvitation,
    sendVerificationEmail,
    verifyEmail,
    initialize,
    reset,
  }), [signIn, signOut, signUp, refreshSession, refreshProfile, updateProfile, acceptInvitation, sendVerificationEmail, verifyEmail, initialize, reset]);
};

// Computed selectors
export const useIsAdmin = () => useAuthStore((state) => 
  state.profile?.role === 'super_admin' || state.profile?.role === 'tenant_admin'
);

export const useIsSuperAdmin = () => useAuthStore((state) => 
  state.profile?.role === 'super_admin'
);

export const useIsTenantAdmin = () => useAuthStore((state) => 
  state.profile?.role === 'tenant_admin'
);
