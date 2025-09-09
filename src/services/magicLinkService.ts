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
   * This sends a magic link email using Supabase's signInWithOtp method
   * which is the proper way to handle magic links.
   */
  static async inviteUserWithMagicLink(
    userData: CreateUserWithMagicLinkData
  ): Promise<ServiceResponse<{ email: string; magicLinkSent: boolean }>> {
    try {
      // First, create the user profile with admin client
      const { error: profileError } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('profiles')
          .upsert({
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      });

      if (profileError) {
        console.warn('Profile creation failed, continuing with magic link:', profileError);
      }

      // Send magic link using signInWithOtp (proper magic link method)
      const { error } = await supabase.auth.signInWithOtp({
        email: userData.email,
        options: {
          // Use environment-configured frontend URL for redirect
          emailRedirectTo: `${env.frontend.url}/auth/callback?type=invite`,
          data: {
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
          },
        },
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
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // Use environment-configured frontend URL for redirect
          emailRedirectTo: `${env.frontend.url}/auth/callback?type=invite`,
        },
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
   * Legacy method for backward compatibility
   * @deprecated Use inviteUserWithMagicLink instead
   */
  static async createUserWithMagicLink(
    userData: CreateUserWithMagicLinkData
  ): Promise<ServiceResponse<{ email: string; magicLinkSent: boolean }>> {
    console.warn('createUserWithMagicLink is deprecated, use inviteUserWithMagicLink instead');
    return this.inviteUserWithMagicLink(userData);
  }
}