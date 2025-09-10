/**
 * Enhanced Authentication Hook
 * Integrates invite-only system, session management, and email verification
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { SessionManagementService, SessionInfo } from '../services/sessionManagementService';
import { EmailVerificationService } from '../services/emailVerificationService';
import { InvitationService } from '../services/invitationService';
import { supabase } from '../integrations/supabase/client';

export interface AuthState {
  user: any | null;
  session: any | null;
  profile: any | null;
  tenant: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  sessionExpiringSoon: boolean;
  timeUntilExpiry: number;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  checkSession: () => Promise<void>;
  acceptInvitation: (token: string, password: string, fullName: string) => Promise<boolean>;
}

export function useEnhancedAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    tenant: null,
    loading: true,
    isAuthenticated: false,
    isEmailVerified: false,
    sessionExpiringSoon: false,
    timeUntilExpiry: 0
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Initialize authentication
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const sessionResponse = await SessionManagementService.initializeSession();
      
      if (sessionResponse.success && sessionResponse.data) {
        const sessionInfo = sessionResponse.data;
        
        setAuthState({
          user: sessionInfo.user,
          session: sessionInfo.session,
          profile: sessionInfo.profile,
          tenant: sessionInfo.tenant,
          loading: false,
          isAuthenticated: true,
          isEmailVerified: !!sessionInfo.user.email_confirmed_at,
          sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
          timeUntilExpiry: sessionInfo.timeUntilExpiry
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          tenant: null,
          loading: false,
          isAuthenticated: false,
          isEmailVerified: false,
          sessionExpiringSoon: false,
          timeUntilExpiry: 0
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // First, try to authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        toast({
          title: "Authentication Error",
          description: authError?.message || "Invalid credentials",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Profile Error",
          description: "User profile not found. Please contact your administrator.",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // For super admins, skip invitation check
      if (profile.role === 'super_admin') {
        // Super admin can login directly
        const sessionResponse = await SessionManagementService.initializeSession();
        
        if (sessionResponse.success && sessionResponse.data) {
          const sessionInfo = sessionResponse.data;
          
          setAuthState({
            user: sessionInfo.user,
            session: sessionInfo.session,
            profile: sessionInfo.profile,
            tenant: sessionInfo.tenant,
            loading: false,
            isAuthenticated: true,
            isEmailVerified: !!sessionInfo.user.email_confirmed_at,
            sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
            timeUntilExpiry: sessionInfo.timeUntilExpiry
          });

          // Redirect to master dashboard for super admin
          navigate('/master', { replace: true });

          toast({
            title: "Login Successful",
            description: "Welcome, Super Admin!",
          });

          return true;
        } else {
          toast({
            title: "Login Failed",
            description: sessionResponse.error || "Session initialization failed",
            variant: "destructive"
          });
          setAuthState(prev => ({ ...prev, loading: false }));
          return false;
        }
      }

      // For regular users, check if they have a valid invitation
      const invitationResponse = await InvitationService.getInvitationByEmail(email);
      
      if (!invitationResponse.success) {
        toast({
          title: "Access Denied",
          description: "No valid invitation found for this email. Please contact your administrator.",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Proceed with login for invited users
      const sessionResponse = await SessionManagementService.initializeSession();
      
      if (sessionResponse.success && sessionResponse.data) {
        const sessionInfo = sessionResponse.data;
        
        setAuthState({
          user: sessionInfo.user,
          session: sessionInfo.session,
          profile: sessionInfo.profile,
          tenant: sessionInfo.tenant,
          loading: false,
          isAuthenticated: true,
          isEmailVerified: !!sessionInfo.user.email_confirmed_at,
          sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
          timeUntilExpiry: sessionInfo.timeUntilExpiry
        });

        // Redirect based on role
        if (sessionInfo.profile.role === 'super_admin') {
          navigate('/master', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }

        toast({
          title: "Login Successful",
          description: "Welcome to Crux!",
        });

        return true;
      } else {
        toast({
          title: "Login Failed",
          description: sessionResponse.error || "Invalid credentials",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [navigate, toast]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await SessionManagementService.logout();
      
      setAuthState({
        user: null,
        session: null,
        profile: null,
        tenant: null,
        loading: false,
        isAuthenticated: false,
        isEmailVerified: false,
        sessionExpiringSoon: false,
        timeUntilExpiry: 0
      });

      navigate('/login', { replace: true });
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "An error occurred during logout",
        variant: "destructive"
      });
    }
  }, [navigate, toast]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshResponse = await SessionManagementService.refreshSession();
      
      if (refreshResponse.success && refreshResponse.data) {
        const sessionInfo = refreshResponse.data;
        
        setAuthState(prev => ({
          ...prev,
          user: sessionInfo.user,
          session: sessionInfo.session,
          profile: sessionInfo.profile,
          isEmailVerified: !!sessionInfo.user.email_confirmed_at,
          sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
          timeUntilExpiry: sessionInfo.timeUntilExpiry
        }));

        return true;
      } else {
        // Session refresh failed, logout user
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await logout();
      return false;
    }
  }, [logout]);

  /**
   * Send password reset email
   */
  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      const resetResponse = await EmailVerificationService.sendVerificationEmail({
        email,
        type: 'password_reset'
      });

      if (resetResponse.success) {
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for reset instructions.",
        });
        return true;
      } else {
        toast({
          title: "Reset Failed",
          description: resetResponse.error || "Failed to send reset email",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Reset Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Verify email token
   */
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    try {
      const verifyResponse = await EmailVerificationService.verifyEmailToken(token, 'signup');
      
      if (verifyResponse.success) {
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
        
        // Refresh auth state
        await checkSession();
        return true;
      } else {
        toast({
          title: "Verification Failed",
          description: verifyResponse.error || "Invalid verification token",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Email verification error:', error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Resend verification email
   */
  const resendVerification = useCallback(async (email: string): Promise<boolean> => {
    try {
      const resendResponse = await EmailVerificationService.resendVerificationEmail(email);
      
      if (resendResponse.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for verification instructions.",
        });
        return true;
      } else {
        toast({
          title: "Resend Failed",
          description: resendResponse.error || "Failed to resend verification email",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: "Resend Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  /**
   * Check current session
   */
  const checkSession = useCallback(async (): Promise<void> => {
    try {
      const sessionResponse = await SessionManagementService.validateSession();
      
      if (sessionResponse.success && sessionResponse.data) {
        const sessionInfo = sessionResponse.data;
        
        setAuthState(prev => ({
          ...prev,
          user: sessionInfo.user,
          session: sessionInfo.session,
          profile: sessionInfo.profile,
          isEmailVerified: !!sessionInfo.user.email_confirmed_at,
          sessionExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= 5,
          timeUntilExpiry: sessionInfo.timeUntilExpiry
        }));
      } else {
        // Session is invalid, logout
        await logout();
      }
    } catch (error) {
      console.error('Session check error:', error);
      await logout();
    }
  }, [logout]);

  /**
   * Accept invitation
   */
  const acceptInvitation = useCallback(async (
    token: string, 
    password: string, 
    fullName: string
  ): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Validate invitation token
      const invitationResponse = await InvitationService.getInvitationByToken(token);
      
      if (!invitationResponse.success || !invitationResponse.data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation is invalid or has expired.",
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      const invitation = invitationResponse.data;

      // Create user account
      const { supabase } = await import('../integrations/supabase/client');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
            tenant_id: invitation.tenant_id,
            role: invitation.role,
            invitation_id: invitation.id
          }
        }
      });

      if (authError) {
        toast({
          title: "Account Creation Failed",
          description: authError.message,
          variant: "destructive"
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      if (authData.user) {
        // Mark invitation as used
        await InvitationService.markInvitationAsUsed(invitation.id);

        toast({
          title: "Account Created Successfully",
          description: "Please check your email to verify your account.",
        });

        setAuthState(prev => ({ ...prev, loading: false }));
        navigate('/login');
        return true;
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    } catch (error) {
      console.error('Accept invitation error:', error);
      toast({
        title: "Invitation Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [navigate, toast]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Monitor session expiry
  useEffect(() => {
    if (authState.isAuthenticated && authState.sessionExpiringSoon) {
      const timer = setTimeout(() => {
        refreshSession();
      }, authState.timeUntilExpiry - (5 * 60 * 1000)); // Refresh 5 minutes before expiry

      return () => clearTimeout(timer);
    }
  }, [authState.isAuthenticated, authState.sessionExpiringSoon, authState.timeUntilExpiry, refreshSession]);

  return {
    ...authState,
    login,
    logout,
    refreshSession,
    sendPasswordReset,
    verifyEmail,
    resendVerification,
    checkSession,
    acceptInvitation
  };
}
