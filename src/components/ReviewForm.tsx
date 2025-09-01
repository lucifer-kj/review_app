import { useState } from "react";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { Building2, User } from "lucide-react";
import { PhoneInput } from "./PhoneInput";

interface ReviewFormProps {
  onSubmit: (data: { name: string; phone: string; countryCode: string; rating: number }) => void;
}

export const ReviewForm = ({ onSubmit }: ReviewFormProps) => {
  console.log("ReviewForm component loaded with email support");
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    countryCode: "+1",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Alpha Business Designs
          </h1>
          <p className="text-muted-foreground">
            We'd love to hear about your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="form-label">
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full scale-in"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
};