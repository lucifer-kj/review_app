import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";
import { handleError } from "@/utils/errorHandler";

// Simple error class for this service
class ServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService extends BaseService {
  /**
   * Get reviews for current tenant using the dashboard function
   */
  static async getReviews(tenantId?: string): Promise<ServiceResponse<Review[]>> {
    try {
      // If tenantId is provided, use it; otherwise get from current user context
      let targetTenantId = tenantId;
      
      if (!targetTenantId) {
        // Get current tenant from user context
        const { data: tenantResponse, error: tenantError } = await supabase.rpc('get_current_tenant_id');
        
        if (tenantError) {
          throw handleError(tenantError, 'ReviewService.getReviews');
        }
        
        targetTenantId = tenantResponse;
      }
      
      if (!targetTenantId) {
        throw new ServiceError(
          'No tenant context available. Please ensure you are properly assigned to a tenant.',
          'TENANT_CONTEXT_MISSING'
        );
      }

      // Use the dashboard function with tenant context
      const { data, error } = await supabase
        .rpc('get_all_reviews_for_dashboard', { p_tenant_id: targetTenantId });

      if (error) {
        // Fallback to direct query with tenant filtering
        logger.warn('Dashboard function not found, falling back to basic query', { error: error.message });
        
        const fallbackResult = await supabase
          .from('reviews')
          .select('*')
          .eq('tenant_id', targetTenantId)
          .order('created_at', { ascending: false });
        
        if (fallbackResult.error) {
          return this.handleError(fallbackResult.error, 'ReviewService.getReviews');
        }
        
        return {
          data: fallbackResult.data || [],
          error: null,
          success: true,
        };
      }

      return {
        data: data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        return {
          data: [],
          error: error.message,
          success: false,
        };
      }
      
      const serviceError = handleError(error, 'ReviewService.getReviews');
      return {
        data: [],
        error: serviceError.message,
        success: false,
      };
    }
  }

  /**
   * Get review statistics for current tenant using the dashboard function
   */
  static async getReviewStats(tenantId?: string): Promise<ServiceResponse<{
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  }>> {
    try {
      // If tenantId is provided, use it; otherwise get from current user context
      let targetTenantId = tenantId;
      
      if (!targetTenantId) {
        // Get current tenant from user context
        const { data: tenantResponse } = await supabase.rpc('get_current_tenant_id');
        targetTenantId = tenantResponse;
      }
      
      if (!targetTenantId) {
        return {
          data: { totalReviews: 0, averageRating: 0, highRatingReviews: 0 },
          error: 'No tenant context available. Please ensure you are properly assigned to a tenant. Contact support if this issue persists.',
          success: false,
        };
      }

      // Use the dashboard stats function with tenant context
      const { data, error } = await supabase
        .rpc('get_review_stats_for_dashboard', { p_tenant_id: targetTenantId });

      if (error) {
        // Fallback to manual calculation if the function doesn't exist
        logger.warn('Dashboard stats function not found, falling back to manual calculation', { error: error.message });
        
        const reviewsResponse = await this.getReviews(targetTenantId);
        if (!reviewsResponse.success || !reviewsResponse.data) {
          return {
            data: { totalReviews: 0, averageRating: 0, highRatingReviews: 0 },
            error: reviewsResponse.error,
            success: false,
          };
        }

        const reviews = reviewsResponse.data;
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
          : 0;
        const highRatingReviews = reviews.filter(review => review.rating >= 4).length;

        return {
          data: { totalReviews, averageRating, highRatingReviews },
          error: null,
          success: true,
        };
      }

      // Transform the data to match our expected format
      const stats = data?.[0] || { total_reviews: 0, average_rating: 0, high_rating_reviews: 0 };
      
      return {
        data: {
          totalReviews: stats.total_reviews || 0,
          averageRating: Number(stats.average_rating) || 0,
          highRatingReviews: stats.high_rating_reviews || 0,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.getReviewStats');
    }
  }

  static async getReviewById(id: string, tenantId?: string): Promise<ServiceResponse<Review>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: 'User not authenticated',
          success: false,
        };
      }

      // Get tenant context
      let targetTenantId = tenantId;
      if (!targetTenantId) {
        const { data: tenantResponse } = await supabase.rpc('get_current_tenant_id');
        targetTenantId = tenantResponse;
      }

      if (!targetTenantId) {
        return {
          data: null,
          error: 'No tenant context available. Please ensure you are properly assigned to a tenant. Contact support if this issue persists.',
          success: false,
        };
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', targetTenantId)
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.getReviewById');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.getReviewById');
    }
  }

  static async createReview(reviewData: CreateReviewData): Promise<ServiceResponse<Review>> {
    try {
      // Ensure tenant_id is included in the review data
      let finalReviewData = { ...reviewData };

      // If tenant_id is not provided, try to get it from current context
      if (!finalReviewData.tenant_id) {
        const { data: tenantId } = await supabase.rpc('get_current_tenant_id');
        if (tenantId) {
          finalReviewData.tenant_id = tenantId;
        } else {
          return {
            data: null,
            error: 'No tenant context available. Please ensure you are properly assigned to a tenant. Contact support if this issue persists.',
            success: false,
          };
        }
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([finalReviewData])
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.createReview');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.createReview');
    }
  }

  static async updateReview(id: string, updates: UpdateReviewData): Promise<ServiceResponse<Review>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: 'User not authenticated',
          success: false,
        };
      }

      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.updateReview');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.updateReview');
    }
  }

  static async deleteReview(id: string): Promise<ServiceResponse<boolean>> {
    if (!this.validateId(id)) {
      return {
        data: false,
        error: 'Invalid review ID',
        success: false,
      };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: false,
          error: 'User not authenticated',
          success: false,
        };
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return this.handleError(error, 'ReviewService.deleteReview');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.deleteReview');
    }
  }

  /**
   * Submit a new review (for public forms)
   */
  static async submitReview(reviewData: {
    tenant_id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    country_code?: string;
    rating: number;
    review_text?: string;
    google_review?: boolean;
    redirect_opened?: boolean;
    metadata?: any;
  }): Promise<ServiceResponse<Review>> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          tenant_id: reviewData.tenant_id,
          customer_name: reviewData.customer_name,
          customer_email: reviewData.customer_email,
          customer_phone: reviewData.customer_phone,
          country_code: reviewData.country_code || '+1',
          rating: reviewData.rating,
          review_text: reviewData.review_text,
          google_review: reviewData.google_review || false,
          redirect_opened: reviewData.redirect_opened || false,
          metadata: reviewData.metadata || {},
        }])
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.submitReview');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.submitReview');
    }
  }

  /**
   * Update review feedback (for public forms)
   */
  static async updateReviewFeedback(id: string, feedback: string): Promise<ServiceResponse<Review>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ 
          feedback: feedback.trim(),
          metadata: { 
            feedback_submitted: true,
            feedback_submitted_at: new Date().toISOString()
          }
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.updateReviewFeedback');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.updateReviewFeedback');
    }
  }
}
