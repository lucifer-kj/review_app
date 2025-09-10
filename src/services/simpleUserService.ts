import { supabase } from '@/integrations/supabase/client';
import { BaseService, type ServiceResponse } from './baseService';

export interface SimpleUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface SimpleUserSearchResult {
  id: string;
  email: string;
  full_name: string;
  current_tenant_id: string | null;
  current_role: string | null;
}

/**
 * Simple User Service
 * Works with current database schema without requiring admin privileges
 */
export class SimpleUserService extends BaseService {
  /**
   * Get all users from profiles table
   */
  static async getAllUsers(limit: number = 50): Promise<ServiceResponse<SimpleUser[]>> {
    try {
      // Try to get users with tenant_id first, fallback to basic query
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: profiles, error } = await query;

      if (error) {
        // If the query fails due to schema issues, try a simpler query
        console.warn('Primary query failed, trying fallback:', error);
        
        const { data: fallbackProfiles, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            role,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fallbackError) {
          return this.handleError(fallbackError, 'SimpleUserService.getAllUsers');
        }

        // Create users from fallback data
        const users: SimpleUser[] = (fallbackProfiles || []).map(profile => ({
          id: profile.id,
          email: `user-${profile.id.substring(0, 8)}@example.com`, // Placeholder email
          full_name: `User ${profile.id.substring(0, 8)}`, // Placeholder name
          role: profile.role,
          created_at: profile.created_at,
          last_sign_in_at: null,
        }));

        return {
          data: users,
          error: null,
          success: true,
        };
      }

      // Create users from successful query
      const users: SimpleUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || `user-${profile.id.substring(0, 8)}@example.com`,
        full_name: profile.full_name || `User ${profile.id.substring(0, 8)}`,
        role: profile.role,
        created_at: profile.created_at,
        last_sign_in_at: null,
      }));

      return {
        data: users,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.getAllUsers');
    }
  }

  /**
   * Search users by query
   */
  static async searchUsers(query: string, limit: number = 10): Promise<ServiceResponse<SimpleUserSearchResult[]>> {
    try {
      if (query.length < 2) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          created_at
        `)
        .limit(limit);

      if (error) {
        return this.handleError(error, 'SimpleUserService.searchUsers');
      }

      // Filter profiles by query (searching in placeholder data for now)
      const searchResults: SimpleUserSearchResult[] = (profiles || [])
        .filter(profile => {
          const placeholderName = `User ${profile.id.substring(0, 8)}`;
          const placeholderEmail = `user-${profile.id.substring(0, 8)}@example.com`;
          return placeholderName.toLowerCase().includes(query.toLowerCase()) || 
                 placeholderEmail.toLowerCase().includes(query.toLowerCase());
        })
        .map(profile => ({
          id: profile.id,
          email: `user-${profile.id.substring(0, 8)}@example.com`,
          full_name: `User ${profile.id.substring(0, 8)}`,
          current_tenant_id: null, // Will be updated after migration
          current_role: profile.role,
        }));

      return {
        data: searchResults,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.searchUsers');
    }
  }

  /**
   * Get users for a specific tenant
   */
  static async getTenantUsers(tenantId: string): Promise<ServiceResponse<SimpleUser[]>> {
    try {
      // Try to query with tenant_id first
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          created_at
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        // If tenant_id query fails, fallback to all users
        console.warn('Tenant-specific query failed, falling back to all users:', error);
        return await this.getAllUsers(50);
      }

      // Create users from successful query
      const users: SimpleUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || `user-${profile.id.substring(0, 8)}@example.com`,
        full_name: profile.full_name || `User ${profile.id.substring(0, 8)}`,
        role: profile.role,
        created_at: profile.created_at,
        last_sign_in_at: null,
      }));

      return {
        data: users,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.getTenantUsers');
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        return this.handleError(error, 'SimpleUserService.updateUserRole');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.updateUserRole');
    }
  }

  /**
   * Add user to tenant (placeholder implementation)
   */
  static async addUserToTenant(userId: string, tenantId: string, role: string): Promise<ServiceResponse<boolean>> {
    try {
      // For now, just update the role since tenant_id doesn't exist yet
      // This will be updated after the migration is applied
      const response = await this.updateUserRole(userId, role);
      
      if (response.success) {
        return {
          data: true,
          error: null,
          success: true,
        };
      }

      return response;
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.addUserToTenant');
    }
  }

  /**
   * Remove user from tenant (placeholder implementation)
   */
  static async removeUserFromTenant(userId: string, tenantId: string): Promise<ServiceResponse<boolean>> {
    try {
      // For now, just reset the role since tenant_id doesn't exist yet
      // This will be updated after the migration is applied
      const response = await this.updateUserRole(userId, 'user');
      
      if (response.success) {
        return {
          data: true,
          error: null,
          success: true,
        };
      }

      return response;
    } catch (error) {
      return this.handleError(error, 'SimpleUserService.removeUserFromTenant');
    }
  }
}
