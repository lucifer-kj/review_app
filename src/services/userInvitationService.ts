import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import type {
  UserInvitation,
  CreateInvitationData,
  InvitationListResponse
} from "@/types/tenant.types";

export class UserInvitationService extends BaseService {
  /**
   * Create a new user invitation
   */
  static async createInvitation(data: CreateInvitationData): Promise<ServiceResponse<UserInvitation>> {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: currentUser } = await supabase.auth.getUser();
      
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: data.tenant_id,
          email: data.email,
          role: data.role,
          invited_by: currentUser?.user?.id,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'UserInvitationService.createInvitation');
      }

      return {
        data: invitation,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.createInvitation');
    }
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string): Promise<ServiceResponse<UserInvitation>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          tenant:tenants(name, id)
        `)
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return this.handleError(error, 'UserInvitationService.getInvitationByToken');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.getInvitationByToken');
    }
  }

  /**
   * Accept invitation and create user account
   */
  static async acceptInvitation(
    token: string, 
    password: string
  ): Promise<ServiceResponse<{ user: any; invitation: UserInvitation }>> {
    try {
      // First, get the invitation
      const invitationResponse = await this.getInvitationByToken(token);
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
        password,
        options: {
          data: {
            invitation_token: token,
            role: invitation.role,
            tenant_id: invitation.tenant_id
          }
        }
      });

      if (authError) {
        return this.handleError(authError, 'UserInvitationService.acceptInvitation');
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      if (updateError) {
        return this.handleError(updateError, 'UserInvitationService.acceptInvitation');
      }

      return {
        data: { user: authData.user, invitation },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.acceptInvitation');
    }
  }

  /**
   * Get all invitations for a tenant
   */
  static async getInvitations(
    tenantId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResponse<InvitationListResponse>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('user_invitations')
        .select(`
          *,
          tenant:tenants(name),
          inviter:profiles(id)
        `, { count: 'exact' });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return this.handleError(error, 'UserInvitationService.getInvitations');
      }

      return {
        data: {
          invitations: data || [],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.getInvitations');
    }
  }

  /**
   * Get all users across platform (super admin only)
   */
  static async getAllUsers(
    page: number = 1,
    limit: number = 20,
    filters: { search?: string; role?: string; status?: string } = {}
  ): Promise<ServiceResponse<any>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('profiles')
        .select(`
          *,
          tenant:tenants(name, id)
        `, { count: 'exact' });

      // Apply role filter
      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return this.handleError(error, 'UserInvitationService.getAllUsers');
      }

      // For now, return the data as-is since we can't access auth.users directly
      // This will need to be enhanced with proper user data joining
      return {
        data: {
          users: data || [],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.getAllUsers');
    }
  }

  /**
   * Resend invitation
   */
  static async resendInvitation(invitationId: string): Promise<ServiceResponse<UserInvitation>> {
    try {
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from('user_invitations')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          used_at: null
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'UserInvitationService.resendInvitation');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.resendInvitation');
    }
  }

  /**
   * Delete invitation
   */
  static async deleteInvitation(invitationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        return this.handleError(error, 'UserInvitationService.deleteInvitation');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserInvitationService.deleteInvitation');
    }
  }
}
