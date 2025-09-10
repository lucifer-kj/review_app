import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";

export interface TenantReviewFormSettings {
  id: string;
  tenant_id: string;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  google_business_url?: string;
  review_form_url?: string;
  email_template?: {
    subject: string;
    body: string;
    footer?: string;
  };
  form_customization?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    welcome_message?: string;
    thank_you_message?: string;
    required_fields?: string[];
    optional_fields?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface ReviewFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  rating: number;
  review_text?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
}

export class TenantReviewFormService extends BaseService {
  /**
   * Get tenant-specific review form settings
   */
  static async getTenantFormSettings(tenantId: string): Promise<ServiceResponse<TenantReviewFormSettings>> {
    try {
      if (!this.validateId(tenantId)) {
        return {
          data: null,
          error: 'Invalid tenant ID',
          success: false,
        };
      }

      // First try to get from business_settings table
      const { data: businessSettings, error: businessError } = await supabase
        .from('business_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        logger.warn('Error fetching business settings:', businessError);
      }

      // Get tenant information
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('name, settings')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        return this.handleError(tenantError, 'TenantReviewFormService.getTenantFormSettings');
      }

      // Merge business settings with tenant data
      const formSettings: TenantReviewFormSettings = {
        id: businessSettings?.id || `tenant-${tenantId}`,
        tenant_id: tenantId,
        business_name: businessSettings?.business_name || tenant.name || 'Business',
        business_email: businessSettings?.business_email,
        business_phone: businessSettings?.business_phone,
        business_address: businessSettings?.business_address,
        google_business_url: businessSettings?.google_business_url,
        review_form_url: businessSettings?.review_form_url,
        email_template: {
          subject: `Share your experience with ${businessSettings?.business_name || tenant.name}`,
          body: `Hi {{customer_name}},\n\nWe hope you enjoyed your experience with us! We'd love to hear your feedback.\n\nPlease take a moment to share your review: {{review_link}}\n\nThank you for choosing us!\n\nBest regards,\n${businessSettings?.business_name || tenant.name}`,
          footer: `This email was sent by ${businessSettings?.business_name || tenant.name}. If you have any questions, please contact us at ${businessSettings?.business_email || 'support@example.com'}.`
        },
        form_customization: {
          primary_color: '#3b82f6',
          secondary_color: '#1e40af',
          logo_url: undefined,
          welcome_message: `We'd love to hear about your experience with ${businessSettings?.business_name || tenant.name}`,
          thank_you_message: `Thank you for your feedback! Your review helps us improve our services.`,
          required_fields: ['customer_name', 'rating'],
          optional_fields: ['customer_email', 'customer_phone', 'review_text']
        },
        created_at: businessSettings?.created_at || new Date().toISOString(),
        updated_at: businessSettings?.updated_at || new Date().toISOString()
      };

      // Override with tenant-specific settings if available
      if (tenant.settings?.review_form) {
        formSettings.form_customization = {
          ...formSettings.form_customization,
          ...tenant.settings.review_form
        };
      }

      if (tenant.settings?.email_template) {
        formSettings.email_template = {
          ...formSettings.email_template,
          ...tenant.settings.email_template
        };
      }

      return {
        data: formSettings,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantReviewFormService.getTenantFormSettings');
    }
  }

  /**
   * Submit a review for a specific tenant
   */
  static async submitTenantReview(tenantId: string, reviewData: ReviewFormData): Promise<ServiceResponse<any>> {
    try {
      if (!this.validateId(tenantId)) {
        return {
          data: null,
          error: 'Invalid tenant ID',
          success: false,
        };
      }

      // Validate required fields
      if (!reviewData.customer_name?.trim()) {
        return {
          data: null,
          error: 'Customer name is required',
          success: false,
        };
      }

      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        return {
          data: null,
          error: 'Valid rating (1-5) is required',
          success: false,
        };
      }

      // Submit review to database
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          tenant_id: tenantId,
          customer_name: reviewData.customer_name.trim(),
          customer_email: reviewData.customer_email?.trim() || null,
          customer_phone: reviewData.customer_phone?.trim() || null,
          rating: reviewData.rating,
          review_text: reviewData.review_text?.trim() || null,
          utm_source: reviewData.utm_source || null,
          utm_campaign: reviewData.utm_campaign || null,
          utm_medium: reviewData.utm_medium || null,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantReviewFormService.submitTenantReview');
      }

      // Fetch business settings to get Google Business URL
      const { data: businessSettings } = await supabase
        .from('business_settings')
        .select('google_business_url')
        .eq('tenant_id', tenantId)
        .single();

      return {
        data: {
          ...review,
          google_business_url: businessSettings?.google_business_url,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantReviewFormService.submitTenantReview');
    }
  }

  /**
   * Get review form URL for a tenant
   */
  static getTenantReviewFormUrl(tenantId: string, baseUrl?: string): string {
    const base = baseUrl || window.location.origin;
    return `${base}/review/${tenantId}`;
  }

  /**
   * Generate email template with tenant-specific variables
   */
  static generateEmailTemplate(
    template: string,
    variables: {
      customer_name: string;
      business_name: string;
      review_link: string;
      business_email?: string;
      business_phone?: string;
    }
  ): string {
    let processedTemplate = template;

    // Replace common variables
    processedTemplate = processedTemplate.replace(/\{\{customer_name\}\}/g, variables.customer_name);
    processedTemplate = processedTemplate.replace(/\{\{business_name\}\}/g, variables.business_name);
    processedTemplate = processedTemplate.replace(/\{\{review_link\}\}/g, variables.review_link);
    processedTemplate = processedTemplate.replace(/\{\{business_email\}\}/g, variables.business_email || '');
    processedTemplate = processedTemplate.replace(/\{\{business_phone\}\}/g, variables.business_phone || '');

    return processedTemplate;
  }

  /**
   * Validate review form data
   */
  static validateReviewFormData(data: ReviewFormData, settings: TenantReviewFormSettings): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (settings.form_customization?.required_fields?.includes('customer_name') && !data.customer_name?.trim()) {
      errors.push('Customer name is required');
    }

    if (settings.form_customization?.required_fields?.includes('rating') && (!data.rating || data.rating < 1 || data.rating > 5)) {
      errors.push('Valid rating is required');
    }

    if (settings.form_customization?.required_fields?.includes('customer_email') && !data.customer_email?.trim()) {
      errors.push('Customer email is required');
    }

    if (settings.form_customization?.required_fields?.includes('customer_phone') && !data.customer_phone?.trim()) {
      errors.push('Customer phone is required');
    }

    if (settings.form_customization?.required_fields?.includes('review_text') && !data.review_text?.trim()) {
      errors.push('Review text is required');
    }

    // Validate email format if provided
    if (data.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
      errors.push('Invalid email format');
    }

    // Validate phone format if provided
    if (data.customer_phone && !/^[\d\s\-\+\(\)]+$/.test(data.customer_phone)) {
      errors.push('Invalid phone format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
