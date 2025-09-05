import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, Heart } from "lucide-react";

interface FeedbackThankYouProps {
  name: string;
  onNewReview: () => void;
}

export const FeedbackThankYou = ({ name, onNewReview }: FeedbackThankYouProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Building2 className="w-10 h-10 text-primary" />
              <CheckCircle className="w-6 h-6 text-green-500 absolute -top-1 -right-1 bg-background rounded-full" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Thank You, {name}!
          </h1>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">
              Your feedback has been received and is very important to us.
            </p>
            <p className="text-sm text-muted-foreground">
              We will use your suggestions to improve our services and ensure a better experience for all our clients.
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Feedback recorded</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Our team has been notified</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>We'll work on improvements</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={onNewReview}
          variant="outline"
          className="w-full"
        >
          Submit Another Review
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for helping us serve you better
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Crux
          </p>
        </div>
      </div>
    </div>
  );
};