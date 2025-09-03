import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabasePublic } from "@/integrations/supabase/client";
import { Building2, MessageCircle, Send, ArrowLeft } from "lucide-react";

interface LocationState {
  name: string;
  rating: number;
  reviewId: string;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const state = location.state as LocationState;
  const { name, rating, reviewId } = state || {};

  // Redirect if no state data
  useEffect(() => {
    if (!state || !name || !reviewId) {
      navigate('/review');
    }
  }, [state, name, reviewId, navigate]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please share your feedback with us",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the review with feedback using public client
      const { error } = await supabasePublic
        .from('reviews')
        .update({ 
          feedback: feedback.trim(),
          metadata: { 
            feedback_submitted: true,
            feedback_submitted_at: new Date().toISOString()
          }
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully.",
      });

      // Navigate to thank you page
      navigate('/review/feedback-thank-you', { 
        state: { name, rating, reviewId } 
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/review');
  };

  if (!state || !name || !reviewId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md w-full mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            We're Sorry, {name}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            We didn't meet your expectations this time.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your feedback is valuable to us. Please let us know how we can improve our services.
            </p>
          </div>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4 sm:space-y-6">
          <div className="form-field">
            <label className="form-label">
              How can we improve? *
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please share your feedback and suggestions for improvement..."
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Thank you for taking the time to help us improve
          </p>
        </div>
      </div>
    </div>
  );
}
