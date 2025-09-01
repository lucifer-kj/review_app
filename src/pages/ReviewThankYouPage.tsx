import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Star, ExternalLink, CheckCircle } from "lucide-react";
import { APP_CONFIG } from "@/constants";

interface LocationState {
  name: string;
  rating: number;
  reviewId: string;
}

export default function ReviewThankYouPage() {
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

  const handleGoogleReview = () => {
    window.open(APP_CONFIG.GOOGLE_REVIEWS_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Building2 className="w-12 h-12 text-primary" />
              <CheckCircle className="w-6 h-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Thank You, {name}!
          </h1>
          <p className="text-muted-foreground mb-4">
            We're thrilled that you had a great experience with us!
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-6 h-6 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <h3 className="font-semibold text-yellow-800 mb-2">
            {rating} Star Rating Received!
          </h3>
          <p className="text-sm text-yellow-700">
            Your positive feedback means the world to us and helps other customers discover our services.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Button
            onClick={handleGoogleReview}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Leave Google Review
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Help others discover us by sharing your experience on Google Reviews
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleNewReview}
            variant="outline"
            className="w-full"
          >
            Leave Another Review
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Thank you for choosing {APP_CONFIG.NAME}!</strong><br />
            We look forward to serving you again in the future.
          </p>
        </div>
      </div>
    </div>
  );
}
