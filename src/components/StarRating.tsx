import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

export const StarRating = ({ rating, onRatingChange, size = 32 }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue: number) => {
    onRatingChange(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isActive = starValue <= (hoverRating || rating);
        const isHovered = hoverRating > 0 && starValue <= hoverRating;
        
        return (
          <Star
            key={starValue}
            size={size}
            className={`star ${isActive ? 'active' : ''} ${isHovered ? 'hover-active' : ''}`}
            fill={isActive ? 'currentColor' : 'none'}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            onMouseLeave={handleStarLeave}
          />
        );
      })}
    </div>
  );
};