import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, FileText, Mail, Plus, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDashboardProps {
  stats: {
    totalReviews: number;
    averageRating: number;
    highRatingReviews: number;
  };
  onSendReview: () => void;
  onViewReviews: () => void;
}

export const MobileDashboard = ({ stats, onSendReview, onViewReviews }: MobileDashboardProps) => {
  return (
    <div className="lg:hidden space-y-4">
      {/* Hero Metrics - Swipeable */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ width: "max-content" }}>
          <Card className="min-w-[280px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-sm">Total Reviews</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Customer feedback received</p>
          </Card>

          <Card className="min-w-[280px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium text-sm">Average Rating</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3 w-3",
                    star <= Math.round(stats.averageRating)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </Card>

          <Card className="min-w-[280px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-sm">High Ratings</span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.highRatingReviews}</div>
            <p className="text-xs text-muted-foreground">4-5 star reviews</p>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onSendReview} className="flex-1">
          <Mail className="h-4 w-4 mr-2" />
          Send Review
        </Button>
        <Button onClick={onViewReviews} variant="outline" className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          View Reviews
        </Button>
      </div>
    </div>
  );
};
