import { supabase } from '@/integrations/supabase/client';
import { BaseService, type ServiceResponse } from './baseService';

export interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  role: 'tenant_admin' | 'user';
  created_at: string;
  last_sign_in_at: string | null;
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  current_tenant_id: string | null;
  current_role: string | null;
}

export interface AddUserToTenantData {
  userId: string;
  role: 'tenant_admin' | 'user';
}

/**
 * Tenant User Service
 * Handles user management operations within tenant workspaces
 */
export class TenantUserService extends BaseService {
  /**
   * Get all users in a tenant
   */
  static async getTenantUsers(tenantId: string): Promise<ServiceResponse<TenantUser[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          created_at,
          auth_users!inner(
            email,
            last_sign_in_at
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error, 'TenantUserService.getTenantUsers');
      }

      const tenantUsers: TenantUser[] = data.map(profile => ({
        id: profile.id,
        email: profile.auth_users?.email || '',
        full_name: profile.full_name,
        role: profile.role as 'tenant_admin' | 'user',
        created_at: profile.created_at,
        last_sign_in_at: profile.auth_users?.last_sign_in_at || null,
      }));

      return {
        data: tenantUsers,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.getTenantUsers');
    }
  }

  /**
   * Search for users to add to tenant
   */
  static async searchUsers(query: string, limit: number = 10): Promise<ServiceResponse<UserSearchResult[]>> {
    try {
      if (query.length < 2) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          tenant_id,
          auth_users!inner(
            email
          )
        `)
        .or(`full_name.ilike.%${query}%,auth_users.email.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        return this.handleError(error, 'TenantUserService.searchUsers');
      }

      const searchResults: UserSearchResult[] = data.map(profile => ({
        id: profile.id,
        email: profile.auth_users?.email || '',
        full_name: profile.full_name,
        current_tenant_id: profile.tenant_id,
        current_role: profile.role,
      }));

      return {
        data: searchResults,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.searchUsers');
    }
  }

  /**
   * Add user to tenant
   */
  static async addUserToTenant(
    tenantId: string, 
    userData: AddUserToTenantData
  ): Promise<ServiceResponse<TenantUser>> {
    try {
      // Update user's tenant_id and role
      const { data, error } = await supabase
        .from('profiles')
        .update({
          tenant_id: tenantId,
          role: userData.role,
        })
        .eq('id', userData.userId)
        .select(`
          id,
          full_name,
          role,
          created_at,
          auth_users!inner(
            email,
            last_sign_in_at
          )
        `)
        .single();

      if (error) {
        return this.handleError(error, 'TenantUserService.addUserToTenant');
      }

      const tenantUser: TenantUser = {
        id: data.id,
        email: data.auth_users?.email || '',
        full_name: data.full_name,
        role: data.role as 'tenant_admin' | 'user',
        created_at: data.created_at,
        last_sign_in_at: data.auth_users?.last_sign_in_at || null,
      };

      return {
        data: tenantUser,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.addUserToTenant');
    }
  }

  /**
   * Update user role in tenant
   */
  static async updateUserRole(
    userId: string, 
    newRole: 'tenant_admin' | 'user'
  ): Promise<ServiceResponse<TenantUser>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select(`
          id,
          full_name,
          role,
          created_at,
          auth_users!inner(
            email,
            last_sign_in_at
          )
        `)
        .single();

      if (error) {
        return this.handleError(error, 'TenantUserService.updateUserRole');
      }

      const tenantUser: TenantUser = {
        id: data.id,
        email: data.auth_users?.email || '',
        full_name: data.full_name,
        role: data.role as 'tenant_admin' | 'user',
        created_at: data.created_at,
        last_sign_in_at: data.auth_users?.last_sign_in_at || null,
      };

      return {
        data: tenantUser,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.updateUserRole');
    }
  }

  /**
   * Remove user from tenant
   */
  static async removeUserFromTenant(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tenant_id: null,
          role: 'user', // Reset to default role
        })
        .eq('id', userId);

      if (error) {
        return this.handleError(error, 'TenantUserService.removeUserFromTenant');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.removeUserFromTenant');
    }
  }

  /**
   * Get user details by ID
   */
  static async getUserById(userId: string): Promise<ServiceResponse<TenantUser>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          created_at,
          auth_users!inner(
            email,
            last_sign_in_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        return this.handleError(error, 'TenantUserService.getUserById');
      }

      const tenantUser: TenantUser = {
        id: data.id,
        email: data.auth_users?.email || '',
        full_name: data.full_name,
        role: data.role as 'tenant_admin' | 'user',
        created_at: data.created_at,
        last_sign_in_at: data.auth_users?.last_sign_in_at || null,
      };

      return {
        data: tenantUser,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.getUserById');
    }
  }

  /**
   * Check if user can be added to tenant
   */
  static async canAddUserToTenant(
    userId: string, 
    tenantId: string
  ): Promise<ServiceResponse<{ canAdd: boolean; reason?: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', userId)
        .single();

      if (error) {
        return this.handleError(error, 'TenantUserService.canAddUserToTenant');
      }

      // Check if user is already in this tenant
      if (data.tenant_id === tenantId) {
        return {
          data: { canAdd: false, reason: 'User is already in this tenant' },
          error: null,
          success: true,
        };
      }

      // Check if user is a super admin (can't be moved)
      if (data.role === 'super_admin') {
        return {
          data: { canAdd: false, reason: 'Super admins cannot be assigned to tenants' },
          error: null,
          success: true,
        };
      }

      return {
        data: { canAdd: true },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantUserService.canAddUserToTenant');
    }
  }
}
