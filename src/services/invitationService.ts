import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export class InvitationService extends BaseService {
  /**
   * Send invitation email to a user
   */
  static async sendInvitation(
    email: string,
    tenantName: string,
    tenantId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          tenant_name: tenantName,
          tenant_id: tenantId,
        },
        redirectTo: `${window.location.origin}/accept-invitation`,
      });

      if (error) {
        return this.handleError(error, 'InvitationService.sendInvitation');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.sendInvitation');
    }
  }

  /**
   * Create a user and send invitation
   */
  static async createUserAndInvite(
    email: string,
    tenantName: string,
    tenantId: string,
    role: 'tenant_admin' | 'user' = 'tenant_admin'
  ): Promise<ServiceResponse<{ userId: string; emailSent: boolean }>> {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: `${tenantName} ${role === 'tenant_admin' ? 'Admin' : 'User'}`,
          tenant_id: tenantId,
        },
      });

      if (authError) {
        return this.handleError(authError, 'InvitationService.createUserAndInvite');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          role: role,
          tenant_id: tenantId,
          full_name: `${tenantName} ${role === 'tenant_admin' ? 'Admin' : 'User'}`,
        });

      if (profileError) {
        return this.handleError(profileError, 'InvitationService.createUserAndInvite');
      }

      // Send invitation email
      let emailSent = false;
      try {
        const inviteResult = await this.sendInvitation(email, tenantName, tenantId);
        emailSent = inviteResult.success;
      } catch (inviteError) {
        console.warn('Failed to send invitation email:', inviteError);
        // Don't fail the whole process if email fails
      }

      return {
        data: {
          userId: authData.user.id,
          emailSent: emailSent,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.createUserAndInvite');
    }
  }
}