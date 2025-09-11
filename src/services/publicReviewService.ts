import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface TenantInfo {
  id: string;
  name: string;
  business_name: string;
  google_review_url: string;
  slug: string;
  review_url: string;
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  status: string;
}

export interface PublicReviewSubmission {
  slug: string;
  reviewer_name?: string;
  reviewer_email?: string;
  reviewer_phone?: string;
  rating: number;
  feedback_text?: string;
  metadata?: {
    source?: string;
    user_agent?: string;
    ip_address?: string;
    referrer?: string;
  };
}

export interface PublicReviewResponse {
  success: boolean;
  review_id?: string;
  redirect_url?: string;
  error?: string;
}

export class PublicReviewService {
  /**
   * Get tenant information by slug
   */
  static async getTenantBySlug(slug: string): Promise<TenantInfo | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_tenant_by_slug', { slug_param: slug });

      if (error) {
        console.error('Error fetching tenant by slug:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as TenantInfo;
    } catch (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }
  }

  /**
   * Submit a public review
   */
  static async submitPublicReview(
    submission: PublicReviewSubmission
  ): Promise<PublicReviewResponse> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-public-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(submission)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting public review:', error);
      return {
        success: false,
        error: 'Failed to submit review'
      };
    }
  }

  /**
   * Generate review URL for a tenant
   */
  static async generateReviewUrl(
    tenantId: string,
    businessName: string,
    googleReviewUrl: string,
    branding?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    }
  ): Promise<{ success: boolean; slug?: string; review_url?: string; error?: string }> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-review-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          business_name: businessName,
          google_review_url: googleReviewUrl,
          branding
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating review URL:', error);
      return {
        success: false,
        error: 'Failed to generate review URL'
      };
    }
  }

  /**
   * Check if a tenant has required settings for review URL generation
   */
  static async checkTenantReviewSettings(tenantId: string): Promise<{
    hasRequiredSettings: boolean;
    business_name?: string;
    google_review_url?: string;
    slug?: string;
    review_url?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('business_name, google_review_url, slug, review_url')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('Error checking tenant settings:', error);
        return { hasRequiredSettings: false };
      }

      const hasRequiredSettings = !!(data.business_name && data.google_review_url);
      
      return {
        hasRequiredSettings,
        business_name: data.business_name,
        google_review_url: data.google_review_url,
        slug: data.slug,
        review_url: data.review_url
      };
    } catch (error) {
      console.error('Error checking tenant settings:', error);
      return { hasRequiredSettings: false };
    }
  }

  /**
   * Update tenant business settings
   */
  static async updateTenantBusinessSettings(
    tenantId: string,
    businessName: string,
    googleReviewUrl: string,
    branding?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_name: businessName.trim(),
          google_review_url: googleReviewUrl.trim(),
          branding: branding || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        console.error('Error updating tenant settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }
}
