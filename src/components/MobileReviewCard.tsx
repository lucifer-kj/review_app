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
    <Card className="p-6 space-y-4 shadow-lg border-0 bg-gradient-to-r from-background to-muted/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{review.name}</h3>
          <p className="text-sm text-muted-foreground">{review.phone}</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-xl">
          <span className="font-bold text-lg text-yellow-700">{review.rating}</span>
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge 
          variant={review.google_review ? "default" : "secondary"} 
          className="text-sm px-3 py-1 font-medium"
        >
          Google: {review.google_review ? "✓" : "✗"}
        </Badge>
        <Badge 
          variant={review.redirect_opened ? "default" : "outline"} 
          className="text-sm px-3 py-1 font-medium"
        >
          Redirected: {review.redirect_opened ? "✓" : "✗"}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg">
          {format(new Date(review.created_at), "MMM dd, yyyy")}
        </span>
        
        <div className="flex gap-2">
          {review.feedback && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewFeedback(review)}
              className="h-10 w-10 p-0 bg-blue-50 hover:bg-blue-100"
            >
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          
          <Button
            variant={review.google_review ? "default" : "ghost"}
            size="sm"
            onClick={() => onGoogleReviewClick(review)}
            disabled={!review.google_review}
            className="h-10 w-10 p-0 bg-green-50 hover:bg-green-100"
          >
            <ExternalLink className="h-4 w-4 text-green-600" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewFeedback(review)}
            className="h-10 w-10 p-0 bg-gray-50 hover:bg-gray-100"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
