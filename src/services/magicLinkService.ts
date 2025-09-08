/**
 * Magic Link Service using Supabase's Built-in Auth
 * Simple email-based authentication without complex invitation flows
 */

import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/admin';
import { supabase } from '@/integrations/supabase/client';

export interface MagicLinkData {
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
  tenantName?: string;
  redirectTo?: string;
}

export interface MagicLinkResult {
  success: boolean;
  error?: string;
}

export class MagicLinkService {
  /**
   * Send magic link using Supabase's built-in system
   * This creates a user and sends them a magic link email
   */
  static async sendMagicLink(data: MagicLinkData): Promise<MagicLinkResult> {
    try {
      // Check if admin client is configured
      if (!isAdminClientConfigured()) {
        return {
          success: false,
          error: 'Admin client not configured. Please check your service role key.'
        };
      }

      // Prepare user metadata
      const userMetadata: Record<string, any> = {
        role: data.role,
      };

      if (data.tenantId) {
        userMetadata.tenant_id = data.tenantId;
      }

      if (data.tenantName) {
        userMetadata.tenant_name = data.tenantName;
      }

      // Set redirect URL
      const redirectUrl = data.redirectTo || `${window.location.origin}/dashboard`;

      console.log('Sending magic link:', {
        email: data.email,
        metadata: userMetadata,
        redirectUrl
      });

      // Create user and send magic link using Supabase Auth Admin
      const { data: userData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        {
          data: userMetadata,
          redirectTo: redirectUrl
        }
      );

      if (error) {
        console.error('Magic link error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send magic link'
        };
      }

      console.log('Magic link sent successfully:', userData);

      return {
        success: true
      };

    } catch (error) {
      console.error('Magic link service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send magic link for existing user (password reset style)
   */
  static async sendMagicLinkToExistingUser(email: string, redirectTo?: string): Promise<MagicLinkResult> {
    try {
      const redirectUrl = redirectTo || `${window.location.origin}/dashboard`;

      console.log('Sending magic link to existing user:', {
        email,
        redirectUrl
      });

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send magic link'
        };
      }

      console.log('Magic link sent successfully to existing user');

      return {
        success: true
      };

    } catch (error) {
      console.error('Magic link service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if admin client is properly configured
   */
  static isConfigured(): boolean {
    return isAdminClientConfigured();
  }

  /**
   * Get configuration status
   */
  static getConfigurationStatus(): {
    configured: boolean;
    message: string;
    recommendations: string[];
  } {
    const configured = this.isConfigured();
    
    if (configured) {
      return {
        configured: true,
        message: 'Admin client is properly configured',
        recommendations: []
      };
    }

    return {
      configured: false,
      message: 'Admin client is not configured',
      recommendations: [
        'Set VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file',
        'Ensure the service role key is valid and has admin privileges',
        'Restart your development server after adding the key',
        'Check Supabase dashboard for the correct service role key'
      ]
    };
  }
}
