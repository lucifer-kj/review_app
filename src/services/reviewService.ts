import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { handleError } from "@/utils/errorHandler";

type Review = Tables<'reviews'>;
type CreateReviewData = Omit<Review, 'id' | 'created_at'>;
type UpdateReviewData = Partial<Review>;

export class ReviewService {
  static async getReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.getReviews'));
    }
  }

  static async getReviewById(id: string): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.getReviewById'));
    }
  }

  static async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.createReview'));
    }
  }

  static async updateReview(id: string, updates: UpdateReviewData): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.updateReview'));
    }
  }

  static async deleteReview(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.deleteReview'));
    }
  }

  static async getReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating');

      if (error) throw error;

      const reviews = data || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;
      const highRatingReviews = reviews.filter(r => r.rating >= 4).length;

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        highRatingReviews
      };
    } catch (error) {
      throw new Error(handleError(error, 'ReviewService.getReviewStats'));
    }
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
      const { error } = await supabase.functions.invoke('send-review-email', {
        body: {
          customerEmail,
          customerName,
          trackingId: options?.trackingId,
          managerName: options?.managerName,
          businessName: options?.businessName
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error sending review email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send review email' 
      };
    }
  }
}
