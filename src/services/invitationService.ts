import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export class InvitationService extends BaseService {
  /**
   * Send invitation email using Supabase's built-in invitation system
   * This will redirect users to /accept-invitation where they can create their password
   */
  static async sendInvitation(
    email: string,
    tenantName: string,
    tenantId: string,
    role: 'tenant_admin' | 'user' = 'tenant_admin'
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Use Supabase's built-in invitation system
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          tenant_name: tenantName,
          tenant_id: tenantId,
          role: role,
        },
        // Redirect to our custom password creation page
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
   * This is the main method used by the tenant creation wizard
   */
  static async createUserAndInvite(
    email: string,
    tenantName: string,
    tenantId: string,
    role: 'tenant_admin' | 'user' = 'tenant_admin'
  ): Promise<ServiceResponse<{ invitationId: string; emailSent: boolean }>> {
    try {
      // Use the create_tenant_with_admin function which handles RLS properly
      const { data: result, error: functionError } = await supabase.rpc('create_tenant_with_admin', {
        tenant_data: {
          name: tenantName,
          id: tenantId
        },
        admin_email: email
      });

      if (functionError) {
        // Fallback: try direct insert with service role context
        const { data: invitationData, error: invitationError } = await supabase
          .from('user_invitations')
          .insert({
            tenant_id: tenantId,
            email: email,
            role: role,
            invited_by: null,
            token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (invitationError) {
          return this.handleError(invitationError, 'InvitationService.createUserAndInvite');
        }

        // Send invitation email using Supabase Auth invite with dynamic redirect URL
        let emailSent = false;
        try {
          const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
              tenant_name: tenantName,
              tenant_id: tenantId,
              invitation_id: invitationData.id,
              role: role,
            },
            // Dynamic redirect URL for password creation
            redirectTo: `${window.location.origin}/accept-invitation?tenant_id=${tenantId}&invitation_id=${invitationData.id}`,
          });

          if (!inviteError) {
            emailSent = true;
          } else {
            console.warn('Failed to send invitation email:', inviteError);
          }
        } catch (inviteError) {
          console.warn('Failed to send invitation email:', inviteError);
        }

        return {
          data: {
            invitationId: invitationData.id,
            emailSent: emailSent,
          },
          error: null,
          success: true,
        };
      }

      // If function succeeded, get the invitation ID
      const { data: invitationData } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .single();

      // Send invitation email using Supabase Auth invite with dynamic redirect URL
      let emailSent = false;
      try {
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            tenant_name: tenantName,
            tenant_id: tenantId,
            invitation_id: invitationData?.id,
            role: role,
          },
          // Dynamic redirect URL for password creation
          redirectTo: `${window.location.origin}/accept-invitation?tenant_id=${tenantId}&invitation_id=${invitationData?.id}`,
        });

        if (!inviteError) {
          emailSent = true;
        } else {
          console.warn('Failed to send invitation email:', inviteError);
        }
      } catch (inviteError) {
        console.warn('Failed to send invitation email:', inviteError);
      }

      return {
        data: {
          invitationId: invitationData?.id || 'unknown',
          emailSent: emailSent,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.createUserAndInvite');
    }
  }

  /**
   * Check if an email is invited (for validation purposes)
   */
  static async isEmailInvited(email: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', email)
        .eq('used_at', null)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return this.handleError(error, 'InvitationService.isEmailInvited');
      }

      return {
        data: !!data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.isEmailInvited');
    }
  }
}