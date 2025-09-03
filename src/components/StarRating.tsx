import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  "aria-required"?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const StarRating = ({ 
  rating, 
  onRatingChange, 
  size = 32,
  "aria-required": ariaRequired,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [focusedStar, setFocusedStar] = useState(0);

  const handleStarClick = (starValue: number) => {
    onRatingChange(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent, starValue: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleStarClick(starValue);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (starValue < 5) {
          const nextStar = document.getElementById(`star-${starValue + 1}`);
          nextStar?.focus();
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (starValue > 1) {
          const prevStar = document.getElementById(`star-${starValue - 1}`);
          prevStar?.focus();
        }
        break;
    }
  };

  const getRatingText = (value: number) => {
    const ratings = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[value as keyof typeof ratings] || '';
  };

  return (
    <div 
      className="star-rating"
      role="radiogroup"
      aria-label="Rate your experience"
      aria-required={ariaRequired}
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid}
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isActive = starValue <= (hoverRating || rating);
        const isHovered = hoverRating > 0 && starValue <= hoverRating;
        const isSelected = starValue === rating;
        
        return (
          <button
            key={starValue}
            id={`star-${starValue}`}
            type="button"
            className="star-button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            onMouseLeave={handleStarLeave}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            onFocus={() => setFocusedStar(starValue)}
            onBlur={() => setFocusedStar(0)}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''} - ${getRatingText(starValue)}`}
            aria-checked={isSelected}
            tabIndex={0}
          >
            <Star
              size={size}
              className={`star ${isActive ? 'active' : ''} ${isHovered ? 'hover-active' : ''} ${focusedStar === starValue ? 'focused' : ''}`}
              fill={isActive ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        );
      })}
      
      <div className="sr-only" aria-live="polite">
        {rating > 0 ? `Selected: ${rating} star${rating > 1 ? 's' : ''} - ${getRatingText(rating)}` : 'No rating selected'}
      </div>
    </div>
  );
};