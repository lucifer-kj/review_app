import { useState, useEffect, useCallback } from "react";
import { ReviewService } from "@/services/reviewService";
import type { Tables } from "@/integrations/supabase/types";

type Review = Tables<'reviews'>;

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ReviewService.getReviews();
      
      if (response.success && response.data) {
        setReviews(response.data);
      } else {
        setError(response.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReview = useCallback(async (reviewData: Omit<Review, 'id' | 'created_at'>) => {
    try {
      const response = await ReviewService.createReview(reviewData);
      
      if (response.success && response.data) {
        // Refresh reviews list
        await fetchReviews();
        return response.data;
      } else {
        setError(response.error || 'Failed to create review');
        throw new Error(response.error || 'Failed to create review');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReviews]);

  const updateReview = useCallback(async (id: string, updates: Partial<Review>) => {
    try {
      const response = await ReviewService.updateReview(id, updates);
      
      if (response.success && response.data) {
        // Refresh reviews list
        await fetchReviews();
        return response.data;
      } else {
        setError(response.error || 'Failed to update review');
        throw new Error(response.error || 'Failed to update review');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReviews]);

  const deleteReview = useCallback(async (id: string) => {
    try {
      const response = await ReviewService.deleteReview(id);
      
      if (response.success) {
        // Refresh reviews list
        await fetchReviews();
      } else {
        setError(response.error || 'Failed to delete review');
        throw new Error(response.error || 'Failed to delete review');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete review';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { 
    reviews, 
    loading, 
    error, 
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview
  };
};
