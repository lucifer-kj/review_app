import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, withAdminAuth } from '@/integrations/supabase/admin';
import { BaseService, type ServiceResponse } from './baseService';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
}

export interface UpdateUserData {
  full_name?: string;
  role?: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
}

/**
 * User Management Service
 * Handles user creation, updates, and password management for administrators
 */
export class UserManagementService extends BaseService {
  /**
   * Create a new user with email and password
   */
  static async createUser(userData: CreateUserData): Promise<ServiceResponse<UserProfile>> {
    try {
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role,
            tenant_id: userData.tenant_id,
          }
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.createUser');
      }

      if (!data.user) {
        return this.handleError(new Error('User creation failed'), 'UserManagementService.createUser');
      }

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: userData.full_name,
          role: userData.role,
          tenant_id: userData.tenant_id,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the entire operation, just log the error
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: userData.full_name,
        role: userData.role,
        tenant_id: userData.tenant_id || null,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at,
        email_confirmed_at: data.user.email_confirmed_at,
      };

      return {
        data: userProfile,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.createUser');
    }
  }

  /**
   * Update user password (admin function)
   */
  static async updateUserPassword(userId: string, newPassword: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.updateUserPassword');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.updateUserPassword');
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(userId: string, updateData: UpdateUserData): Promise<ServiceResponse<UserProfile>> {
    try {
      // Update auth user metadata
      const { error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: updateData.full_name,
            role: updateData.role,
            tenant_id: updateData.tenant_id,
          }
        });
      });

      if (authError) {
        return this.handleError(authError, 'UserManagementService.updateUserProfile');
      }

      // Update profile record
      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updateData.full_name,
          role: updateData.role,
          tenant_id: updateData.tenant_id,
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        return this.handleError(profileError, 'UserManagementService.updateUserProfile');
      }

      // Get updated user from auth
      const { data: authUser } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.getUserById(userId);
      });

      const userProfile: UserProfile = {
        id: data.id,
        email: authUser?.user?.email || '',
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
        created_at: data.created_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      };

      return {
        data: userProfile,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.updateUserProfile');
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return this.handleError(error, 'UserManagementService.getUserProfile');
      }

      // Get auth user data
      const { data: authUser } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.getUserById(userId);
      });

      const userProfile: UserProfile = {
        id: data.id,
        email: authUser?.user?.email || '',
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
        created_at: data.created_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      };

      return {
        data: userProfile,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.getUserProfile');
    }
  }

  /**
   * List all users (admin function)
   */
  static async listUsers(tenantId?: string): Promise<ServiceResponse<UserProfile[]>> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'UserManagementService.listUsers');
      }

      // Get auth user data for each profile
      const userProfiles: UserProfile[] = [];
      
      for (const profile of data) {
        const { data: authUser } = await withAdminAuth(async () => {
          return await supabaseAdmin.auth.admin.getUserById(profile.id);
        });

        userProfiles.push({
          id: profile.id,
          email: authUser?.user?.email || '',
          full_name: profile.full_name,
          role: profile.role,
          tenant_id: profile.tenant_id,
          created_at: profile.created_at,
          last_sign_in_at: authUser?.user?.last_sign_in_at || null,
          email_confirmed_at: authUser?.user?.email_confirmed_at || null,
        });
      }

      return {
        data: userProfiles,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.listUsers');
    }
  }

  /**
   * Delete user (admin function)
   */
  static async deleteUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.deleteUser(userId);
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.deleteUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.deleteUser');
    }
  }

  /**
   * Move user to different tenant
   */
  static async moveUserToTenant(
    userId: string, 
    newTenantId: string | null, 
    newRole: 'super_admin' | 'tenant_admin' | 'user' = 'user'
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      // Update user's tenant_id and role
      const { data, error } = await supabase
        .from('profiles')
        .update({
          tenant_id: newTenantId,
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'UserManagementService.moveUserToTenant');
      }

      // Update auth user metadata
      const { error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            tenant_id: newTenantId,
            role: newRole,
          }
        });
      });

      if (authError) {
        console.error('Auth metadata update error:', authError);
        // Don't fail the entire operation, just log the error
      }

      // Get updated user from auth
      const { data: authUser } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.getUserById(userId);
      });

      const userProfile: UserProfile = {
        id: data.id,
        email: authUser?.user?.email || '',
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
        created_at: data.created_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      };

      // Trigger a refresh of the user's session to update their context
      // This will cause the useAuth hook to refetch profile and tenant data
      try {
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.warn('Failed to refresh session after tenant update:', refreshError);
      }

      return {
        data: userProfile,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.moveUserToTenant');
    }
  }

  /**
   * Promote user to different role
   */
  static async promoteUser(
    userId: string, 
    newRole: 'super_admin' | 'tenant_admin' | 'user'
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      // Update user's role
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'UserManagementService.promoteUser');
      }

      // Update auth user metadata
      const { error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            role: newRole,
          }
        });
      });

      if (authError) {
        console.error('Auth metadata update error:', authError);
        // Don't fail the entire operation, just log the error
      }

      // Get updated user from auth
      const { data: authUser } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.getUserById(userId);
      });

      const userProfile: UserProfile = {
        id: data.id,
        email: authUser?.user?.email || '',
        full_name: data.full_name,
        role: data.role,
        tenant_id: data.tenant_id,
        created_at: data.created_at,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        email_confirmed_at: authUser?.user?.email_confirmed_at || null,
      };

      return {
        data: userProfile,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.promoteUser');
    }
  }

  /**
   * Ban user (admin function)
   */
  static async banUser(userId: string, duration?: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: duration || '876000h' // Default to 100 years (effectively permanent)
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.banUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.banUser');
    }
  }

  /**
   * Unban user (admin function)
   */
  static async unbanUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.unbanUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.unbanUser');
    }
  }

  /**
   * Suspend user (admin function)
   */
  static async suspendUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { suspended: true }
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.suspendUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.suspendUser');
    }
  }

  /**
   * Unsuspend user (admin function)
   */
  static async unsuspendUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { suspended: false }
        });
      });

      if (error) {
        return this.handleError(error, 'UserManagementService.unsuspendUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserManagementService.unsuspendUser');
    }
  }
}
