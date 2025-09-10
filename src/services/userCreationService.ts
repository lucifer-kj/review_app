import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/admin';
import { BaseService, type ServiceResponse } from './baseService';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
}

export interface CreateUserResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  profile: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tenant_id?: string;
    created_at: string;
  };
}

export class UserCreationService extends BaseService {
  /**
   * Create a new user with email and password
   */
  static async createUserWithPassword(data: CreateUserData): Promise<ServiceResponse<CreateUserResponse>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured. Please check your service role key.',
          success: false,
        };
      }

      // Validate input
      if (!data.email || !data.password || !data.fullName) {
        return {
          data: null,
          error: 'Email, password, and full name are required',
          success: false,
        };
      }

      if (data.password.length < 6) {
        return {
          data: null,
          error: 'Password must be at least 6 characters long',
          success: false,
        };
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: data.fullName,
          role: data.role,
          tenant_id: data.tenantId,
        },
      });

      if (authError) {
        return this.handleError(authError, 'UserCreationService.createUserWithPassword');
      }

      if (!authData.user) {
        return {
          data: null,
          error: 'Failed to create user in authentication system',
          success: false,
        };
      }

      // Create profile in database
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: data.role,
          tenant_id: data.tenantId || null,
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, clean up the auth user
        console.error('Profile creation failed, cleaning up auth user:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return this.handleError(profileError, 'UserCreationService.createUserWithPassword');
      }

      // If tenant_id is provided, ensure the tenant exists
      if (data.tenantId) {
        const { error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('id', data.tenantId)
          .single();

        if (tenantError) {
          console.warn('Tenant not found, user created without tenant association:', tenantError);
        }
      }

      return {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email || data.email,
            created_at: authData.user.created_at,
          },
          profile: {
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            role: profileData.role,
            tenant_id: profileData.tenant_id,
            created_at: profileData.created_at,
          },
        },
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'UserCreationService.createUserWithPassword');
    }
  }

  /**
   * Create a user and assign them to a tenant
   */
  static async createUserForTenant(
    tenantId: string,
    userData: Omit<CreateUserData, 'tenantId'>
  ): Promise<ServiceResponse<CreateUserResponse>> {
    try {
      // Verify tenant exists
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) {
        return {
          data: null,
          error: 'Tenant not found',
          success: false,
        };
      }

      // Create user with tenant assignment
      return await this.createUserWithPassword({
        ...userData,
        tenantId,
      });

    } catch (error) {
      return this.handleError(error, 'UserCreationService.createUserForTenant');
    }
  }

  /**
   * Update user password
   */
  static async updateUserPassword(userId: string, newPassword: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured',
          success: false,
        };
      }

      if (newPassword.length < 6) {
        return {
          data: null,
          error: 'Password must be at least 6 characters long',
          success: false,
        };
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        return this.handleError(error, 'UserCreationService.updateUserPassword');
      }

      return {
        data: true,
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'UserCreationService.updateUserPassword');
    }
  }

  /**
   * Update user role and tenant assignment
   */
  static async updateUserRole(
    userId: string,
    role: string,
    tenantId?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured',
          success: false,
        };
      }

      // Update profile in database
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role,
          tenant_id: tenantId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        return this.handleError(profileError, 'UserCreationService.updateUserRole');
      }

      // Update auth user metadata
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          role,
          tenant_id: tenantId,
        },
      });

      if (authError) {
        console.warn('Failed to update auth user metadata:', authError);
        // Don't fail the entire operation for metadata update failure
      }

      return {
        data: true,
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'UserCreationService.updateUserRole');
    }
  }

  /**
   * Get available tenants for user assignment
   */
  static async getAvailableTenants(): Promise<ServiceResponse<Array<{ id: string; name: string }>>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured',
          success: false,
        };
      }

      const { data: tenants, error } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) {
        return this.handleError(error, 'UserCreationService.getAvailableTenants');
      }

      return {
        data: tenants || [],
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'UserCreationService.getAvailableTenants');
    }
  }
}
