import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
import { AuditLogService } from "./auditLogService";
import { InvitationErrorHandler } from "./invitationErrorHandler";
import { SupabaseAdminService } from "./supabaseAdminService";

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  tenant_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export interface UserInvitation {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  invited_by: string;
  invited_by_name?: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface CreateUserInvitationData {
  tenant_id?: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
}

export class UserManagementService {
  /**
   * Get all users across all tenants (super admin only)
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          role,
          tenant_id,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Get unique tenant IDs
      const tenantIds = [...new Set(profiles.map(p => p.tenant_id).filter(Boolean))];
      
      // Fetch tenant names separately
      let tenantNames: Record<string, string> = {};
      if (tenantIds.length > 0) {
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name')
          .in('id', tenantIds);

        if (!tenantsError && tenants) {
          tenantNames = tenants.reduce((acc, tenant) => {
            acc[tenant.id] = tenant.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return profiles.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_id ? tenantNames[user.tenant_id] : 'No Tenant',
        created_at: user.created_at,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get users for a specific tenant
   */
  static async getTenantUsers(tenantId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        tenant_id,
        created_at,
        tenants!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_name: user.tenants?.name,
      created_at: user.created_at,
    })) || [];
  }

  /**
   * Get all pending invitations
   */
  static async getPendingInvitations(): Promise<UserInvitation[]> {
    try {
      // First, get all pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select(`
          id,
          tenant_id,
          email,
          role,
          invited_by,
          token,
          expires_at,
          used_at,
          created_at
        `)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      if (!invitations || invitations.length === 0) {
        return [];
      }

      // Get unique tenant IDs and invited_by IDs
      const tenantIds = [...new Set(invitations.map(i => i.tenant_id).filter(Boolean))];
      const invitedByIds = [...new Set(invitations.map(i => i.invited_by).filter(Boolean))];
      
      // Fetch tenant names separately
      let tenantNames: Record<string, string> = {};
      if (tenantIds.length > 0) {
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name')
          .in('id', tenantIds);

        if (!tenantsError && tenants) {
          tenantNames = tenants.reduce((acc, tenant) => {
            acc[tenant.id] = tenant.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Fetch invited_by names separately
      let invitedByNames: Record<string, string> = {};
      if (invitedByIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', invitedByIds);

        if (!profilesError && profiles) {
          invitedByNames = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return invitations.map(invitation => ({
        id: invitation.id,
        tenant_id: invitation.tenant_id,
        tenant_name: invitation.tenant_id ? tenantNames[invitation.tenant_id] : 'No Tenant',
        email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invited_by_name: invitation.invited_by ? invitedByNames[invitation.invited_by] : 'System',
        token: invitation.token,
        expires_at: invitation.expires_at,
        used_at: invitation.used_at,
        created_at: invitation.created_at,
      }));
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }

  /**
   * Create a new user invitation and send email
   */
  static async createInvitation(data: CreateUserInvitationData): Promise<UserInvitation> {
    try {
      // Check if user already exists by looking in profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.email)
        .single();

      if (existingProfile) {
        throw new Error('User already exists with this email address');
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
        throw new Error('Valid invitation already exists for this email');
      }

      // Get tenant name for the invitation
      let tenantName = 'Unknown Tenant';
      if (data.tenant_id) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', data.tenant_id)
          .single();

        if (!tenantError && tenant) {
          tenantName = tenant.name;
        }
      }

      // Get current user for invited_by field
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Create invitation record in database using admin client to bypass RLS
      const { data: result, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('user_invitations')
          .insert({
            tenant_id: data.tenant_id,
            email: data.email,
            role: data.role,
            invited_by: currentUser?.user?.id || null,
            token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .select(`
            id,
            tenant_id,
            email,
            role,
            invited_by,
            token,
            expires_at,
            created_at
          `)
          .single();
      });

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      // Send invitation email using Supabase Auth Admin
      try {
        const { error: inviteError } = await SupabaseAdminService.inviteUserByEmail({
          email: data.email,
          data: {
            tenant_name: tenantName,
            tenant_id: data.tenant_id,
            invitation_id: result.id,
            role: data.role,
          },
          redirectTo: `${window.location.origin}/accept-invitation?token=${result.token}&tenant_id=${data.tenant_id}`,
        });

        if (inviteError) {
          console.error('Failed to send invitation email:', inviteError);
          // Don't throw here - the invitation record was created successfully
          // The email can be resent later
        } else {
          console.log('Invitation email sent successfully to:', data.email);
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw here - the invitation record was created successfully
      }

      // Log the invitation
      try {
        await AuditLogService.logEvent(
          AuditLogService.ACTIONS.USER_INVITED,
          {
            invited_email: data.email,
            role: data.role,
            tenant_name: tenantName,
          },
          {
            resource_type: 'user',
            resource_id: result.id,
            tenant_id: data.tenant_id,
          }
        );
      } catch (auditError) {
        console.warn('Failed to log invitation audit event:', auditError);
      }

      return {
        id: result.id,
        tenant_id: result.tenant_id,
        tenant_name: tenantName,
        email: result.email,
        role: result.role,
        invited_by: result.invited_by,
        token: result.token,
        expires_at: result.expires_at,
        created_at: result.created_at,
      };
    } catch (error) {
      InvitationErrorHandler.logError(error, 'UserManagementService.createInvitation');
      const invitationError = InvitationErrorHandler.handleInvitationError(error);
      throw new Error(invitationError.userMessage);
    }
  }

  /**
   * Cancel a pending invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: 'super_admin' | 'tenant_admin' | 'user'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Suspend a user (soft delete)
   */
  static async suspendUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'suspended' })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Send invitation email
   */
  static async sendInvitationEmail(invitation: UserInvitation): Promise<void> {
    // This would integrate with the email service
    // For now, we'll just log it
    console.log('Sending invitation email to:', invitation.email);
    
    // TODO: Integrate with UnifiedEmailService
    // const emailService = new UnifiedEmailService();
    // await emailService.sendInvitationEmail(invitation);
  }
}
