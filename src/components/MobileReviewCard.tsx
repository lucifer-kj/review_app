import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Review } from "@/types";

interface MobileReviewCardProps {
  review: Review;
  onViewFeedback: (review: Review) => void;
  onGoogleReviewClick: (review: Review) => void;
}

export const MobileReviewCard = ({ 
  review, 
  onViewFeedback, 
  onGoogleReviewClick 
}: MobileReviewCardProps) => {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-sm">{review.name}</h3>
          <p className="text-xs text-muted-foreground">{review.phone}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm">{review.rating}</span>
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={review.google_review ? "default" : "secondary"} className="text-xs">
          Google: {review.google_review ? "Yes" : "No"}
        </Badge>
        <Badge variant={review.redirect_opened ? "default" : "outline"} className="text-xs">
          Redirected: {review.redirect_opened ? "Yes" : "No"}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(review.created_at), "MMM dd, yyyy")}
        </span>
        
        <div className="flex gap-1">
          {review.feedback && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewFeedback(review)}
              className="h-8 w-8 p-0"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant={review.google_review ? "default" : "ghost"}
            size="sm"
            onClick={() => onGoogleReviewClick(review)}
            disabled={!review.google_review}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewFeedback(review)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
