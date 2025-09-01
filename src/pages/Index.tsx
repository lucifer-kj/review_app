import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ReviewForm } from "@/components/ReviewForm";
import { ThankYou } from "@/components/ThankYou";
import { SorryPage } from "@/components/SorryPage";
import { FeedbackThankYou } from "@/components/FeedbackThankYou";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";

interface ReviewData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<'form' | 'thankyou' | 'sorry' | 'feedback-thanks'>('form');
  const [submittedData, setSubmittedData] = useState<ReviewData | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Import constants
  const { GOOGLE_REVIEWS_URL } = APP_CONFIG;

  // Extract URL parameters for email-triggered reviews
  const trackingId = searchParams.get('tracking_id');
  const customerName = searchParams.get('customer');
  const utmSource = searchParams.get('utm_source');

  const handleReviewSubmit = async (data: ReviewData) => {
    try {
      // Save review to database with tracking information
      const { data: insertedData, error } = await supabase
        .from('reviews')
        .insert({
          name: data.name,
          phone: data.phone,
          country_code: data.countryCode,
          rating: data.rating,
          google_review: data.rating >= 4,
          redirect_opened: false,
          metadata: {
            trackingId: trackingId || null,
            utmSource: utmSource || 'direct',
            source: utmSource === 'email' ? 'email_form' : 'direct_form',
            submitted_at: new Date().toISOString(),
            form_version: utmSource === 'email' ? 'email_triggered' : 'direct'
          }
        })
        .select()
        .single();

      if (error) throw error;

      setReviewId(insertedData.id);
      setSubmittedData(data);

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      if (data.rating >= 4) {
        // Redirect directly to Google Reviews for ratings 4 and above
        window.location.href = GOOGLE_REVIEWS_URL;
      } else {
        // Show sorry page for ratings below 4
        setCurrentView('sorry');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
      return;
    }
  };

  const handleNewReview = () => {
    setCurrentView('form');
    setSubmittedData(null);
    setReviewId(null);
  };

  const handleFeedbackSubmitted = () => {
    setCurrentView('feedback-thanks');
  };

  if (currentView === 'thankyou' && submittedData) {
    return (
      <ThankYou 
        name={submittedData.name} 
        onNewReview={handleNewReview}
      />
    );
  }

  if (currentView === 'sorry' && submittedData) {
    return (
      <SorryPage 
        name={submittedData.name}
        reviewId={reviewId}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    );
  }

  if (currentView === 'feedback-thanks' && submittedData) {
    return (
      <FeedbackThankYou 
        name={submittedData.name}
        onNewReview={handleNewReview}
      />
    );
  }

  return <ReviewForm onSubmit={handleReviewSubmit} />;
};

export default Index;