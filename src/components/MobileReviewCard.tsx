import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 truncate">{review.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{review.phone}</p>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
              <span className="font-bold text-sm text-yellow-700">{review.rating}</span>
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={review.google_review ? "default" : "secondary"} 
              className="text-xs px-2 py-1 font-medium"
            >
              Google: {review.google_review ? "✓" : "✗"}
            </Badge>
            <Badge 
              variant={review.redirect_opened ? "default" : "outline"} 
              className="text-xs px-2 py-1 font-medium"
            >
              Redirected: {review.redirect_opened ? "✓" : "✗"}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {format(new Date(review.created_at), "MMM dd")}
            </span>
            
            <div className="flex gap-1">
              {review.feedback && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewFeedback(review)}
                  className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100"
                >
                  <MessageSquare className="h-3 w-3 text-blue-600" />
                </Button>
              )}
              
              <Button
                variant={review.google_review ? "default" : "ghost"}
                size="sm"
                onClick={() => onGoogleReviewClick(review)}
                disabled={!review.google_review}
                className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100"
              >
                <ExternalLink className="h-3 w-3 text-green-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewFeedback(review)}
                className="h-8 w-8 p-0 bg-gray-50 hover:bg-gray-100"
              >
                <Eye className="h-3 w-3 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
