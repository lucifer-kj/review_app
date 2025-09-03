import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabasePublic, isSupabaseConfigured } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";

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

      // Save review to database with tracking information using public client
      const { data: insertedData, error } = await supabasePublic
        .from('reviews')
        .insert({
          name: data.name.trim(),
          phone: data.phone.trim(),
          country_code: data.countryCode,
          rating: data.rating,
          google_review: data.rating >= 4,
          redirect_opened: false,
          metadata: {
            trackingId: sanitizedUtmParams.trackingId,
            utmSource: sanitizedUtmParams.utmSource || 'direct',
            source: 'email_form',
            submitted_at: new Date().toISOString(),
            form_version: 'email_triggered',
            utm_campaign: searchParams.get('utm_campaign'),
            utm_medium: searchParams.get('utm_medium'),
            utm_term: searchParams.get('utm_term'),
            utm_content: searchParams.get('utm_content'),
          }
        })
        .select()
        .single();

      if (error) {
        // Handle specific database schema errors
        if (error.message.includes('column "phone" does not exist')) {
          console.error('Database schema error: phone column missing');
          toast({
            title: "System Error",
            description: "Review system is being updated. Please try again in a few minutes.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle authentication errors
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.error('Authentication error:', error);
          toast({
            title: "Configuration Error",
            description: "Review system is not properly configured. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Handle conditional redirect based on rating
      if (data.rating >= 4) {
        // Redirect directly to Google Reviews for ratings 4 and above
        window.location.href = APP_CONFIG.GOOGLE_REVIEWS_URL;
      } else {
        // Navigate to feedback page for ratings below 4
        navigate('/review/feedback', { 
          state: { 
            name: data.name, 
            rating: data.rating,
            reviewId: insertedData.id 
          } 
        });
      }
    } catch (error: any) {
      console.error('Error saving review:', error);
      
      // Enhanced error handling for different device scenarios
      let errorMessage = "Failed to submit review. Please try again.";
      
      if (error.message?.includes('column "phone" does not exist')) {
        errorMessage = "Review system is being updated. Please try again in a few minutes.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message?.includes('unauthorized') || error.message?.includes('forbidden') || error.message?.includes('401')) {
        errorMessage = "Review system is not properly configured. Please contact support.";
      } else if (error.message?.includes('database') || error.message?.includes('connection')) {
        errorMessage = "Database connection issue. Please try again in a moment.";
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
