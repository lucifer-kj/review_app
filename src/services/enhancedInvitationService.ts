/**
 * Enhanced Invitation Service
 * Integrates with Supabase's built-in invitation system for invite-only authentication
 */

import { supabase } from '../integrations/supabase/client';
import { supabaseAdmin, withAdminAuth } from '../integrations/supabase/admin';
import { BaseService } from './baseService';
import { ServiceResponse } from '../types/api.types';

export interface InvitationData {
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
  tenantName?: string;
  invitedBy: string;
  expiresInDays?: number;
}

export interface InvitationResult {
  success: boolean;
  invitationId?: string;
  emailSent: boolean;
  error?: string;
}

export class EnhancedInvitationService extends BaseService {
  /**
   * Send invitation using Supabase's built-in system
   */
  static async sendInvitation(data: InvitationData): Promise<ServiceResponse<InvitationResult>> {
    try {
      // Validate input
      if (!data.email || !data.role) {
        return {
          success: false,
          error: 'Email and role are required',
          data: null
        };
      }

      // Check if user already exists by looking in profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.email)
        .single();

      if (existingProfile) {
        return {
          success: false,
          error: 'User already exists with this email',
          data: null
        };
      }

      // Check if invitation already exists and is still valid
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', data.email)
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingInvitation) {
        return {
          success: false,
          error: 'Valid invitation already exists for this email',
          data: null
        };
      }

      // Create invitation record in our database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

      const { data: invitationRecord, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          email: data.email,
          role: data.role,
          tenant_id: data.tenantId,
          invited_by: data.invitedBy,
          token: crypto.randomUUID(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (invitationError) {
        return this.handleError(invitationError, 'EnhancedInvitationService.sendInvitation');
      }

      // Send invitation using Supabase's built-in system with dynamic redirect URL
      const { error: inviteError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
        data: {
          role: data.role,
          tenant_id: data.tenantId,
          tenant_name: data.tenantName,
          invitation_id: invitationRecord.id
        },
        redirectTo: `${window.location.origin}/accept-invitation?tenant_id=${data.tenantId}&invitation_id=${invitationRecord.id}`
      });

      if (inviteError) {
        // Clean up invitation record if email sending failed
        await supabase
          .from('user_invitations')
          .delete()
          .eq('id', invitationRecord.id);

        return this.handleError(inviteError, 'EnhancedInvitationService.sendInvitation');
      }
      });

      return {
        success: true,
        data: {
          success: true,
          invitationId: invitationRecord.id,
          emailSent: true
        },
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.sendInvitation');
    }
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        return {
          success: false,
          error: 'Invitation not found',
          data: null
        };
      }

      if (invitation.used_at) {
        return {
          success: false,
          error: 'Invitation has already been used',
          data: null
        };
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return {
          success: false,
          error: 'Invitation has expired',
          data: null
        };
      }

      // Resend invitation email
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(invitation.email, {
        data: {
          role: invitation.role,
          tenant_id: invitation.tenant_id,
          invitation_id: invitation.id
        },
        redirectTo: `${window.location.origin}/accept-invitation`
      });

      if (inviteError) {
        return this.handleError(inviteError, 'EnhancedInvitationService.resendInvitation');
      }

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.resendInvitation');
    }
  }

  /**
   * Cancel/revoke invitation
   */
  static async cancelInvitation(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ 
          expires_at: new Date().toISOString(), // Set to past date to expire
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('used_at', null); // Only cancel unused invitations

      if (error) {
        return this.handleError(error, 'EnhancedInvitationService.cancelInvitation');
      }

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.cancelInvitation');
    }
  }

  /**
   * Get invitation by email (for validation)
   */
  static async getInvitationByEmail(email: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          tenants (
            id,
            name,
            domain
          )
        `)
        .eq('email', email)
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return {
          success: false,
          error: 'No valid invitation found',
          data: null
        };
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.getInvitationByEmail');
    }
  }

  /**
   * Validate invitation token
   */
  static async validateInvitationToken(token: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          tenants (
            id,
            name,
            domain
          )
        `)
        .eq('token', token)
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return {
          success: false,
          error: 'Invalid or expired invitation',
          data: null
        };
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.validateInvitationToken');
    }
  }

  /**
   * Mark invitation as used
   */
  static async markInvitationAsUsed(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ 
          used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        return this.handleError(error, 'EnhancedInvitationService.markInvitationAsUsed');
      }

      return {
        success: true,
        data: true,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.markInvitationAsUsed');
    }
  }

  /**
   * Get all invitations for a tenant
   */
  static async getTenantInvitations(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResponse<any>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          tenants (
            id,
            name
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return this.handleError(error, 'EnhancedInvitationService.getTenantInvitations');
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('user_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (countError) {
        return this.handleError(countError, 'EnhancedInvitationService.getTenantInvitations');
      }

      return {
        success: true,
        data: {
          invitations: data,
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        },
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.getTenantInvitations');
    }
  }

  /**
   * Get invitation statistics
   */
  static async getInvitationStats(tenantId?: string): Promise<ServiceResponse<any>> {
    try {
      let query = supabase
        .from('user_invitations')
        .select('*');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'EnhancedInvitationService.getInvitationStats');
      }

      const stats = {
        total: data.length,
        pending: data.filter(inv => !inv.used_at && new Date(inv.expires_at) > new Date()).length,
        used: data.filter(inv => inv.used_at).length,
        expired: data.filter(inv => !inv.used_at && new Date(inv.expires_at) <= new Date()).length
      };

      return {
        success: true,
        data: stats,
        error: null
      };

    } catch (error) {
      return this.handleError(error, 'EnhancedInvitationService.getInvitationStats');
    }
  }
}
