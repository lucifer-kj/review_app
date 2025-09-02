import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService extends BaseService {
  static async getReviews(): Promise<ServiceResponse<Review[]>> {
    const query = this.buildQuery('reviews', {
      sort: { column: 'created_at', ascending: false }
    });
    
    return this.executeQuery<Review[]>(query, 'ReviewService.getReviews');
  }

  static async getReviewById(id: string): Promise<ServiceResponse<Review>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    const query = this.buildQuery('reviews', {
      filters: { id }
    }).single();
    
    return this.executeQuery<Review>(query, 'ReviewService.getReviewById');
  }

  static async createReview(reviewData: CreateReviewData): Promise<ServiceResponse<Review>> {
    const mutation = supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();
    
    return this.executeMutation<Review>(mutation, 'ReviewService.createReview');
  }

  static async updateReview(id: string, updates: UpdateReviewData): Promise<ServiceResponse<Review>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    const mutation = supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return this.executeMutation<Review>(mutation, 'ReviewService.updateReview');
  }

  static async deleteReview(id: string): Promise<ServiceResponse<void>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid review ID',
        success: false,
      };
    }

    const mutation = supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    return this.executeMutation<void>(mutation, 'ReviewService.deleteReview');
  }

  static async getReviewStats(): Promise<ServiceResponse<{
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  }>> {
    const query = this.buildQuery('reviews', {
      select: 'rating'
    });
    
    const response = await this.executeQuery<{ rating: number }[]>(query, 'ReviewService.getReviewStats');
    
    if (!response.success || !response.data) {
      return response as any;
    }

    const reviews = response.data;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;
    const highRatingReviews = reviews.filter(r => r.rating >= 4).length;

    return {
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        highRatingReviews
      },
      error: null,
      success: true,
    };
  }

  static async sendReviewEmail(
    customerEmail: string, 
    customerName: string, 
    options?: {
      trackingId?: string;
      managerName?: string;
      businessName?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-review-email', {
        body: {
          customerEmail,
          customerName,
          trackingId: options?.trackingId,
          managerName: options?.managerName,
          businessName: options?.businessName
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to invoke email function' 
        };
      }

      // Check if the function returned a successful response
      if (data && typeof data === 'object') {
        if (data.success === false) {
          return { 
            success: false, 
            error: data.error || 'Email service returned an error' 
          };
        }
        
        if (data.success === true) {
          return { 
            success: true, 
            data: data.data || data 
          };
        }
      }

      // Fallback for unexpected response format
      return { 
        success: false, 
        error: 'Unexpected response format from email service' 
      };
    } catch (error) {
      console.error('Error sending review email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send review email' 
      };
    }
  }
}
