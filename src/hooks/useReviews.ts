import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReviews(data || []);
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
      const { data, error: createError } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (createError) throw createError;
      
      // Refresh reviews list
      await fetchReviews();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      throw err;
    }
  }, [fetchReviews]);

  const updateReview = useCallback(async (id: string, updates: Partial<Review>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Refresh reviews list
      await fetchReviews();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review';
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
    updateReview 
  };
};
