import { supabase } from '@/integrations/supabase/client';
import { BaseService, type ServiceResponse } from './baseService';

export interface ReviewLimits {
  plan_type: 'basic' | 'pro' | 'industry';
  max_reviews: number;
  current_reviews: number;
  remaining_reviews: number;
  is_limit_reached: boolean;
  can_share: boolean;
  can_send: boolean;
  can_collect: boolean;
}

export interface GoogleBusinessSettings {
  google_business_url: string;
  is_configured: boolean;
  review_url: string;
}

/**
 * Review Limit Service
 * Handles plan-based review limits and restrictions
 */
export class ReviewLimitService extends BaseService {
  /**
   * Get review limits for a tenant based on their plan
   */
  static async getTenantReviewLimits(tenantId: string): Promise<ServiceResponse<ReviewLimits>> {
    try {
      // Get tenant plan type
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('plan_type')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        return this.handleError(tenantError, 'ReviewLimitService.getTenantReviewLimits');
      }

      // Get current review count for tenant
      const { count: currentReviews, error: countError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (countError) {
        return this.handleError(countError, 'ReviewLimitService.getTenantReviewLimits');
      }

      const planLimits = this.getPlanLimits(tenant.plan_type);
      const currentCount = currentReviews || 0;
      const remaining = Math.max(0, planLimits.max_reviews - currentCount);
      const isLimitReached = currentCount >= planLimits.max_reviews;

      const limits: ReviewLimits = {
        plan_type: tenant.plan_type,
        max_reviews: planLimits.max_reviews,
        current_reviews: currentCount,
        remaining_reviews: remaining,
        is_limit_reached: isLimitReached,
        can_share: this.canShare(tenant.plan_type, currentCount),
        can_send: this.canSend(tenant.plan_type, currentCount),
        can_collect: this.canCollect(tenant.plan_type, currentCount),
      };

      return {
        data: limits,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLimitService.getTenantReviewLimits');
    }
  }

  /**
   * Get Google Business settings for a tenant
   */
  static async getGoogleBusinessSettings(tenantId: string): Promise<ServiceResponse<GoogleBusinessSettings>> {
    try {
      const { data: settings, error } = await supabase
        .from('business_settings')
        .select('google_business_url')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        return this.handleError(error, 'ReviewLimitService.getGoogleBusinessSettings');
      }

      const googleBusinessUrl = settings?.google_business_url || '';
      const isConfigured = !!googleBusinessUrl;
      const reviewUrl = isConfigured ? this.generateGoogleReviewUrl(googleBusinessUrl) : '';

      const googleSettings: GoogleBusinessSettings = {
        google_business_url: googleBusinessUrl,
        is_configured: isConfigured,
        review_url: reviewUrl,
      };

      return {
        data: googleSettings,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLimitService.getGoogleBusinessSettings');
    }
  }

  /**
   * Check if tenant can perform a specific action
   */
  static async canPerformAction(
    tenantId: string, 
    action: 'share' | 'send' | 'collect'
  ): Promise<ServiceResponse<boolean>> {
    try {
      const limitsResponse = await this.getTenantReviewLimits(tenantId);
      if (!limitsResponse.success) {
        return limitsResponse;
      }

      const limits = limitsResponse.data;
      let canPerform = false;

      switch (action) {
        case 'share':
          canPerform = limits.can_share;
          break;
        case 'send':
          canPerform = limits.can_send;
          break;
        case 'collect':
          canPerform = limits.can_collect;
          break;
      }

      return {
        data: canPerform,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLimitService.canPerformAction');
    }
  }

  /**
   * Get plan limits configuration
   */
  private static getPlanLimits(planType: string) {
    switch (planType) {
      case 'basic':
        return { max_reviews: 100 };
      case 'pro':
        return { max_reviews: 500 };
      case 'industry':
        return { max_reviews: 1000 };
      default:
        return { max_reviews: 100 }; // Default to basic
    }
  }

  /**
   * Check if tenant can share reviews based on plan and usage
   */
  private static canShare(planType: string, currentReviews: number): boolean {
    switch (planType) {
      case 'basic':
        return currentReviews < 100;
      case 'pro':
        return currentReviews < 500;
      case 'industry':
        return currentReviews < 1000;
      default:
        return currentReviews < 100;
    }
  }

  /**
   * Check if tenant can send review requests based on plan and usage
   */
  private static canSend(planType: string, currentReviews: number): boolean {
    switch (planType) {
      case 'basic':
        return currentReviews < 100;
      case 'pro':
        return currentReviews < 500;
      case 'industry':
        return currentReviews < 1000;
      default:
        return currentReviews < 100;
    }
  }

  /**
   * Check if tenant can collect new reviews based on plan and usage
   */
  private static canCollect(planType: string, currentReviews: number): boolean {
    switch (planType) {
      case 'basic':
        return currentReviews < 100;
      case 'pro':
        return currentReviews < 500;
      case 'industry':
        return currentReviews < 1000;
      default:
        return currentReviews < 100;
    }
  }

  /**
   * Generate Google Review URL from Google Business Profile URL
   */
  private static generateGoogleReviewUrl(googleBusinessUrl: string): string {
    try {
      // Extract place ID from Google Business URL
      // Format: https://www.google.com/maps/place/Business-Name/@lat,lng,zoom/data=...
      const url = new URL(googleBusinessUrl);
      const pathParts = url.pathname.split('/');
      const placeIndex = pathParts.findIndex(part => part === 'place');
      
      if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
        const businessName = pathParts[placeIndex + 1];
        // Generate review URL
        return `https://www.google.com/maps/place/${businessName}/reviews`;
      }
      
      // Fallback: return original URL
      return googleBusinessUrl;
    } catch (error) {
      console.error('Error generating Google review URL:', error);
      return googleBusinessUrl;
    }
  }

  /**
   * Get upgrade recommendations based on current usage
   */
  static async getUpgradeRecommendation(tenantId: string): Promise<ServiceResponse<{
    current_plan: string;
    recommended_plan: string;
    usage_percentage: number;
    upgrade_benefits: string[];
  }>> {
    try {
      const limitsResponse = await this.getTenantReviewLimits(tenantId);
      if (!limitsResponse.success) {
        return limitsResponse;
      }

      const limits = limitsResponse.data;
      const usagePercentage = (limits.current_reviews / limits.max_reviews) * 100;
      
      let recommendedPlan = limits.plan_type;
      let upgradeBenefits: string[] = [];

      if (limits.plan_type === 'basic' && usagePercentage >= 80) {
        recommendedPlan = 'pro';
        upgradeBenefits = [
          '500 reviews per month (5x more)',
          'Advanced analytics',
          'Custom branding',
          'Priority support'
        ];
      } else if (limits.plan_type === 'pro' && usagePercentage >= 80) {
        recommendedPlan = 'industry';
        upgradeBenefits = [
          '1000 reviews per month (2x more)',
          'API access',
          'White-label options',
          'Dedicated account manager'
        ];
      }

      return {
        data: {
          current_plan: limits.plan_type,
          recommended_plan: recommendedPlan,
          usage_percentage: Math.round(usagePercentage),
          upgrade_benefits: upgradeBenefits,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewLimitService.getUpgradeRecommendation');
    }
  }
}
