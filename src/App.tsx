import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRouteDebug as ProtectedRoute } from "./components/auth/ProtectedRouteDebug";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { useRouteProgress } from "@/hooks/useRouteProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TenantProvider } from "@/hooks/useTenantContext";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardReviews = lazy(() => import("./pages/DashboardReviews"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Master dashboard components
const MasterDashboardLayout = lazy(() => import("./components/master-dashboard/layout/MasterDashboardLayout"));
const PlatformOverview = lazy(() => import("./components/master-dashboard/overview/PlatformOverview"));
const TenantList = lazy(() => import("./components/master-dashboard/tenants/TenantList"));
const TenantDetails = lazy(() => import("./components/master-dashboard/tenants/TenantDetails"));
const TenantCreateWizard = lazy(() => import("./components/master-dashboard/tenants/TenantCreateWizard"));

// User management components
const UserDirectory = lazy(() => import("./components/master-dashboard/users/UserDirectory"));
const InviteUserForm = lazy(() => import("./components/master-dashboard/users/InviteUserForm"));

// Authentication components
const InvitationAcceptance = lazy(() => import("./components/auth/InvitationAcceptance"));

// Review flow pages
const ReviewFormPage = lazy(() => import("./pages/ReviewFormPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const FeedbackThankYouPage = lazy(() => import("./pages/FeedbackThankYouPage"));
const ReviewThankYouPage = lazy(() => import("./pages/ReviewThankYouPage"));

const queryClient = new QueryClient();

const RouterContent = () => {
  const { ProgressBar } = useRouteProgress();
  const reduced = useReducedMotion();

  return (
    <>
      <ProgressBar />
      <Suspense fallback={<LoadingSpinner size={reduced ? "md" : "lg"} className="min-h-screen" />}>
        <Routes>
          {/* Login page - default route */}
          <Route path="/" element={<Login />} />
          
          {/* Master Dashboard routes - super admin only */}
          <Route path="/master" element={
            <ProtectedRoute requiredRole="super_admin">
              <MasterDashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PlatformOverview />} />
            <Route path="tenants" element={<TenantList />} />
            <Route path="tenants/new" element={<TenantCreateWizard />} />
            <Route path="tenants/:tenantId" element={<TenantDetails />} />
            <Route path="tenants/:tenantId/edit" element={<div>Edit Tenant (Coming Soon)</div>} />
            <Route path="users" element={<UserDirectory />} />
            <Route path="users/invite" element={<InviteUserForm />} />
            <Route path="system" element={<div>System Administration (Coming Soon)</div>} />
            <Route path="analytics" element={<div>Analytics (Coming Soon)</div>} />
            <Route path="audit" element={<div>Audit Logs (Coming Soon)</div>} />
          </Route>
          
          {/* Dashboard routes - protected (managers only) */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="tenant_admin">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="reviews" element={<DashboardReviews />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invitation" element={<InvitationAcceptance />} />
          
          {/* Public customer review form */}
          <Route path="/review" element={<ReviewFormPage />} />
          <Route path="/review/feedback" element={<FeedbackPage />} />
          <Route path="/review/feedback-thank-you" element={<FeedbackThankYouPage />} />
          <Route path="/review/thank-you" element={<ReviewThankYouPage />} />
          
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
        <TenantProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/">
            <RouterContent />
          </BrowserRouter>
        </TenantProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
