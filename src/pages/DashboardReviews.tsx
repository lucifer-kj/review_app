import { useState, useMemo, useCallback } from "react";
import { useOptimizedCallback, useDebouncedCallback } from "@/hooks/useOptimizedCallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewListSkeleton } from "@/components/ReviewSkeleton";
import { SendReviewEmailDialog } from "@/components/SendReviewEmailDialog";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { useReviewsQuery } from "@/hooks/useReviewsQuery";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { MobileSearchFilters } from "@/components/MobileSearchFilters";
import { MobileReviewCard } from "@/components/MobileReviewCard";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import { useAuth } from "@/hooks/useAuth";
import { Star, Search, Download, Filter, Eye, MessageSquare, ExternalLink, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Review, RatingFilter } from "@/types";

const DashboardReviews = () => {
  const { tenant } = useAuth();
  const [params, setParams] = useQueryParams<{ search?: string; rating?: RatingFilter; page?: string }>();
  const [persistedFilters, setPersistedFilters] = useSessionStorage<{ search?: string; rating?: RatingFilter }>("reviews.filters", { search: params.search || "", rating: (params.rating as RatingFilter) || "all" });
  const [searchTerm, setSearchTerm] = useState(persistedFilters.search || "");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(persistedFilters.rating || "all");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const page = Number(params.page || 1);
  const { data, isLoading, error, refetch } = useReviewsQuery({ search: debouncedSearch, rating: ratingFilter, page });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const { toast } = useToast();

  // Enable real-time updates for reviews
  useRealtimeUpdates({
    tables: [
      {
        table: 'reviews',
        queryKey: ['reviews', { search: debouncedSearch, rating: ratingFilter, page, tenantId: tenant?.id }],
        tenantId: tenant?.id,
        events: ['INSERT', 'UPDATE', 'DELETE']
      }
    ],
    enabled: !!tenant?.id,
    onError: (error) => {
      console.error('Real-time reviews update error:', error);
    }
  });

  const filteredReviews = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const exportToCSV = useOptimizedCallback(() => {
    try {
      const csvContent = [
        ['Name', 'Phone', 'Rating', 'Google Review', 'Redirect Opened', 'Feedback', 'Date'],
        ...filteredReviews.map(review => [
          review.customer_name,
          review.customer_phone || '',
          review.rating.toString(),
          review.google_review ? 'Yes' : 'No',
          review.redirect_opened ? 'Yes' : 'No',
          review.review_text || '',
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

  const handleViewFeedback = useOptimizedCallback((review: Review) => {
    setSelectedReview(review);
    setShowFeedbackDialog(true);
  }, []);

  const handleGoogleReviewClick = useOptimizedCallback((review: Review) => {
    if (review.google_review) {
      window.open('https://g.page/r/CZEmfT3kD-k-EBM/review', '_blank');
    }
  }, []);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <AppErrorBoundary componentName="DashboardReviews">
        <div className="w-full space-y-6 p-6 pt-20 lg:pt-6">
          <ReviewListSkeleton />
        </div>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary componentName="DashboardReviews">
      <div className="w-full space-y-6 p-6 pt-20 lg:pt-6">
        {/* Mobile Components */}
        <div className="lg:hidden space-y-6">
          <MobileSearchFilters
            searchTerm={searchTerm}
            ratingFilter={ratingFilter}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPersistedFilters({ search: value, rating: ratingFilter });
              setParams({ search: value || undefined, page: '1' });
            }}
            onRatingFilterChange={(value) => {
              const v = value as typeof ratingFilter;
              setRatingFilter(v);
              setPersistedFilters({ search: searchTerm, rating: v });
              setParams({ rating: v === 'all' ? undefined : v, page: '1' });
            }}
            onClearFilters={() => {
              setSearchTerm('');
              setRatingFilter('all');
              setPersistedFilters({ search: '', rating: 'all' });
              setParams({ search: undefined, rating: undefined, page: '1' });
            }}
          />
          
          {/* Mobile Review Cards */}
          <div className="space-y-4 px-1">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <MobileReviewCard
                  key={review.id}
                  review={review}
                  onViewFeedback={handleViewFeedback}
                  onGoogleReviewClick={handleGoogleReviewClick}
                />
              ))
            )}
          </div>
          
          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center px-4 pb-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => setParams({ page: String(newPage) })}
              />
            </div>
          )}
        </div>

        {/* Desktop Components */}
        <div className="hidden lg:block space-y-6">
          <Breadcrumbs 
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Reviews", isCurrent: true }
            ]} 
            className="mb-4"
          />
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reviews</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and analyze customer feedback
            </p>
          </div>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="text-lg sm:text-xl">Filter Reviews</CardTitle>
              <CardDescription className="text-sm">
                Search and filter reviews to find what you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 sm:px-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPersistedFilters({ search: e.target.value, rating: ratingFilter });
                        setParams({ search: e.target.value || undefined, page: '1' });
                      }}
                      className="pl-9 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <Select
                  value={ratingFilter}
                  onValueChange={(value) => {
                    const v = value as typeof ratingFilter;
                    setRatingFilter(v);
                    setPersistedFilters({ search: searchTerm, rating: v });
                    setParams({ rating: v === 'all' ? undefined : v, page: '1' });
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="high">High (4-5 stars)</SelectItem>
                    <SelectItem value="low">Low (1-3 stars)</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchTerm || ratingFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setRatingFilter('all');
                      setPersistedFilters({ search: '', rating: 'all' });
                      setParams({ search: undefined, rating: undefined, page: '1' });
                    }}
                    className="flex-shrink-0"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Reviews ({total})</CardTitle>
                  <CardDescription className="text-sm">
                    {error && (
                      <span className="text-destructive">Error loading reviews. 
                        <Button variant="link" onClick={handleRefetch} className="p-0 h-auto ml-1">
                          Retry
                        </Button>
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleRefetch} variant="outline" size="sm" className="flex-1 sm:flex-none text-sm">
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => setShowSendEmailDialog(true)} 
                    variant="default" 
                    size="sm"
                    className="flex-1 sm:flex-none text-sm"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Send Review Request</span>
                    <span className="sm:hidden">Send Request</span>
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none text-sm">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3 py-3 text-xs sm:text-sm">Customer</TableHead>
                          <TableHead className="px-3 py-3 text-xs sm:text-sm">Rating</TableHead>
                          <TableHead className="px-3 py-3 text-xs sm:text-sm">Google Review</TableHead>
                          <TableHead className="hidden sm:table-cell px-3 py-3 text-xs sm:text-sm">Redirected</TableHead>
                          <TableHead className="px-3 py-3 text-xs sm:text-sm">Feedback</TableHead>
                          <TableHead className="hidden lg:table-cell px-3 py-3 text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="px-3 py-3 text-xs sm:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReviews.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              {searchTerm || ratingFilter !== "all" 
                                ? "No reviews found matching your filters" 
                                : "No reviews found. Start collecting customer feedback!"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReviews.map((review) => (
                            <TableRow key={review.id} className="hover:bg-muted/50">
                              <TableCell className="px-2 sm:px-4">
                                <div>
                                  <div className="font-medium text-xs sm:text-sm lg:text-base truncate">{review.customer_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{review.customer_phone || 'N/A'}</div>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 sm:px-4">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-xs sm:text-sm lg:text-base">{review.rating}</span>
                                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
                                </div>
                              </TableCell>
                              <TableCell className="px-2 sm:px-4">
                                <Button
                                  variant={review.google_review ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => handleGoogleReviewClick(review)}
                                  disabled={!review.google_review}
                                  className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                                >
                                  {review.google_review ? (
                                    <>
                                      <ExternalLink className="mr-1 h-3 w-3" />
                                      <span className="hidden sm:inline">View</span>
                                      <span className="sm:hidden">✓</span>
                                    </>
                                  ) : (
                                    "No"
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell px-4">
                                <Badge variant={review.redirect_opened ? "default" : "outline"} className="text-xs">
                                  {review.redirect_opened ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-2 sm:px-4">
                                {review.review_text ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFeedback(review)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">No feedback</span>
                                )}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell px-4 text-xs sm:text-sm text-muted-foreground">
                                {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFeedback(review)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setParams({ page: String(newPage) })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Dialog */}
        {showFeedbackDialog && selectedReview && (
          <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
            <DialogContent className="max-w-2xl mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Review Details</DialogTitle>
                <DialogDescription className="text-sm">
                  Customer feedback and review information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Customer Name</label>
                    <p className="text-sm text-muted-foreground">{selectedReview.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-muted-foreground">{selectedReview.customer_phone || 'N/A'}</p>
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
                {selectedReview.review_text && (
                  <div>
                    <label className="text-sm font-medium">Customer Feedback</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <p className="text-sm">{selectedReview.review_text}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
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

        {/* Send Review Email Dialog */}
        <SendReviewEmailDialog
          open={showSendEmailDialog}
          onOpenChange={setShowSendEmailDialog}
          onSuccess={() => {
            // Optionally refresh data or show success message
            toast({
              title: "Review Request Sent",
              description: "The customer will receive an email with a link to leave a review.",
            });
          }}
        />
      </div>
    </AppErrorBoundary>
  );
};

export default DashboardReviews;