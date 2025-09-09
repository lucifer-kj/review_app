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
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return this.handleError(error, 'SimpleUserService.getAllUsers');
      }

      // For now, we'll create simple user objects from profiles
      // This will be enhanced after the migration is applied
      const users: SimpleUser[] = (profiles || []).map(profile => ({
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
   * Get users for a specific tenant (placeholder implementation)
   */
  static async getTenantUsers(tenantId: string): Promise<ServiceResponse<SimpleUser[]>> {
    try {
      // For now, return all users since tenant_id doesn't exist yet
      // This will be updated after the migration is applied
      const response = await this.getAllUsers(50);
      
      if (response.success && response.data) {
        return {
          data: response.data,
          error: null,
          success: true,
        };
      }

      return response;
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
