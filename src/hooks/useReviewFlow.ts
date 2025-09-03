import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabasePublic, isSupabaseConfigured } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ReviewFormData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
}

interface UseReviewFlowReturn {
  isSubmitting: boolean;
  handleReviewSubmit: (data: ReviewFormData) => Promise<void>;
  sanitizedUtmParams: {
    trackingId: string | null;
    utmSource: string | null;
    customerName: string | null;
  };
}

export const useReviewFlow = (): UseReviewFlowReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const analytics = useAnalytics();

  // Sanitize and extract UTM parameters
  const sanitizeInput = (input: string | null): string | null => {
    if (!input) return null;
    return input
      .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  };

  const sanitizedUtmParams = {
    trackingId: sanitizeInput(searchParams.get('tracking_id')),
    utmSource: sanitizeInput(searchParams.get('utm_source')),
    customerName: sanitizeInput(searchParams.get('customer')),
  };

  // One-tap: prefill rating and signature from URL if present
  const prefilled = {
    rating: Number(sanitizeInput(searchParams.get('rating')) || 0),
    sig: sanitizeInput(searchParams.get('sig')),
    ts: sanitizeInput(searchParams.get('ts'))
  };

  const handleReviewSubmit = async (data: ReviewFormData): Promise<void> => {
    setIsSubmitting(true);

    try {
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        toast({
          title: "Configuration Error",
          description: "Review system is not properly configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      analytics.track('review_submit_attempt', {
        rating: data.rating,
        source: sanitizedUtmParams.utmSource || 'direct',
      });

      // Prefer calling hardened edge function for submission
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
      }
      
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/submit-review`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone.trim(),
          countryCode: data.countryCode,
          rating: prefilled.rating || data.rating,
          trackingId: sanitizedUtmParams.trackingId,
          managerName: undefined,
          sig: prefilled.sig || undefined,
          ts: prefilled.ts || undefined,
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${response.status}`);
      }

      const result = await response.json();
      const insertedData = { id: result.reviewId } as { id: string };

      analytics.track('review_submit_success', { rating: prefilled.rating || data.rating });

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Handle conditional redirect based on rating
      const finalRating = prefilled.rating || data.rating;
      if (finalRating >= 4) {
        // Redirect directly to Google Reviews for ratings 4 and above
        analytics.track('review_redirect_google', { rating: finalRating });
        window.location.href = APP_CONFIG.GOOGLE_REVIEWS_URL;
      } else {
        // Navigate to feedback page for ratings below 4
        analytics.track('review_feedback_redirect', { rating: finalRating });
        navigate('/review/feedback', { 
          state: { 
            name: data.name, 
            rating: finalRating,
            reviewId: insertedData.id 
          } 
        });
      }
    } catch (error: unknown) {
      console.error('Error saving review:', error);
      
      // Enhanced error handling for different device scenarios
      let errorMessage = "Failed to submit review. Please try again.";
      
      const errorMessageStr = error instanceof Error ? error.message : String(error);
      
      if (errorMessageStr.includes('column "phone" does not exist')) {
        errorMessage = "Review system is being updated. Please try again in a few minutes.";
      } else if (errorMessageStr.includes('row-level security policy') || errorMessageStr.includes('RLS')) {
        errorMessage = "Review system is not properly configured. Please contact support.";
      } else if (errorMessageStr.includes('network') || errorMessageStr.includes('fetch') || errorMessageStr.includes('CORS')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessageStr.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      } else if (errorMessageStr.includes('rate limit') || errorMessageStr.includes('too many requests')) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (errorMessageStr.includes('unauthorized') || errorMessageStr.includes('forbidden') || errorMessageStr.includes('401')) {
        errorMessage = "Review system is not properly configured. Please contact support.";
      } else if (errorMessageStr.includes('database') || errorMessageStr.includes('connection')) {
        errorMessage = "Database connection issue. Please try again in a moment.";
      } else if (errorMessageStr.includes('Supabase configuration is missing')) {
        errorMessage = "Review system is not properly configured. Please contact support.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleReviewSubmit,
    sanitizedUtmParams,
  };
};
