import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
import { BaseService, type ServiceResponse } from "./baseService";
import { env } from "@/utils/env";

export interface CreateUserWithMagicLinkData {
  email: string;
  fullName: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
}

/**
 * Streamlined Magic Link Service
 * 
 * This service ONLY handles Supabase magic link invitations.
 * Uses Supabase's native email templates and authentication flow.
 */
export class MagicLinkService extends BaseService {
  /**
   * Invite user with magic link - PRIMARY method
   * 
   * This creates a user in Supabase auth and sends them a magic link email
   * using Supabase's built-in invitation system.
   */
  static async inviteUserWithMagicLink(
    userData: CreateUserWithMagicLinkData
  ): Promise<ServiceResponse<{ email: string; magicLinkSent: boolean }>> {
    try {
      // Use inviteUserByEmail which bypasses signup restrictions
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(userData.email, {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
          },
          // Use environment-configured frontend URL for redirect
          redirectTo: `${env.frontend.url}/accept-invitation`,
        });
      });

      if (error) {
        return this.handleError(error, 'MagicLinkService.inviteUserWithMagicLink');
      }

      return {
        data: {
          email: userData.email,
          magicLinkSent: true,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'MagicLinkService.inviteUserWithMagicLink');
    }
  }

  /**
   * Send magic link to existing user (for re-invitations)
   * @deprecated Use inviteUserWithMagicLink with proper user data instead
   */
  static async sendMagicLinkToUser(
    email: string,
    redirectTo: string = '/dashboard'
  ): Promise<ServiceResponse<boolean>> {
    try {
      console.warn('sendMagicLinkToUser is deprecated, use inviteUserWithMagicLink instead');
      
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          // Use environment-configured frontend URL for redirect
          redirectTo: `${env.frontend.url}/accept-invitation`,
        });
      });

      if (error) {
        return this.handleError(error, 'MagicLinkService.sendMagicLinkToUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'MagicLinkService.sendMagicLinkToUser');
    }
  }

  /**
   * Create user with password and send magic link for first login
   * This creates both the auth user and profile, then sends a magic link
   */
  static async createUserWithMagicLink(
    userData: CreateUserWithMagicLinkData
  ): Promise<ServiceResponse<{ email: string; userId: string; magicLinkSent: boolean }>> {
    try {
      // Check if admin client is configured
      if (!env.supabase.serviceRoleKey || env.supabase.serviceRoleKey === 'placeholder_service_key') {
        return {
          data: null,
          error: 'Admin client not configured. Please check your service role key.',
          success: false,
        };
      }

      console.log('🔧 Admin client configured, proceeding with user creation...');

      // First check if user already exists
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single();

      if (existingProfile) {
        return {
          data: null,
          error: 'User with this email already exists',
          success: false,
        };
      }

      // Generate a temporary password
      const tempPassword = this.generateTemporaryPassword();
      
      // Create user in Supabase Auth with temporary password
      console.log('🔐 Creating auth user...');
      const { data: authData, error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
          },
        });
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        return this.handleError(authError, 'MagicLinkService.createUserWithMagicLink');
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth creation');
        return {
          data: null,
          error: 'Failed to create user in authentication system',
          success: false,
        };
      }

      console.log('✅ Auth user created successfully:', authData.user.id);

      // Create profile in database
      console.log('👤 Creating user profile...');
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role,
          tenant_id: userData.tenantId || null,
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, clean up the auth user
        console.error('❌ Profile creation failed, cleaning up auth user:', profileError);
        try {
          await withAdminAuth(async () => {
            return await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          });
          console.log('🧹 Auth user cleaned up successfully');
        } catch (cleanupError) {
          console.error('❌ Failed to clean up auth user:', cleanupError);
        }
        
        return this.handleError(profileError, 'MagicLinkService.createUserWithMagicLink');
      }

      console.log('✅ User profile created successfully:', profileData.id);

      // Send magic link for first login
      const { error: magicLinkError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: userData.email,
          options: {
            redirectTo: `${env.frontend.url}/dashboard`,
          },
        });
      });

      if (magicLinkError) {
        console.warn('Failed to send magic link, but user was created:', magicLinkError);
        // Don't fail the entire operation for magic link failure
      }

      return {
        data: {
          email: userData.email,
          userId: authData.user.id,
          magicLinkSent: !magicLinkError,
        },
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'MagicLinkService.createUserWithMagicLink');
    }
  }

  /**
   * Generate a temporary password for new users
   */
  private static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}