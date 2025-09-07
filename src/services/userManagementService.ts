import { supabase } from "@/integrations/supabase/client";
import { AuditLogService } from "./auditLogService";

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
    const { data, error } = await supabase
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
        created_at,
        tenants!inner(name),
        profiles!user_invitations_invited_by_fkey(email)
      `)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(invitation => ({
      id: invitation.id,
      tenant_id: invitation.tenant_id,
      tenant_name: invitation.tenants?.name,
      email: invitation.email,
      role: invitation.role,
      invited_by: invitation.invited_by,
      invited_by_name: invitation.profiles?.email,
      token: invitation.token,
      expires_at: invitation.expires_at,
      used_at: invitation.used_at,
      created_at: invitation.created_at,
    })) || [];
  }

  /**
   * Create a new user invitation
   */
  static async createInvitation(data: CreateUserInvitationData): Promise<UserInvitation> {
    const { data: result, error } = await supabase
      .from('user_invitations')
      .insert({
        tenant_id: data.tenant_id,
        email: data.email,
        role: data.role,
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
        created_at,
        tenants!inner(name)
      `)
      .single();

    if (error) throw error;

    // Log the invitation
    await AuditLogService.logEvent(
      AuditLogService.ACTIONS.USER_INVITED,
      {
        invited_email: data.email,
        role: data.role,
      },
      {
        resource_type: 'user',
        resource_id: result.id,
        tenant_id: data.tenant_id,
      }
    );

    return {
      id: result.id,
      tenant_id: result.tenant_id,
      tenant_name: result.tenants?.name,
      email: result.email,
      role: result.role,
      invited_by: result.invited_by,
      token: result.token,
      expires_at: result.expires_at,
      created_at: result.created_at,
    };
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
