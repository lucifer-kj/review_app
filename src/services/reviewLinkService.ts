/**
 * Review Link Service
 * Manages review links for public review collection
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './baseService';

export interface ReviewLink {
  id: string;
  tenant_id: string;
  link_code: string;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  google_business_url?: string;
  form_customization?: Record<string, any>;
  email_template?: Record<string, any>;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateReviewLinkData {
  tenant_id: string;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  google_business_url?: string;
  form_customization?: Record<string, any>;
  email_template?: Record<string, any>;
  expires_at?: string;
}

export interface ReviewLinkWithUrl extends ReviewLink {
  review_url: string;
}

export class ReviewLinkService extends BaseService {
  /**
   * Get review link by code (public access)
   */
  static async getReviewLinkByCode(linkCode: string): Promise<ServiceResponse<ReviewLink>> {
    try {
      const { data, error } = await supabase
        .rpc('get_review_link_by_code', { p_link_code: linkCode })
        .single();

      if (error) {
        return this.handleError(error, 'ReviewLinkService.getReviewLinkByCode');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.getReviewLinkByCode');
    }
  }

  /**
   * Create a new review link
   */
  static async createReviewLink(data: CreateReviewLinkData): Promise<ServiceResponse<ReviewLinkWithUrl>> {
    try {
      const { data: result, error } = await supabase
        .rpc('create_review_link', {
          p_tenant_id: data.tenant_id,
          p_business_name: data.business_name,
          p_business_email: data.business_email || null,
          p_business_phone: data.business_phone || null,
          p_business_address: data.business_address || null,
          p_google_business_url: data.google_business_url || null,
          p_form_customization: data.form_customization || {},
          p_email_template: data.email_template || {},
          p_expires_at: data.expires_at || null,
        })
        .single();

      if (error) {
        return this.handleError(error, 'ReviewLinkService.createReviewLink');
      }

      return {
        data: result,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.createReviewLink');
    }
  }

  /**
   * Get all review links for a tenant
   */
  static async getTenantReviewLinks(tenantId: string): Promise<ServiceResponse<ReviewLinkWithUrl[]>> {
    try {
      const { data, error } = await supabase
        .rpc('get_tenant_review_links', { p_tenant_id: tenantId });

      if (error) {
        return this.handleError(error, 'ReviewLinkService.getTenantReviewLinks');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.getTenantReviewLinks');
    }
  }

  /**
   * Update a review link
   */
  static async updateReviewLink(
    linkId: string, 
    updateData: Partial<CreateReviewLinkData>
  ): Promise<ServiceResponse<ReviewLink>> {
    try {
      const { data, error } = await supabase
        .from('review_links')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewLinkService.updateReviewLink');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.updateReviewLink');
    }
  }

  /**
   * Deactivate a review link
   */
  static async deactivateReviewLink(linkId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('review_links')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId);

      if (error) {
        return this.handleError(error, 'ReviewLinkService.deactivateReviewLink');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.deactivateReviewLink');
    }
  }

  /**
   * Delete a review link
   */
  static async deleteReviewLink(linkId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('review_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        return this.handleError(error, 'ReviewLinkService.deleteReviewLink');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLinkService.deleteReviewLink');
    }
  }

  /**
   * Generate a full review URL
   */
  static generateReviewUrl(linkCode: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/review/${linkCode}`;
  }

  /**
   * Extract link code from review URL
   */
  static extractLinkCodeFromUrl(url: string): string | null {
    const match = url.match(/\/review\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}
