import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewListSkeleton } from "@/components/ReviewSkeleton";
import { useReviews } from "@/hooks/useReviews";
import { Star, Search, Download, Filter, Eye, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Review, RatingFilter } from "@/types";

const DashboardReviews = () => {
  const { reviews, loading, error, refetch } = useReviews();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const { toast } = useToast();

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch = 
        review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = 
        ratingFilter === "all" || 
        (ratingFilter === "high" && review.rating >= 4) ||
        (ratingFilter === "low" && review.rating < 4);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchTerm, ratingFilter]);

  const exportToCSV = useCallback(() => {
    try {
      const csvContent = [
        ['Name', 'Phone', 'Rating', 'Google Review', 'Redirect Opened', 'Feedback', 'Date'],
        ...filteredReviews.map(review => [
          review.name,
          review.phone,
          review.rating.toString(),
          review.google_review ? 'Yes' : 'No',
          review.redirect_opened ? 'Yes' : 'No',
          review.feedback || '',
          format(new Date(review.created_at), 'yyyy-MM-dd HH:mm:ss')
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredReviews.length} reviews to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export reviews. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredReviews, toast]);

  const handleViewFeedback = (review: Review) => {
    setSelectedReview(review);
    setShowFeedbackDialog(true);
  };

  const handleGoogleReviewClick = (review: Review) => {
    if (review.google_review) {
      window.open('https://g.page/r/CZEmfT3kD-k-EBM/review', '_blank');
    }
  };

  if (loading) {
    return <ReviewListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Manage and analyze customer feedback
          </p>
        </div>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Reviews</CardTitle>
          <CardDescription>
            Search and filter reviews to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="high">High (4-5 stars)</SelectItem>
                <SelectItem value="low">Low (1-3 stars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
              <CardDescription>
                {error && (
                  <span className="text-destructive">Error loading reviews. 
                    <Button variant="link" onClick={refetch} className="p-0 h-auto ml-1">
                      Retry
                    </Button>
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={refetch} variant="outline" size="sm">
                Refresh
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Google Review</TableHead>
                  <TableHead>Redirected</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || ratingFilter !== "all" 
                        ? "No reviews found matching your filters" 
                        : "No reviews found. Start collecting customer feedback!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.name}</div>
                          <div className="text-sm text-muted-foreground">{review.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{review.rating}</span>
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={review.google_review ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleGoogleReviewClick(review)}
                          disabled={!review.google_review}
                        >
                          {review.google_review ? (
                            <>
                              <ExternalLink className="mr-1 h-3 w-3" />
                              View
                            </>
                          ) : (
                            "No"
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.redirect_opened ? "default" : "outline"}>
                          {review.redirect_opened ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {review.feedback ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFeedback(review)}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No feedback</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewFeedback(review)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      {showFeedbackDialog && selectedReview && (
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                Customer feedback and review information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <p className="text-sm text-muted-foreground">{selectedReview.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm text-muted-foreground">{selectedReview.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{selectedReview.rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedReview.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              {selectedReview.feedback && (
                <div>
                  <label className="text-sm font-medium">Customer Feedback</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedReview.feedback}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Badge variant={selectedReview.google_review ? "default" : "secondary"}>
                  Google Review: {selectedReview.google_review ? "Yes" : "No"}
                </Badge>
                <Badge variant={selectedReview.redirect_opened ? "default" : "outline"}>
                  Redirected: {selectedReview.redirect_opened ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DashboardReviews;