import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabasePublic } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ReviewFormData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
  tenantId?: string;
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

  // One-tap: prefill rating from URL if present
  const prefilled = {
    rating: Number(sanitizeInput(searchParams.get('rating')) || 0),
  };

  const handleReviewSubmit = async (data: ReviewFormData): Promise<void> => {
    setIsSubmitting(true);

    try {
      // Environment variables are available since you have a .env file

      analytics.track('review_submit_attempt', {
        rating: data.rating,
        source: sanitizedUtmParams.utmSource || 'direct',
      });

      // Simple direct database insert - no Edge Function needed!
      const finalRating = prefilled.rating || data.rating;
      
      const { data: insertedData, error } = await supabasePublic
        .from('reviews')
        .insert({
          name: data.name.trim(),
          phone: data.phone.trim(),
          country_code: data.countryCode || '+1',
          rating: finalRating,
          google_review: finalRating >= 4,
          redirect_opened: false,
          tenant_id: data.tenantId, // Include tenant_id for proper isolation
          metadata: {
            trackingId: sanitizedUtmParams.trackingId,
            managerName: undefined,
            source: 'email_form',
            submitted_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      analytics.track('review_submit_success', { rating: finalRating });

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Handle conditional redirect based on rating
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
      
      // Simplified error handling
      let errorMessage = "Failed to submit review. Please try again.";
      
      const errorMessageStr = error instanceof Error ? error.message : String(error);
      
      if (errorMessageStr.includes('column "phone" does not exist')) {
        errorMessage = "Review system is being updated. Please try again in a few minutes.";
      } else if (errorMessageStr.includes('row-level security policy') || errorMessageStr.includes('RLS')) {
        errorMessage = "Review system is not properly configured. Please contact support.";
      } else if (errorMessageStr.includes('network') || errorMessageStr.includes('fetch')) {
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
