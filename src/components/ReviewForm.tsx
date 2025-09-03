import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { PhoneInput } from "./PhoneInput";

interface ReviewFormProps {
  onSubmit: (data: { name: string; phone: string; countryCode: string; rating: number }) => void;
}

export const ReviewForm = ({ onSubmit }: ReviewFormProps) => {
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    countryCode: "+1",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Extract and sanitize URL parameters
  const sanitizeInput = (input: string | null): string => {
    if (!input) return "";
    return input
      .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  };

  const customerName = sanitizeInput(searchParams.get('customer'));
  const utmSource = sanitizeInput(searchParams.get('utm_source'));

  // Pre-fill name if provided in URL
  useEffect(() => {
    if (customerName) {
      setFormData(prev => ({ ...prev, name: decodeURIComponent(customerName) }));
    }
  }, [customerName]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{8,15}$/;
    return phoneRegex.test(phone.replace(/[^\d]/g, ''));
  };

  const capitalizeWords = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capitalized = capitalizeWords(e.target.value);
    setFormData(prev => ({ ...prev, name: capitalized }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number (8-15 digits)",
        variant: "destructive",
      });
      return;
    }

    if (formData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate form submission delay
      await new Promise(resolve => setTimeout(resolve, 800));
      onSubmit(formData);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Alpha Business Designs
          </h1>
          <p className="text-muted-foreground">
            We'd love to hear about your experience
          </p>
          {utmSource === 'email' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg" role="status" aria-live="polite">
              <p className="text-sm text-blue-700">
                📧 Thank you for responding to our review request!
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-label="Review submission form">
          <div className="form-field">
            <label className="form-label flex items-center gap-2" htmlFor="name-input">
              <User className="w-4 h-4" aria-hidden="true" />
              Full Name *
            </label>
            <input
              id="name-input"
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              aria-required="true"
              aria-describedby="name-error"
              aria-invalid={!formData.name.trim() && isSubmitting}
            />
            {!formData.name.trim() && isSubmitting && (
              <div id="name-error" className="text-red-500 text-sm mt-1" role="alert">
                Name is required
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="phone-input">
              Phone Number *
            </label>
            <PhoneInput
              value={formData.phone}
              countryCode={formData.countryCode}
              onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
              onCountryChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
              disabled={isSubmitting}
              placeholder="1234567890"
              aria-required="true"
              aria-describedby="phone-error"
              aria-invalid={!formData.phone.trim() && isSubmitting}
            />
            {!formData.phone.trim() && isSubmitting && (
              <div id="phone-error" className="text-red-500 text-sm mt-1" role="alert">
                Phone number is required
              </div>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="rating-input">
              How would you rate your experience? *
            </label>
            <div className="flex justify-center py-4">
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                }
                aria-required="true"
                aria-describedby="rating-error"
                aria-invalid={formData.rating === 0 && isSubmitting}
              />
            </div>
            {formData.rating === 0 && isSubmitting && (
              <div id="rating-error" className="text-red-500 text-sm mt-1 text-center" role="alert">
                Please select a rating
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full scale-in"
            aria-describedby="submit-status"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
          
          {isSubmitting && (
            <div id="submit-status" className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
              Please wait while we submit your review...
            </div>
          )}
        </form>
      </div>
    </div>
  );
};