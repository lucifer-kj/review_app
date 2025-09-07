import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  invited_by: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface CreateInvitationData {
  tenant_id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
}

export interface AcceptInvitationData {
  token: string;
  password: string;
}

export class InvitationService extends BaseService {
  /**
   * Create a new invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<ServiceResponse<Invitation>> {
    try {
      // Generate a secure token
      const token = crypto.randomUUID();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: data.tenant_id,
          email: data.email,
          role: data.role,
          token: token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'InvitationService.createInvitation');
      }

      return {
        data: invitation,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.createInvitation');
    }
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<ServiceResponse<Invitation>> {
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .eq('used_at', null) // Not used yet
        .gt('expires_at', new Date().toISOString()) // Not expired
        .single();

      if (error) {
        return this.handleError(error, 'InvitationService.getInvitationByToken');
      }

      return {
        data: invitation,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.getInvitationByToken');
    }
  }

  /**
   * Accept invitation and create user account
   */
  static async acceptInvitation(data: AcceptInvitationData): Promise<ServiceResponse<{ user: any; profile: any }>> {
    try {
      // First, get the invitation
      const invitationResponse = await this.getInvitationByToken(data.token);
      if (!invitationResponse.success || !invitationResponse.data) {
        return {
          data: null,
          error: 'Invalid or expired invitation',
          success: false,
        };
      }

      const invitation = invitationResponse.data;

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
      });

      if (authError || !authData.user) {
        return this.handleError(authError, 'InvitationService.acceptInvitation');
      }

      // Create the user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: invitation.role,
          tenant_id: invitation.tenant_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return this.handleError(profileError, 'InvitationService.acceptInvitation');
      }

      // Mark invitation as used
      await supabase
        .from('user_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: invitation.tenant_id,
          user_id: authData.user.id,
          action: 'invitation_accepted',
          resource_type: 'user',
          resource_id: authData.user.id,
          details: {
            invitation_id: invitation.id,
            role: invitation.role,
          },
        });

      return {
        data: {
          user: authData.user,
          profile: profile,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.acceptInvitation');
    }
  }

  /**
   * Get invitations for a tenant
   */
  static async getTenantInvitations(tenantId: string): Promise<ServiceResponse<Invitation[]>> {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error, 'InvitationService.getTenantInvitations');
      }

      return {
        data: invitations || [],
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.getTenantInvitations');
    }
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('used_at', null); // Only cancel unused invitations

      if (error) {
        return this.handleError(error, 'InvitationService.cancelInvitation');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.cancelInvitation');
    }
  }

  /**
   * Resend invitation (create new token)
   */
  static async resendInvitation(invitationId: string): Promise<ServiceResponse<Invitation>> {
    try {
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', invitationId)
        .eq('used_at', null) // Only resend unused invitations
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'InvitationService.resendInvitation');
      }

      return {
        data: invitation,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.resendInvitation');
    }
  }
}
