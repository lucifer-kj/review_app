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
    <div className="lg:hidden space-y-6 px-1">
      {/* Page Title */}
      <div className="px-2">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Hero Metrics - Swipeable */}
      <div className="overflow-x-auto -mx-1">
        <div className="flex gap-4 pb-4 px-1" style={{ width: "max-content" }}>
          <Card className="min-w-[320px] p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="font-semibold text-base">Total Reviews</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2 text-blue-700">{stats.totalReviews}</div>
            <p className="text-sm text-blue-600/80">Customer feedback received</p>
          </Card>

          <Card className="min-w-[320px] p-6 shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <span className="font-semibold text-base">Average Rating</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2 text-yellow-700">{stats.averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= Math.round(stats.averageRating)
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </Card>

          <Card className="min-w-[320px] p-6 shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="font-semibold text-base">High Ratings</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2 text-green-700">{stats.highRatingReviews}</div>
            <p className="text-sm text-green-600/80">4-5 star reviews</p>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 px-2">
        <Button onClick={onSendReview} size="lg" className="flex-1 h-14 text-base font-semibold shadow-lg">
          <Mail className="h-5 w-5 mr-3" />
          Send Review Request
        </Button>
        <Button onClick={onViewReviews} variant="outline" size="lg" className="flex-1 h-14 text-base font-semibold shadow-lg border-2">
          <FileText className="h-5 w-5 mr-3" />
          View Reviews
        </Button>
      </div>
    </div>
  );
};
