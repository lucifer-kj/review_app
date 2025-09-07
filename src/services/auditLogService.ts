import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilters {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  static async logEvent(
    action: string,
    details: Record<string, any> = {},
    options: {
      resource_type?: string;
      resource_id?: string;
      tenant_id?: string;
      user_id?: string;
      ip_address?: string;
      user_agent?: string;
    } = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        details,
        resource_type: options.resource_type,
        resource_id: options.resource_id,
        tenant_id: options.tenant_id,
        user_id: options.user_id,
        ip_address: options.ip_address,
        user_agent: options.user_agent,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getAuditLogs(filters: AuditLogFilters = {}): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        profiles!audit_logs_user_id_fkey(email),
        tenants!audit_logs_tenant_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Get total count
    const { count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const logs: AuditLog[] = data?.map(log => ({
      id: log.id,
      tenant_id: log.tenant_id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    })) || [];

    return {
      logs,
      total: count || 0,
    };
  }

  /**
   * Get audit logs for a specific tenant
   */
  static async getTenantAuditLogs(
    tenantId: string,
    filters: Omit<AuditLogFilters, 'tenant_id'> = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.getAuditLogs({ ...filters, tenant_id: tenantId });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(
    userId: string,
    filters: Omit<AuditLogFilters, 'user_id'> = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.getAuditLogs({ ...filters, user_id: userId });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(tenantId?: string): Promise<{
    total_events: number;
    events_by_action: Record<string, number>;
    events_by_day: Array<{ date: string; count: number }>;
  }> {
    let query = supabase
      .from('audit_logs')
      .select('action, created_at');

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total_events = data?.length || 0;
    const events_by_action: Record<string, number> = {};
    const events_by_day: Record<string, number> = {};

    data?.forEach(log => {
      // Count by action
      events_by_action[log.action] = (events_by_action[log.action] || 0) + 1;

      // Count by day
      const date = new Date(log.created_at).toISOString().split('T')[0];
      events_by_day[date] = (events_by_day[date] || 0) + 1;
    });

    const events_by_day_array = Object.entries(events_by_day)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_events,
      events_by_action,
      events_by_day: events_by_day_array,
    };
  }

  /**
   * Common audit actions
   */
  static readonly ACTIONS = {
    // Authentication
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_REGISTER: 'user_register',
    PASSWORD_RESET: 'password_reset',
    
    // Tenant Management
    TENANT_CREATED: 'tenant_created',
    TENANT_UPDATED: 'tenant_updated',
    TENANT_DELETED: 'tenant_deleted',
    TENANT_SUSPENDED: 'tenant_suspended',
    
    // User Management
    USER_INVITED: 'user_invited',
    USER_INVITATION_ACCEPTED: 'user_invitation_accepted',
    USER_INVITATION_CANCELLED: 'user_invitation_cancelled',
    USER_ROLE_CHANGED: 'user_role_changed',
    USER_SUSPENDED: 'user_suspended',
    
    // Review Management
    REVIEW_CREATED: 'review_created',
    REVIEW_UPDATED: 'review_updated',
    REVIEW_DELETED: 'review_deleted',
    
    // Settings
    SETTINGS_UPDATED: 'settings_updated',
    
    // System
    SYSTEM_ERROR: 'system_error',
    MIGRATION_COMPLETED: 'migration_completed',
  } as const;
}
