import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { MagicCard } from "@/components/ui/magic-card";
import { BarChart3, FileText, Star, Receipt, Plus, Eye, Download } from "lucide-react";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  highRatingReviews: number;
  totalInvoices: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    highRatingReviews: 0,
    totalInvoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalReviews: 24,
          averageRating: 4.6,
          highRatingReviews: 20,
          totalInvoices: 12,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <LoadingWrapper loading={loading} error={null} className="space-y-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your business metrics.
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MagicCard className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Total Reviews</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                Customer feedback received
              </p>
            </CardContent>
          </MagicCard>

          <MagicCard className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Average Rating</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(stats.averageRating)
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </MagicCard>

          <MagicCard className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">High Ratings</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.highRatingReviews}</div>
              <p className="text-xs text-muted-foreground">
                4+ star reviews
              </p>
            </CardContent>
          </MagicCard>

          <MagicCard className="p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pt-0">
              <CardTitle className="text-sm font-semibold text-foreground">Total Invoices</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                Invoices generated
              </p>
            </CardContent>
          </MagicCard>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <MagicCard>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
              <CardDescription className="text-sm">
                Latest updates from your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <Badge variant="default" className="flex-shrink-0">Review</Badge>
                  <span className="text-sm text-foreground">New customer review received</span>
                  <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <Badge variant="secondary" className="flex-shrink-0">Invoice</Badge>
                  <span className="text-sm text-foreground">Invoice template updated</span>
                  <span className="text-xs text-muted-foreground ml-auto">1d ago</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                  <Badge variant="outline" className="flex-shrink-0">System</Badge>
                  <span className="text-sm text-foreground">Backup completed successfully</span>
                  <span className="text-xs text-muted-foreground ml-auto">3d ago</span>
                </div>
              </div>
            </CardContent>
          </MagicCard>

          <MagicCard>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-sm">
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200 text-sm text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Create new invoice</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200 text-sm text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <span>View recent reviews</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/30 transition-colors duration-200 text-sm text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Download className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Export data</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </MagicCard>
        </div>
      </div>
    </LoadingWrapper>
  );
};

export default Dashboard;