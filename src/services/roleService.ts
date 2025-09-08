import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export interface RoleCheckResult {
  hasAccess: boolean;
  userRole: string;
  tenantId?: string;
  reason?: string;
}

export class RoleService extends BaseService {
  /**
   * Check if user has required role
   */
  static async checkUserRole(
    userId: string,
    requiredRole: 'super_admin' | 'tenant_admin' | 'user'
  ): Promise<ServiceResponse<RoleCheckResult>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: {
            hasAccess: false,
            userRole: 'none',
            reason: 'User profile not found'
          },
          error: 'User profile not found',
          success: false
        };
      }

      const hasAccess = this.hasRoleAccess(profile.role, requiredRole);

      return {
        data: {
          hasAccess,
          userRole: profile.role,
          tenantId: profile.tenant_id,
          reason: hasAccess ? undefined : `Insufficient permissions. Required: ${requiredRole}, Current: ${profile.role}`
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'RoleService.checkUserRole');
    }
  }

  /**
   * Check if user can access specific tenant
   */
  static async checkTenantAccess(
    userId: string,
    tenantId: string
  ): Promise<ServiceResponse<RoleCheckResult>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: {
            hasAccess: false,
            userRole: 'none',
            reason: 'User profile not found'
          },
          error: 'User profile not found',
          success: false
        };
      }

      // Super admins can access any tenant
      if (profile.role === 'super_admin') {
        return {
          data: {
            hasAccess: true,
            userRole: profile.role,
            tenantId: profile.tenant_id
          },
          error: null,
          success: true
        };
      }

      // Other users can only access their own tenant
      const hasAccess = profile.tenant_id === tenantId;

      return {
        data: {
          hasAccess,
          userRole: profile.role,
          tenantId: profile.tenant_id,
          reason: hasAccess ? undefined : 'Access denied to tenant'
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'RoleService.checkTenantAccess');
    }
  }

  /**
   * Check if user can perform specific action
   */
  static async checkActionPermission(
    userId: string,
    action: 'create_tenant' | 'manage_users' | 'view_analytics' | 'manage_settings' | 'create_review' | 'view_reviews',
    tenantId?: string
  ): Promise<ServiceResponse<RoleCheckResult>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: {
            hasAccess: false,
            userRole: 'none',
            reason: 'User profile not found'
          },
          error: 'User profile not found',
          success: false
        };
      }

      let hasAccess = false;
      let reason = '';

      switch (action) {
        case 'create_tenant':
          hasAccess = profile.role === 'super_admin';
          reason = hasAccess ? undefined : 'Only super admins can create tenants';
          break;

        case 'manage_users':
          hasAccess = ['super_admin', 'tenant_admin'].includes(profile.role);
          reason = hasAccess ? undefined : 'Only admins can manage users';
          break;

        case 'view_analytics':
          hasAccess = ['super_admin', 'tenant_admin'].includes(profile.role);
          reason = hasAccess ? undefined : 'Only admins can view analytics';
          break;

        case 'manage_settings':
          hasAccess = ['super_admin', 'tenant_admin'].includes(profile.role);
          reason = hasAccess ? undefined : 'Only admins can manage settings';
          break;

        case 'create_review':
          hasAccess = true; // All authenticated users can create reviews
          break;

        case 'view_reviews':
          hasAccess = true; // All authenticated users can view reviews
          break;

        default:
          hasAccess = false;
          reason = 'Unknown action';
      }

      // Additional tenant check for tenant-specific actions
      if (hasAccess && tenantId && profile.role !== 'super_admin') {
        if (profile.tenant_id !== tenantId) {
          hasAccess = false;
          reason = 'Access denied to tenant';
        }
      }

      return {
        data: {
          hasAccess,
          userRole: profile.role,
          tenantId: profile.tenant_id,
          reason: hasAccess ? undefined : reason
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'RoleService.checkActionPermission');
    }
  }

  /**
   * Get user's effective permissions
   */
  static async getUserPermissions(userId: string): Promise<ServiceResponse<{
    role: string;
    tenantId?: string;
    permissions: string[];
  }>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: {
            role: 'none',
            permissions: []
          },
          error: 'User profile not found',
          success: false
        };
      }

      const permissions: string[] = [];

      switch (profile.role) {
        case 'super_admin':
          permissions.push(
            'create_tenant',
            'manage_all_users',
            'view_platform_analytics',
            'manage_system_settings',
            'manage_all_tenants',
            'view_all_data',
            'manage_invitations',
            'suspend_tenants'
          );
          break;

        case 'tenant_admin':
          permissions.push(
            'manage_tenant_users',
            'view_tenant_analytics',
            'manage_tenant_settings',
            'manage_tenant_reviews',
            'invite_users',
            'view_tenant_data'
          );
          break;

        case 'user':
          permissions.push(
            'create_review',
            'view_own_reviews',
            'view_tenant_reviews'
          );
          break;
      }

      return {
        data: {
          role: profile.role,
          tenantId: profile.tenant_id,
          permissions
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'RoleService.getUserPermissions');
    }
  }

  /**
   * Helper method to check role hierarchy
   */
  private static hasRoleAccess(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'super_admin': 3,
      'tenant_admin': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Validate role assignment
   */
  static async validateRoleAssignment(
    assignerId: string,
    targetRole: string,
    targetTenantId?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { data: assignerProfile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', assignerId)
        .single();

      if (error || !assignerProfile) {
        return {
          data: false,
          error: 'Assigner profile not found',
          success: false
        };
      }

      // Super admins can assign any role
      if (assignerProfile.role === 'super_admin') {
        return { data: true, error: null, success: true };
      }

      // Tenant admins can only assign user roles within their tenant
      if (assignerProfile.role === 'tenant_admin') {
        if (targetRole === 'user' && targetTenantId === assignerProfile.tenant_id) {
          return { data: true, error: null, success: true };
        }
        return {
          data: false,
          error: 'Tenant admins can only assign user roles within their tenant',
          success: false
        };
      }

      // Regular users cannot assign roles
      return {
        data: false,
        error: 'Users cannot assign roles',
        success: false
      };
    } catch (error) {
      return this.handleError(error, 'RoleService.validateRoleAssignment');
    }
  }
}
