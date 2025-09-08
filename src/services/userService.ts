/**
 * Simple User Service for Magic Link System
 * Handles user listing and basic operations
 */

import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/admin';

export interface User {
  id: string;
  email: string;
  role: string;
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  data: User[];
  error?: string;
}

export class UserService {
  /**
   * Get all users from Supabase Auth
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      if (!isAdminClientConfigured()) {
        throw new Error('Admin client not configured');
      }

      // Get users from Supabase Auth
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(authError.message);
      }

      // Get profiles from database
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          role,
          tenant_id,
          created_at,
          updated_at,
          tenants!inner(name)
        `);

      if (profileError) {
        console.warn('Failed to get profiles:', profileError.message);
        // Return auth users without profile data
        return authUsers.users.map(user => ({
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role || 'user',
          tenant_id: user.user_metadata?.tenant_id,
          tenant_name: user.user_metadata?.tenant_name,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        }));
      }

      // Combine auth users with profile data
      const users: User[] = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || '',
          role: profile?.role || authUser.user_metadata?.role || 'user',
          tenant_id: profile?.tenant_id || authUser.user_metadata?.tenant_id,
          tenant_name: profile?.tenants?.name || authUser.user_metadata?.tenant_name,
          created_at: authUser.created_at,
          updated_at: profile?.updated_at || authUser.updated_at || authUser.created_at
        };
      });

      return users;

    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      if (!isAdminClientConfigured()) {
        throw new Error('Admin client not configured');
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError || !authUser.user) {
        return null;
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          email,
          role,
          tenant_id,
          created_at,
          updated_at,
          tenants!inner(name)
        `)
        .eq('id', userId)
        .single();

      return {
        id: authUser.user.id,
        email: authUser.user.email || '',
        role: profile?.role || authUser.user.user_metadata?.role || 'user',
        tenant_id: profile?.tenant_id || authUser.user.user_metadata?.tenant_id,
        tenant_name: profile?.tenants?.name || authUser.user.user_metadata?.tenant_name,
        created_at: authUser.user.created_at,
        updated_at: profile?.updated_at || authUser.user.updated_at || authUser.user.created_at
      };

    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          success: false,
          error: 'Admin client not configured'
        };
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
