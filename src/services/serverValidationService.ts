import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ServerValidationService extends BaseService {
  /**
   * Validate user authentication and role
   */
  static async validateUserAccess(
    userId: string,
    requiredRole?: 'super_admin' | 'tenant_admin' | 'user'
  ): Promise<ServiceResponse<{ hasAccess: boolean; userRole: string; tenantId?: string }>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: { hasAccess: false, userRole: 'none' },
          error: 'User profile not found',
          success: false
        };
      }

      const hasAccess = !requiredRole || 
        (requiredRole === 'super_admin' && profile.role === 'super_admin') ||
        (requiredRole === 'tenant_admin' && ['super_admin', 'tenant_admin'].includes(profile.role)) ||
        (requiredRole === 'user' && ['super_admin', 'tenant_admin', 'user'].includes(profile.role));

      return {
        data: {
          hasAccess,
          userRole: profile.role,
          tenantId: profile.tenant_id
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'ServerValidationService.validateUserAccess');
    }
  }

  /**
   * Validate tenant access for user
   */
  static async validateTenantAccess(
    userId: string,
    tenantId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          data: false,
          error: 'User profile not found',
          success: false
        };
      }

      // Super admins can access any tenant
      if (profile.role === 'super_admin') {
        return { data: true, error: null, success: true };
      }

      // Other users can only access their own tenant
      const hasAccess = profile.tenant_id === tenantId;

      return {
        data: hasAccess,
        error: hasAccess ? null : 'Access denied to tenant',
        success: true
      };
    } catch (error) {
      return this.handleError(error, 'ServerValidationService.validateTenantAccess');
    }
  }

  /**
   * Validate review submission data
   */
  static async validateReviewData(data: {
    name: string;
    phone: string;
    rating: number;
    tenantId?: string;
  }): Promise<ServiceResponse<ValidationResult>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (data.name && data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
    if (data.name && !/^[a-zA-Z\s]+$/.test(data.name)) {
      errors.push('Name can only contain letters and spaces');
    }

    // Validate phone
    const cleanPhone = data.phone.replace(/[^\d]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      errors.push('Phone number must be at least 7 digits');
    }
    if (cleanPhone.length > 15) {
      errors.push('Phone number must be less than 15 digits');
    }

    // Validate rating
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    // Validate tenant access if provided
    if (data.tenantId) {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, status')
        .eq('id', data.tenantId)
        .single();

      if (error || !tenant) {
        errors.push('Invalid tenant');
      } else if (tenant.status !== 'active') {
        errors.push('Tenant is not active');
      }
    }

    return {
      data: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      error: null,
      success: true
    };
  }

  /**
   * Validate invitation data
   */
  static async validateInvitationData(data: {
    email: string;
    role: string;
    tenantId: string;
    invitedBy: string;
  }): Promise<ServiceResponse<ValidationResult>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate email
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email address is required');
    }

    // Validate role
    if (!['super_admin', 'tenant_admin', 'user'].includes(data.role)) {
      errors.push('Invalid role specified');
    }

    // Validate tenant exists and is active
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', data.tenantId)
      .single();

    if (tenantError || !tenant) {
      errors.push('Invalid tenant');
    } else if (tenant.status !== 'active') {
      errors.push('Tenant is not active');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      errors.push('User with this email already exists');
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', data.email)
      .eq('used_at', null)
      .single();

    if (existingInvitation) {
      warnings.push('Active invitation already exists for this email');
    }

    return {
      data: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      error: null,
      success: true
    };
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/expression\(/gi, '') // Remove CSS expressions
      .replace(/url\(/gi, '') // Remove CSS url()
      .replace(/import\s+/gi, '') // Remove import statements
      .replace(/eval\(/gi, '') // Remove eval calls
      .replace(/document\./gi, '') // Remove document access
      .replace(/window\./gi, '') // Remove window access
      .replace(/alert\(/gi, '') // Remove alert calls
      .replace(/confirm\(/gi, '') // Remove confirm calls
      .replace(/prompt\(/gi, ''); // Remove prompt calls
  }

  /**
   * Validate and sanitize form data
   */
  static validateAndSanitizeFormData<T extends Record<string, any>>(
    data: T,
    schema: Record<keyof T, { required?: boolean; type: string; maxLength?: number; pattern?: RegExp }>
  ): { data: T; errors: string[] } {
    const errors: string[] = [];
    const sanitizedData = { ...data };

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key as keyof T];

      // Check required fields
      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${key} is required`);
        continue;
      }

      // Skip validation if value is empty and not required
      if (!value || (typeof value === 'string' && !value.trim())) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitizedData[key as keyof T] = this.sanitizeInput(value) as T[keyof T];
      }

      // Check type
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${key} must be a number`);
      } else if (rules.type === 'email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${key} must be a valid email address`);
      }

      // Check max length
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${key} must be less than ${rules.maxLength} characters`);
      }

      // Check pattern
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`);
      }
    }

    return { data: sanitizedData, errors };
  }
}
