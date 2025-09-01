import { CheckCircle, Building2 } from "lucide-react";

interface ThankYouProps {
  name: string;
  onNewReview: () => void;
}

export const ThankYou = ({ name, onNewReview }: ThankYouProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="thank-you-container fade-in">
        <div className="flex justify-center mb-6">
          <div className="relative scale-in">
            <CheckCircle className="w-20 h-20 text-success" />
            <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse"></div>
          </div>
        </div>

        <div className="slide-up">
          <h1 className="thank-you-title">
            Thank you, {name}!
          </h1>
          
          <p className="thank-you-message">
            We appreciate your feedback. Our team will use it to improve and deliver even better service to you and all our valued clients.
          </p>

          <div className="flex items-center justify-center gap-2 text-muted-foreground mt-8">
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Alpha Business Designs</span>
          </div>

          <button
            onClick={onNewReview}
            className="mt-8 px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Submit another review
          </button>
        </div>
      </div>
    </div>
  );
};