import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, FileText, Mail, Plus, TrendingUp, Users, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileDashboard } from "@/components/MobileDashboard";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ReviewService } from "@/services/reviewService";
import { SendReviewEmailDialog } from "@/components/SendReviewEmailDialog";
import ReviewLimitBanner from "@/components/ReviewLimitBanner";
import GoogleReviewLink from "@/components/GoogleReviewLink";
import PlanUpgradePrompt from "@/components/PlanUpgradePrompt";
import { useAuth } from "@/hooks/useAuth";
import { BusinessSettingsService } from "@/services/businessSettingsService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    highRatingReviews: 0,
  });
  const [businessSettings, setBusinessSettings] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
  });
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, tenant, refreshUserData } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch review stats
        const statsResponse = await ReviewService.getReviewStats();
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          console.error('Failed to load dashboard stats:', statsResponse.error);
        }

        // Fetch business settings if user has a tenant
        if (profile?.tenant_id) {
          const settingsResponse = await BusinessSettingsService.getBusinessSettings();
          if (settingsResponse.success && settingsResponse.data) {
            setBusinessSettings({
              business_name: settingsResponse.data.business_name || '',
              business_email: settingsResponse.data.business_email || '',
              business_phone: settingsResponse.data.business_phone || '',
              business_address: settingsResponse.data.business_address || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, profile?.tenant_id]);

  // Refresh data when user profile changes (e.g., when moved to tenant)
  useEffect(() => {
    if (profile?.tenant_id) {
      const fetchBusinessSettings = async () => {
        try {
          const settingsResponse = await BusinessSettingsService.getBusinessSettings();
          if (settingsResponse.success && settingsResponse.data) {
            setBusinessSettings({
              business_name: settingsResponse.data.business_name || '',
              business_email: settingsResponse.data.business_email || '',
              business_phone: settingsResponse.data.business_phone || '',
              business_address: settingsResponse.data.business_address || '',
            });
          }
        } catch (error) {
          console.error('Error fetching business settings:', error);
        }
      };

      fetchBusinessSettings();
    }
  }, [profile?.tenant_id]);

  const handleSendReview = () => {
    setShowReviewDialog(true);
  };

  const handleViewReviews = () => {
    navigate("/reviews");
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LoadingWrapper>
    );
  }

  return (
            <AppErrorBoundary componentName="Dashboard">
      {/* Mobile Dashboard */}
      <MobileDashboard
        stats={stats}
        onSendReview={handleSendReview}
        onViewReviews={handleViewReviews}
      />

      {/* Desktop Dashboard */}
      <div className="hidden lg:block w-full space-y-6 p-6">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", isCurrent: true }
          ]} 
          className="mb-4"
        />
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Here's your business overview.
          </p>
        </div>

        {/* Tenant Information Card */}
        {tenant && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {tenant.name}
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </CardTitle>
              {tenant.settings?.description && (
                <CardDescription>{tenant.settings.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Your Role</span>
                  </div>
                  <p className="font-medium capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
                {tenant.domain && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Domain</span>
                    </div>
                    <p className="font-medium">{tenant.domain}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Information Card */}
        {businessSettings.business_name && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{businessSettings.business_name}</p>
                </div>
                {businessSettings.business_email && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{businessSettings.business_email}</p>
                  </div>
                )}
                {businessSettings.business_phone && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{businessSettings.business_phone}</p>
                  </div>
                )}
                {businessSettings.business_address && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{businessSettings.business_address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5" />
                Total Reviews
              </CardTitle>
              <CardDescription className="text-sm">
                Customer feedback received
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold">{stats.totalReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Star className="h-5 w-5" />
                Average Rating
              </CardTitle>
              <CardDescription className="text-sm">
                Overall customer satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 sm:px-8">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5" />
                High Ratings
              </CardTitle>
              <CardDescription className="text-sm">
                4-5 star reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8">
              <div className="text-3xl font-bold">{stats.highRatingReviews}</div>
            </CardContent>
          </Card>
        </div>

        {/* Review Limits and Google Review Link */}
        {user?.tenant_id && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReviewLimitBanner 
              tenantId={user.tenant_id}
              onUpgrade={() => navigate('/dashboard/settings')}
            />
            <GoogleReviewLink 
              tenantId={user.tenant_id}
              businessName="Your Business"
            />
          </div>
        )}

        {/* Plan Upgrade Prompt */}
        {user?.tenant_id && (
          <PlanUpgradePrompt 
            tenantId={user.tenant_id}
            onUpgrade={() => navigate('/dashboard/settings')}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={handleSendReview} size="lg" className="text-sm sm:text-base">
            <Mail className="h-4 w-4 mr-2" />
            Send Review Request
          </Button>
          <Button onClick={handleViewReviews} variant="outline" size="lg" className="text-sm sm:text-base">
            <FileText className="h-4 w-4 mr-2" />
            View All Reviews
          </Button>
        </div>
      </div>

      {/* Send Review Email Dialog */}
      <SendReviewEmailDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        tenantId={user?.tenant_id}
        onSuccess={() => {
          setShowReviewDialog(false);
          toast({
            title: "Review Request Sent",
            description: "The customer will receive an email with a link to leave a review.",
          });
        }}
      />
            </AppErrorBoundary>
  );
};

export default Dashboard;
