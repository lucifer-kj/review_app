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
      console.log('🔧 UserCreationService: Starting user creation with data:', data);
      
      if (!isAdminClientConfigured()) {
        console.error('❌ UserCreationService: Admin client not configured');
        return {
          data: null,
          error: 'Admin client not configured. Please check your service role key.',
          success: false,
        };
      }

      console.log('✅ UserCreationService: Admin client configured');

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

      // Check if user already exists
      console.log(`🔍 Checking if user ${data.email} already exists...`);
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', data.email)
        .maybeSingle();

      if (profileCheckError) {
        console.warn('Could not check existing profiles:', profileCheckError);
      } else if (existingProfile) {
        console.log(`❌ User ${data.email} already exists in profiles table`);
        return {
          data: null,
          error: 'User with this email already exists',
          success: false,
        };
      } else {
        console.log(`✅ User ${data.email} not found in profiles table`);
      }

      // Check if there's an existing auth user with this email
      console.log(`🔍 Checking if user ${data.email} exists in auth system...`);
      const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (authCheckError) {
        console.warn('Could not check existing auth users:', authCheckError);
      } else if (existingAuthUser?.users?.some(user => user.email === data.email)) {
        console.log(`❌ User ${data.email} already exists in auth system`);
        return {
          data: null,
          error: 'User with this email already exists in authentication system',
          success: false,
        };
      } else {
        console.log(`✅ User ${data.email} not found in auth system`);
      }

      // Create user in Supabase Auth
      console.log(`🔨 Creating auth user for ${data.email}...`);
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
        console.error(`❌ Auth user creation failed for ${data.email}:`, authError);
        return this.handleError(authError, 'UserCreationService.createUserWithPassword');
      }

      if (!authData.user) {
        console.error(`❌ Auth user creation returned no user for ${data.email}`);
        return {
          data: null,
          error: 'Failed to create user in authentication system',
          success: false,
        };
      }

      console.log(`✅ Auth user created successfully: ${authData.user.id}`);

      // Create profile in database (use upsert to handle potential race conditions)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          role: data.role,
          tenant_id: data.tenantId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, clean up the auth user
        console.error('Profile creation failed, cleaning up auth user:', profileError);
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to clean up auth user:', cleanupError);
        }
        
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

  /**
   * Clean up orphaned auth users (users that exist in auth but not in profiles)
   */
  static async cleanupOrphanedUsers(): Promise<ServiceResponse<{ cleaned: number }>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured',
          success: false,
        };
      }

      // Get all auth users
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (authError) {
        return this.handleError(authError, 'UserCreationService.cleanupOrphanedUsers');
      }

      if (!authUsers?.users) {
        return {
          data: { cleaned: 0 },
          error: null,
          success: true,
        };
      }

      // Get all profile IDs
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id');

      if (profileError) {
        return this.handleError(profileError, 'UserCreationService.cleanupOrphanedUsers');
      }

      const profileIds = new Set(profiles?.map(p => p.id) || []);
      let cleaned = 0;

      // Find orphaned users and clean them up
      for (const user of authUsers.users) {
        if (!profileIds.has(user.id)) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(user.id);
            cleaned++;
            console.log(`Cleaned up orphaned user: ${user.email}`);
          } catch (deleteError) {
            console.error(`Failed to delete orphaned user ${user.email}:`, deleteError);
          }
        }
      }

      return {
        data: { cleaned },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserCreationService.cleanupOrphanedUsers');
    }
  }
}
