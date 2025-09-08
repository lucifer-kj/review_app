/**
 * Session Management Service
 * Handles secure session management, token refresh, and session validation
 */

import { supabase } from '../integrations/supabase/client';
import { BaseService } from './baseService';
import { ServiceResponse } from '../types/api.types';

export interface SessionInfo {
  user: any;
  session: any;
  profile: any;
  tenant: any;
  expiresAt: Date;
  isExpired: boolean;
  timeUntilExpiry: number; // in milliseconds
}

export interface SessionConfig {
  refreshThreshold: number; // minutes before expiry to refresh
  maxSessionDuration: number; // hours
  autoRefresh: boolean;
  logoutOnExpiry: boolean;
}

export class SessionManagementService extends BaseService {
  private static config: SessionConfig = {
    refreshThreshold: 5, // Refresh 5 minutes before expiry
    maxSessionDuration: 24, // 24 hours max session
    autoRefresh: true,
    logoutOnExpiry: true
  };

  private static refreshTimer: NodeJS.Timeout | null = null;
  private static sessionCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize session management
   */
  static async initializeSession(): Promise<ServiceResponse<SessionInfo>> {
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return this.handleError(sessionError, 'SessionManagementService.initializeSession');
      }

      if (!session) {
        return {
          success: false,
          error: 'No active session',
          data: null
        };
      }

      // Get user profile
      const profileResponse = await this.getUserProfile(session.user.id);
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: 'User profile not found',
          data: null
        };
      }

      // Get tenant info if applicable
      let tenant = null;
      if (profileResponse.data.tenant_id) {
        const tenantResponse = await this.getTenantInfo(profileResponse.data.tenant_id);
        if (tenantResponse.success) {
          tenant = tenantResponse.data;
        }
      }

      const sessionInfo: SessionInfo = {
        user: session.user,
        session,
        profile: profileResponse.data,
        tenant,
        expiresAt: new Date(session.expires_at! * 1000),
        isExpired: new Date(session.expires_at! * 1000) < new Date(),
        timeUntilExpiry: new Date(session.expires_at! * 1000).getTime() - new Date().getTime()
      };

      // Start session monitoring
      this.startSessionMonitoring();

      return {
        success: true,
        data: sessionInfo,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.initializeSession');
    }
  }

  /**
   * Refresh session token
   */
  static async refreshSession(): Promise<ServiceResponse<SessionInfo>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        return this.handleError(error, 'SessionManagementService.refreshSession');
      }

      if (!data.session) {
        return {
          success: false,
          error: 'Failed to refresh session',
          data: null
        };
      }

      // Get updated profile
      const profileResponse = await this.getUserProfile(data.session.user.id);
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: 'User profile not found after refresh',
          data: null
        };
      }

      const sessionInfo: SessionInfo = {
        user: data.session.user,
        session: data.session,
        profile: profileResponse.data,
        tenant: null, // Will be loaded separately if needed
        expiresAt: new Date(data.session.expires_at! * 1000),
        isExpired: false,
        timeUntilExpiry: new Date(data.session.expires_at! * 1000).getTime() - new Date().getTime()
      };

      return {
        success: true,
        data: sessionInfo,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.refreshSession');
    }
  }

  /**
   * Validate current session
   */
  static async validateSession(): Promise<ServiceResponse<SessionInfo>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return this.handleError(error, 'SessionManagementService.validateSession');
      }

      if (!session) {
        return {
          success: false,
          error: 'No active session',
          data: null
        };
      }

      // Check if session is expired
      const isExpired = new Date(session.expires_at! * 1000) < new Date();
      
      if (isExpired) {
        if (this.config.logoutOnExpiry) {
          await this.logout();
        }
        return {
          success: false,
          error: 'Session expired',
          data: null
        };
      }

      // Get user profile
      const profileResponse = await this.getUserProfile(session.user.id);
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: 'User profile not found',
          data: null
        };
      }

      const sessionInfo: SessionInfo = {
        user: session.user,
        session,
        profile: profileResponse.data,
        tenant: null,
        expiresAt: new Date(session.expires_at! * 1000),
        isExpired: false,
        timeUntilExpiry: new Date(session.expires_at! * 1000).getTime() - new Date().getTime()
      };

      return {
        success: true,
        data: sessionInfo,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.validateSession');
    }
  }

  /**
   * Logout user and clear session
   */
  static async logout(): Promise<ServiceResponse<boolean>> {
    try {
      // Stop session monitoring
      this.stopSessionMonitoring();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return this.handleError(error, 'SessionManagementService.logout');
      }

      // Clear any stored session data
      this.clearStoredSessionData();

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.logout');
    }
  }

  /**
   * Start automatic session monitoring
   */
  private static startSessionMonitoring(): void {
    // Clear existing timers
    this.stopSessionMonitoring();

    if (!this.config.autoRefresh) {
      return;
    }

    // Check session every minute
    this.sessionCheckInterval = setInterval(async () => {
      const sessionResponse = await this.validateSession();
      
      if (!sessionResponse.success) {
        // Session is invalid, stop monitoring
        this.stopSessionMonitoring();
        return;
      }

      const sessionInfo = sessionResponse.data!;
      const minutesUntilExpiry = sessionInfo.timeUntilExpiry / (1000 * 60);

      // Refresh if within threshold
      if (minutesUntilExpiry <= this.config.refreshThreshold) {
        await this.refreshSession();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop session monitoring
   */
  private static stopSessionMonitoring(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Get user profile
   */
  private static async getUserProfile(userId: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return this.handleError(error, 'SessionManagementService.getUserProfile');
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.getUserProfile');
    }
  }

  /**
   * Get tenant information
   */
  private static async getTenantInfo(tenantId: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        return this.handleError(error, 'SessionManagementService.getTenantInfo');
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.getTenantInfo');
    }
  }

  /**
   * Clear stored session data
   */
  private static clearStoredSessionData(): void {
    // Clear any localStorage/sessionStorage data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  }

  /**
   * Update session configuration
   */
  static updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get session configuration
   */
  static getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Check if session is about to expire
   */
  static async isSessionExpiringSoon(): Promise<ServiceResponse<boolean>> {
    try {
      const sessionResponse = await this.validateSession();
      
      if (!sessionResponse.success) {
        return {
          success: false,
          error: 'No valid session',
          data: null
        };
      }

      const sessionInfo = sessionResponse.data!;
      const minutesUntilExpiry = sessionInfo.timeUntilExpiry / (1000 * 60);
      const isExpiringSoon = minutesUntilExpiry <= this.config.refreshThreshold;

      return {
        success: true,
        data: isExpiringSoon,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.isSessionExpiringSoon');
    }
  }

  /**
   * Force session refresh
   */
  static async forceRefresh(): Promise<ServiceResponse<SessionInfo>> {
    return this.refreshSession();
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<ServiceResponse<any>> {
    try {
      const sessionResponse = await this.validateSession();
      
      if (!sessionResponse.success) {
        return {
          success: false,
          error: 'No valid session',
          data: null
        };
      }

      const sessionInfo = sessionResponse.data!;
      const stats = {
        userId: sessionInfo.user.id,
        email: sessionInfo.user.email,
        role: sessionInfo.profile.role,
        tenantId: sessionInfo.profile.tenant_id,
        expiresAt: sessionInfo.expiresAt,
        timeUntilExpiry: sessionInfo.timeUntilExpiry,
        minutesUntilExpiry: Math.floor(sessionInfo.timeUntilExpiry / (1000 * 60)),
        isExpiringSoon: sessionInfo.timeUntilExpiry / (1000 * 60) <= this.config.refreshThreshold
      };

      return {
        success: true,
        data: stats,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'SessionManagementService.getSessionStats');
    }
  }
}
