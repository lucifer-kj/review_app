import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
import { BaseService, type ServiceResponse } from "./baseService";

export interface CreateUserWithMagicLinkData {
  email: string;
  fullName: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
}

export class MagicLinkService extends BaseService {
  /**
   * Create a new user and send them a magic link
   * This replaces the old invitation system
   */
  static async createUserWithMagicLink(
    userData: CreateUserWithMagicLinkData
  ): Promise<ServiceResponse<{ email: string; magicLinkSent: boolean }>> {
    try {
      // Send magic link using Supabase Auth (this will create the user)
      const { error: magicLinkError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(userData.email, {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            tenant_id: userData.tenantId,
          },
          redirectTo: `${window.location.origin}/dashboard`,
        });
      });

      if (magicLinkError) {
        return this.handleError(magicLinkError, 'MagicLinkService.createUserWithMagicLink');
      }

      return {
        data: {
          email: userData.email,
          magicLinkSent: true,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'MagicLinkService.createUserWithMagicLink');
    }
  }

  /**
   * Send magic link to existing user
   */
  static async sendMagicLinkToUser(
    email: string,
    redirectTo: string = '/dashboard'
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${window.location.origin}${redirectTo}`,
        });
      });

      if (error) {
        return this.handleError(error, 'MagicLinkService.sendMagicLinkToUser');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'MagicLinkService.sendMagicLinkToUser');
    }
  }

  /**
   * Create a tenant with admin user using magic link
   */
  static async createTenantWithMagicLink(
    tenantName: string,
    adminEmail: string,
    adminName: string
  ): Promise<ServiceResponse<{ tenantId: string; adminEmail: string }>> {
    try {
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          status: 'active',
        })
        .select()
        .single();

      if (tenantError) {
        return this.handleError(tenantError, 'MagicLinkService.createTenantWithMagicLink');
      }

      // Create admin user with magic link
      const userResult = await this.createUserWithMagicLink({
        email: adminEmail,
        fullName: adminName,
        role: 'tenant_admin',
        tenantId: tenant.id,
      });

      if (!userResult.success) {
        // Clean up tenant if user creation fails
        await supabase
          .from('tenants')
          .delete()
          .eq('id', tenant.id);

        return userResult;
      }

      return {
        data: {
          tenantId: tenant.id,
          adminEmail: adminEmail,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'MagicLinkService.createTenantWithMagicLink');
    }
  }
}