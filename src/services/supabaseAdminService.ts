/**
 * Supabase Admin Service
 * Centralized service for admin operations with proper error handling
 */

import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/admin';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export interface InviteUserOptions {
  email: string;
  data?: Record<string, any>;
  redirectTo?: string;
}

export class SupabaseAdminService {
  /**
   * Check if admin client is properly configured
   */
  static isConfigured(): boolean {
    return isAdminClientConfigured();
  }

  /**
   * Get user by email (using profiles table as fallback)
   */
  static async getUserByEmail(email: string): Promise<{ user: AdminUser | null; error: any }> {
    try {
      if (!this.isConfigured()) {
        // Fallback to profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .eq('email', email)
          .single();

        if (error) {
          return { user: null, error };
        }

        return {
          user: profile ? {
            id: profile.id,
            email: profile.email,
            created_at: profile.created_at,
            email_confirmed_at: null,
            last_sign_in_at: null
          } : null,
          error: null
        };
      }

      // Use admin client if available
      const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      return { user: data?.user || null, error };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { user: null, error };
    }
  }

  /**
   * Invite user by email
   */
  static async inviteUserByEmail(options: InviteUserOptions): Promise<{ error: any }> {
    try {
      if (!this.isConfigured()) {
        return {
          error: new Error('Admin client not configured. Please check your service role key.')
        };
      }

      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        options.email,
        {
          data: options.data || {},
          redirectTo: options.redirectTo
        }
      );

      return { error };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { error };
    }
  }

  /**
   * List users
   */
  static async listUsers(): Promise<{ users: AdminUser[]; error: any }> {
    try {
      if (!this.isConfigured()) {
        // Fallback to profiles table
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          return { users: [], error };
        }

        const users: AdminUser[] = profiles.map(profile => ({
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          email_confirmed_at: null,
          last_sign_in_at: null
        }));

        return { users, error: null };
      }

      // Use admin client if available
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      return { users: data?.users || [], error };
    } catch (error) {
      console.error('Error listing users:', error);
      return { users: [], error };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<{ error: any }> {
    try {
      if (!this.isConfigured()) {
        return {
          error: new Error('Admin client not configured. Please check your service role key.')
        };
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, attributes: any): Promise<{ user: AdminUser | null; error: any }> {
    try {
      if (!this.isConfigured()) {
        return {
          user: null,
          error: new Error('Admin client not configured. Please check your service role key.')
        };
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, attributes);
      return { user: data?.user || null, error };
    } catch (error) {
      console.error('Error updating user:', error);
      return { user: null, error };
    }
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
