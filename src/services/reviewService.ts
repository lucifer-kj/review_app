import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService extends BaseService {
  /**
   * Get reviews using the new dashboard function that includes both user and anonymous reviews
   */
  static async getReviews(): Promise<ServiceResponse<Review[]>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the new dashboard function that handles both authenticated and anonymous reviews
      const { data, error } = await supabase
        .rpc('get_all_reviews_for_dashboard');

      if (error) {
        // Fallback to the old method if the function doesn't exist
        console.warn('Dashboard function not found, falling back to basic query:', error.message);
        
        let query = supabase.from('reviews').select('*');
        
        if (user) {
          // For authenticated users, get their reviews plus anonymous ones
          query = query.or(`user_id.eq.${user.id},user_id.is.null`);
        } else {
          // For unauthenticated users, get all reviews (should not happen in dashboard)
          query = query.select('*');
        }
        
        const fallbackResult = await query.order('created_at', { ascending: false });
        
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
      return this.handleError(error, 'ReviewService.getReviews');
    }
  }

  /**
   * Get review statistics using the new dashboard function
   */
  static async getReviewStats(): Promise<ServiceResponse<{
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  }>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the new dashboard stats function
      const { data, error } = await supabase
        .rpc('get_review_stats_for_dashboard');

      if (error) {
        // Fallback to manual calculation if the function doesn't exist
        console.warn('Dashboard stats function not found, falling back to manual calculation:', error.message);
        
        const reviewsResponse = await this.getReviews();
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

  static async getReviewById(id: string): Promise<ServiceResponse<Review>> {
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
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${user.id},user_id.is.null`)
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
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
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
