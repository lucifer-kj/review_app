import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabasePublic } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ErrorHandler } from "@/utils/errorHandler";

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
      analytics.track('review_submit_attempt', {
        rating: data.rating,
        source: sanitizedUtmParams.utmSource || 'direct',
      });

      // Get tenant's Google Review URL if tenantId is provided
      let googleReviewUrl = APP_CONFIG.GOOGLE_REVIEWS_URL; // Fallback to default
      
      if (data.tenantId) {
        try {
          const { data: businessSettings } = await supabasePublic
            .from('business_settings')
            .select('google_business_url')
            .eq('tenant_id', data.tenantId)
            .single();
          
          if (businessSettings?.google_business_url) {
            googleReviewUrl = businessSettings.google_business_url;
          }
        } catch (error) {
          console.warn('Could not fetch tenant Google Review URL, using default:', error);
        }
      }

      // Simple direct database insert - no Edge Function needed!
      const finalRating = prefilled.rating || data.rating;
      
      const { data: insertedData, error } = await supabasePublic
        .from('reviews')
        .insert({
          customer_name: data.name.trim(),
          customer_phone: data.phone.trim(),
          country_code: data.countryCode || '+1',
          rating: finalRating,
          google_review: finalRating >= 4,
          redirect_opened: false,
          tenant_id: data.tenantId, // Include tenant_id for proper isolation
          metadata: {
            trackingId: sanitizedUtmParams.trackingId,
            managerName: undefined,
            source: 'email_form',
            submitted_at: new Date().toISOString(),
            google_review_url: googleReviewUrl
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
        // Redirect to tenant-specific Google Review URL for ratings 4 and above
        analytics.track('review_redirect_google', { rating: finalRating });
        window.location.href = googleReviewUrl;
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
      ErrorHandler.handleServiceError(error, 'ReviewFormPage');
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
