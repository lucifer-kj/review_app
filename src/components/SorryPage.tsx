import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MessageCircle, Send } from "lucide-react";

interface SorryPageProps {
  name: string;
  reviewId?: string;
  onFeedbackSubmitted: () => void;
}

export const SorryPage = ({ name, reviewId, onFeedbackSubmitted }: SorryPageProps) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      // Update the review with feedback
      if (reviewId) {
        const { error } = await supabase
          .from('reviews')
          .update({ 
            feedback: feedback.trim(),
            metadata: { feedback_submitted: true }
          })
          .eq('id', reviewId);

        if (error) throw error;
      }

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully.",
      });

      onFeedbackSubmitted();
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            We're Sorry, {name}
          </h1>
          <p className="text-muted-foreground mb-4">
            We didn't meet your expectations this time.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Your feedback is valuable to us. Please let us know how we can improve our services.
            </p>
          </div>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-6">
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

          <Button
            type="submit"
            disabled={isSubmitting || !feedback.trim()}
            className="w-full"
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
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Thank you for taking the time to help us improve
          </p>
        </div>
      </div>
    </div>
  );
};