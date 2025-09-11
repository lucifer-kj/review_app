import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthGuard } from "./components/auth/AuthGuard";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import SettingsErrorBoundary from "./components/SettingsErrorBoundary";
import { StoreInitializer } from "./components/StoreInitializer";
import { useRouteProgress } from "@/hooks/useRouteProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Analytics } from "@vercel/analytics/react";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardReviews = lazy(() => import("./pages/DashboardReviews"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettingsFixed"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Master dashboard components
const MasterDashboardLayout = lazy(() => import("./components/master-dashboard/layout/MasterDashboardLayout"));
const PlatformOverview = lazy(() => import("./components/master-dashboard/overview/PlatformOverview"));
const TenantList = lazy(() => import("./components/master-dashboard/tenants/TenantList"));
const TenantDetails = lazy(() => import("./components/master-dashboard/tenants/TenantDetails"));
const TenantCreateWizard = lazy(() => import("./components/master-dashboard/tenants/TenantCreateWizard"));
const TenantSettings = lazy(() => import("./components/master-dashboard/tenants/TenantSettings"));

// User management components
const UserDirectory = lazy(() => import("./components/master-dashboard/users/UserDirectory"));
const UserManagement = lazy(() => import("./components/master-dashboard/users/UserManagementSimple"));
const InviteUserForm = lazy(() => import("./components/master-dashboard/users/InviteUserForm"));

// System administration components
const SystemAdministration = lazy(() => import("./components/master-dashboard/system/SystemAdministration"));

// Audit components
const AuditLogs = lazy(() => import("./components/master-dashboard/audit/AuditLogs"));

// Authentication components
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const TestAcceptInvitation = lazy(() => import("./pages/TestAcceptInvitation"));
const TestCallback = lazy(() => import("./pages/TestCallback"));
const TenantLogin = lazy(() => import("./pages/BackupLogin"));

// Review flow pages
const TenantReviewForm = lazy(() => import("./pages/TenantReviewForm"));
const TenantReviewThankYou = lazy(() => import("./pages/TenantReviewThankYou"));
const QualityCareReviewForm = lazy(() => import("./pages/QualityCareReviewForm"));
const DebugTenantAccess = lazy(() => import("./pages/DebugTenantAccess"));
const TestSupabaseConnection = lazy(() => import("./pages/TestSupabaseConnection"));
const TestPublicReview = lazy(() => import("./pages/TestPublicReview"));
const PublicReviewForm = lazy(() => import("./pages/PublicReviewForm"));
const TestReviewForm = lazy(() => import("./pages/TestReviewForm"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const FeedbackThankYouPage = lazy(() => import("./pages/FeedbackThankYouPage"));
const ReviewThankYouPage = lazy(() => import("./pages/ReviewThankYouPage"));

const queryClient = new QueryClient();

const RouterContent = () => {
  const { ProgressBar } = useRouteProgress();
  const reduced = useReducedMotion();
  
  // Remove store initialization from here to prevent infinite loops
  // Stores will initialize themselves when needed

  return (
    <>
      <ProgressBar />
      <Suspense fallback={<LoadingSpinner size={reduced ? "md" : "lg"} className="min-h-screen" />}>
        <Routes>
          {/* Login page - default route */}
          <Route path="/" element={<Login />} />
          
          {/* Auth callback route for magic links */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Accept invitation route */}
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          
          {/* Test routes for debugging */}
          <Route path="/test-accept-invitation" element={<TestAcceptInvitation />} />
          <Route path="/test-callback" element={<TestCallback />} />
          <Route path="/debug-tenant/:tenantId" element={<DebugTenantAccess />} />
          <Route path="/test-supabase" element={<TestSupabaseConnection />} />
          <Route path="/test-public-review" element={<TestPublicReview />} />
          
          {/* Master Dashboard routes - super admin only */}
          <Route path="/master" element={
            <AuthGuard>
              <ProtectedRoute requiredRole="super_admin">
                <MasterDashboardLayout />
              </ProtectedRoute>
            </AuthGuard>
          }>
            <Route index element={<PlatformOverview />} />
            <Route path="tenants" element={<TenantList />} />
            <Route path="tenants/new" element={<TenantCreateWizard />} />
            <Route path="tenants/:tenantId" element={<TenantDetails />} />
            <Route path="tenants/:tenantId/edit" element={<TenantSettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/invite" element={<InviteUserForm />} />
            <Route path="system" element={<SystemAdministration />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>
          
          {/* Dashboard routes - protected (tenant_admin and user) */}
          <Route path="/dashboard" element={
            <AuthGuard>
              <ProtectedRoute requiredRole={["tenant_admin", "user"]}>
                <DashboardLayout />
              </ProtectedRoute>
            </AuthGuard>
          }>
            <Route index element={<Dashboard />} />
            <Route path="reviews" element={<DashboardReviews />} />
            <Route path="settings" element={
              <SettingsErrorBoundary>
                <DashboardSettings />
              </SettingsErrorBoundary>
            } />
          </Route>
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/backup-login" element={<TenantLogin />} />
          <Route path="/tenant-login" element={<TenantLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Public customer review form - specific routes first */}
          <Route path="/review/Quality-and-care-building-inspection" element={<QualityCareReviewForm />} />
          <Route path="/review/feedback" element={<FeedbackPage />} />
          <Route path="/review/feedback-thank-you" element={<FeedbackThankYouPage />} />
          <Route path="/review/thank-you" element={<ReviewThankYouPage />} />
          <Route path="/review/tenant-thank-you" element={<TenantReviewThankYou />} />
          <Route path="/review/link/:linkCode" element={<PublicReviewForm />} />
          {/* Tenant-specific review form - must be last to avoid conflicts */}
          <Route path="/review/:tenantId" element={<PublicReviewForm />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <StoreInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter 
        basename="/"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <RouterContent />
      </BrowserRouter>
      <Analytics />
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
