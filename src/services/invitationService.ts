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
   * Create a user invitation record and send invitation
   */
  static async createUserAndInvite(
    email: string,
    tenantName: string,
    tenantId: string,
    role: 'tenant_admin' | 'user' = 'tenant_admin'
  ): Promise<ServiceResponse<{ invitationId: string; emailSent: boolean }>> {
    try {
      // Create invitation record in user_invitations table
      const { data: invitationData, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: tenantId,
          email: email,
          role: role,
          invited_by: null, // Will be set by RLS policy
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (invitationError) {
        return this.handleError(invitationError, 'InvitationService.createUserAndInvite');
      }

      // Send invitation email using Supabase Auth invite
      let emailSent = false;
      try {
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            tenant_name: tenantName,
            tenant_id: tenantId,
            invitation_id: invitationData.id,
            role: role,
          },
          redirectTo: `${window.location.origin}/accept-invitation?token=${invitationData.token}`,
        });

        if (!inviteError) {
          emailSent = true;
        } else {
          console.warn('Failed to send invitation email:', inviteError);
        }
      } catch (inviteError) {
        console.warn('Failed to send invitation email:', inviteError);
        // Don't fail the whole process if email fails
      }

      return {
        data: {
          invitationId: invitationData.id,
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