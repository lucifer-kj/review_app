import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService extends BaseService {
  /**
   * Check if user_id column exists in reviews table
   */
  private static async checkUserIdColumnExists(): Promise<boolean> {
    try {
      // Try a simple query with user_id to see if it exists
      const { error } = await supabase
        .from('reviews')
        .select('user_id')
        .limit(1);
      
      return !error || !error.message.includes('column "user_id" does not exist');
    } catch (error) {
      return false;
    }
  }

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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('reviews').select('*');
      
      if (hasUserIdColumn) {
        // Use user_id filter if column exists
        query = query.eq('user_id', user.id);
      } else {
        // Fallback: get all reviews (temporary until migration is run)
        console.warn('user_id column not found in reviews table. Using fallback query.');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic query');
          const fallbackResult = await supabase
            .from('reviews')
            .select('*')
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('reviews').select('*').eq('id', id);
      
      if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.single();

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic query');
          const fallbackResult = await supabase
            .from('reviews')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'ReviewService.getReviewById');
          }
          
          return {
            data: fallbackResult.data,
            error: null,
            success: true,
          };
        }
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      const insertData = hasUserIdColumn 
        ? { ...reviewData, user_id: user.id }
        : reviewData;

      const { data, error } = await supabase
        .from('reviews')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic insert');
          const fallbackResult = await supabase
            .from('reviews')
            .insert(reviewData)
            .select()
            .single();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'ReviewService.createReview');
          }
          
          return {
            data: fallbackResult.data,
            error: null,
            success: true,
          };
        }
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase
        .from('reviews')
        .update(updates)
        .eq('id', id);
      
      if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.select().single();

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic update');
          const fallbackResult = await supabase
            .from('reviews')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'ReviewService.updateReview');
          }
          
          return {
            data: fallbackResult.data,
            error: null,
            success: true,
          };
        }
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('reviews').delete().eq('id', id);
      
      if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }
      
      const { error } = await query;

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic delete');
          const fallbackResult = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'ReviewService.deleteReview');
          }
          
          return {
            data: undefined,
            error: null,
            success: true,
          };
        }
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('reviews').select('rating');
      
      if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic stats query');
          const fallbackResult = await supabase
            .from('reviews')
            .select('rating');
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'ReviewService.getReviewStats');
          }
          
          const reviews = fallbackResult.data || [];
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
        }
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
