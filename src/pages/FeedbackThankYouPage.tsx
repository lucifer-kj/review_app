import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, MessageCircle } from "lucide-react";

interface LocationState {
  name: string;
  rating: number;
  reviewId: string;
}

export default function FeedbackThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const { name, rating } = state || {};

  const handleNewReview = () => {
    navigate('/review-form');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md w-full mx-auto text-center">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Thank You, {name}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Your feedback has been received and is greatly appreciated.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Feedback Received</h3>
          <p className="text-xs sm:text-sm text-green-700">
            We take all feedback seriously and will use your input to improve our services. 
            Our team will review your comments and work on making things better.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Button
            onClick={handleNewReview}
            className="w-full"
          >
            Leave Another Review
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>

        <div className="mt-6 sm:mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>What happens next?</strong><br />
            Our team will review your feedback and may reach out if we need clarification. 
            We're committed to continuous improvement based on customer input.
          </p>
        </div>
      </div>
    </div>
  );
}
