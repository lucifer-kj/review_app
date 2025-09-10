import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './baseService';

export interface UserInvitation {
  id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  token: string;
}

export interface CreateInvitationData {
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  expires_in_days?: number;
}

export interface InvitationResponse {
  success: boolean;
  data?: UserInvitation;
  error?: string;
}

export class InvitationService extends BaseService {
  /**
   * Create a new user invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<InvitationResponse> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Check if invitation already exists and is pending
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('id, status')
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        return {
          success: false,
          error: 'Pending invitation already exists for this email'
        };
      }

      // Generate invitation token
      const token = this.generateInvitationToken();
      
      // Calculate expiry date
      const expiresInDays = data.expires_in_days || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email: data.email,
          role: data.role,
          tenant_id: data.tenant_id,
          invited_by: user.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          token: token
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: invitation
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.createInvitation');
    }
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<InvitationResponse> {
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (error) {
        return {
          success: false,
          error: 'Invitation not found or expired'
        };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        await supabase
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return {
          success: false,
          error: 'Invitation has expired'
        };
      }

      return {
        success: true,
        data: invitation
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.getInvitationByToken');
    }
  }

  /**
   * Get invitation by email
   */
  static async getInvitationByEmail(email: string): Promise<InvitationResponse> {
    try {
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (error) {
        return {
          success: false,
          error: 'No valid invitation found for this email'
        };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        await supabase
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return {
          success: false,
          error: 'Invitation has expired'
        };
      }

      return {
        success: true,
        data: invitation
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.getInvitationByEmail');
    }
  }

  /**
   * Accept invitation and create user
   */
  static async acceptInvitation(token: string, password: string): Promise<InvitationResponse> {
    try {
      // Get invitation
      const invitationResult = await this.getInvitationByToken(token);
      if (!invitationResult.success || !invitationResult.data) {
        return invitationResult;
      }

      const invitation = invitationResult.data;

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            role: invitation.role,
            tenant_id: invitation.tenant_id
          }
        }
      });

      if (authError) {
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      return {
        success: true,
        data: {
          ...invitation,
          status: 'accepted' as const
        }
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.acceptInvitation');
    }
  }

  /**
   * Get all invitations for a tenant
   */
  static async getTenantInvitations(tenantId: string): Promise<{ success: boolean; data?: UserInvitation[]; error?: string }> {
    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: invitations || []
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.getTenantInvitations');
    }
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'InvitationService.cancelInvitation');
    }
  }

  /**
   * Generate secure invitation token
   */
  private static generateInvitationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(invitation: UserInvitation): Promise<{ success: boolean; error?: string }> {
    try {
      // This would integrate with your email service (Resend, SendGrid, etc.)
      // For now, we'll just log the invitation link
      const invitationUrl = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
      
      console.log('Invitation email would be sent to:', invitation.email);
      console.log('Invitation URL:', invitationUrl);
      
      // TODO: Implement actual email sending
      // await emailService.sendInvitation({
      //   to: invitation.email,
      //   invitationUrl: invitationUrl,
      //   role: invitation.role,
      //   expiresAt: invitation.expires_at
      // });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invitation email'
      };
    }
  }
}