import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService extends BaseService {
  static async getReviews(): Promise<ServiceResponse<Review[]>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: [],
          error: 'User not authenticated',
          success: false,
        };
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error, 'ReviewService.getReviews');
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
        .eq('user_id', user.id) // Ensure user can only access their own reviews
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.getReviewById');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.getReviewById');
    }
  }

  static async createReview(reviewData: CreateReviewData): Promise<ServiceResponse<Review>> {
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
        .insert({
          ...reviewData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.createReview');
      }

      return {
        data,
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
        .eq('user_id', user.id) // Ensure user can only update their own reviews
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'ReviewService.updateReview');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.updateReview');
    }
  }

  static async deleteReview(id: string): Promise<ServiceResponse<void>> {
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

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own reviews

      if (error) {
        return this.handleError(error, 'ReviewService.deleteReview');
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.deleteReview');
    }
  }

  static async getReviewStats(): Promise<ServiceResponse<{
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  }>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: { totalReviews: 0, averageRating: 0, highRatingReviews: 0 },
          error: 'User not authenticated',
          success: false,
        };
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('user_id', user.id);

      if (error) {
        return this.handleError(error, 'ReviewService.getReviewStats');
      }

      const reviews = data || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      const highRatingReviews = reviews.filter(review => review.rating >= 4).length;

      return {
        data: {
          totalReviews,
          averageRating,
          highRatingReviews,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'ReviewService.getReviewStats');
    }
  }
}
