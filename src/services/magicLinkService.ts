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
      // Send magic link using Supabase Auth
      // This will create the user in auth.users and send invitation email
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(userData.email, {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
          },
          // Use environment-configured frontend URL for redirect
          redirectTo: `${env.frontend.url}/auth/callback?type=invite`,
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
          redirectTo: `${env.frontend.url}/auth/callback?type=invite`,
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