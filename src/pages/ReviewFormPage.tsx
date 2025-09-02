import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone } from "lucide-react";
import { PhoneInput } from "@/components/PhoneInput";
import { supabase } from "@/integrations/supabase/client";
import { APP_CONFIG } from "@/constants";

interface ReviewFormData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
}

export default function ReviewFormPage() {
  const [formData, setFormData] = useState<ReviewFormData>({
    name: "",
    phone: "",
    countryCode: "+1",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract URL parameters
  const trackingId = searchParams.get('tracking_id');
  const customerName = searchParams.get('customer');
  const utmSource = searchParams.get('utm_source');

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
      // Save review to database with tracking information
      const { data: insertedData, error } = await supabase
        .from('reviews')
        .insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          country_code: formData.countryCode,
          rating: formData.rating,
          google_review: formData.rating >= 4,
          redirect_opened: false,
          metadata: {
            trackingId: trackingId || null,
            utmSource: utmSource || 'direct',
            source: 'email_form',
            submitted_at: new Date().toISOString(),
            form_version: 'email_triggered'
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
        throw error;
      }

      // Show success message
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Handle conditional redirect based on rating
      if (formData.rating >= 4) {
        // Redirect directly to Google Reviews for ratings 4 and above
        window.location.href = APP_CONFIG.GOOGLE_REVIEWS_URL;
      } else {
        // Navigate to feedback page for ratings below 4
        navigate('/review/feedback', { 
          state: { 
            name: formData.name, 
            rating: formData.rating,
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
      } else if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
        errorMessage = "Access denied. Please refresh the page and try again.";
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="form-container fade-in max-w-md w-full mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            {APP_CONFIG.NAME}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            We'd love to hear about your experience
          </p>
          {utmSource === 'email' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">
                📧 Thank you for responding to our review request!
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="form-field">
            <label className="form-label flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleNameChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label className="form-label flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </label>
            <PhoneInput
              value={formData.phone}
              countryCode={formData.countryCode}
              onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
              onCountryChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
              disabled={isSubmitting}
              placeholder="1234567890"
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              How would you rate your experience? *
            </label>
            <div className="flex justify-center py-4">
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                }
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {formData.rating > 0 && (
                formData.rating >= 4 
                  ? "⭐ Great! We'll redirect you to Google Reviews after submission"
                  : "💬 We'd love to hear how we can improve"
              )}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full scale-in"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your feedback helps us improve our services
          </p>
        </div>
      </div>
    </div>
  );
}
