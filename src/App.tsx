import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardReviews = lazy(() => import("./pages/DashboardReviews"));
const DashboardInvoices = lazy(() => import("./pages/DashboardInvoices"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Review flow pages
const ReviewFormPage = lazy(() => import("./pages/ReviewFormPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const FeedbackThankYouPage = lazy(() => import("./pages/FeedbackThankYouPage"));
const ReviewThankYouPage = lazy(() => import("./pages/ReviewThankYouPage"));
const DynamicFormDemo = lazy(() => import("./pages/DynamicFormDemo"));
const TemplateParserDemo = lazy(() => import("./pages/TemplateParserDemo"));

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
            <Routes>
              {/* Dashboard routes - protected */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="reviews" element={<DashboardReviews />} />
                <Route path="invoices" element={<DashboardInvoices />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>
              
              {/* Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
                              {/* Public customer review form */}
                <Route path="/review" element={<ReviewFormPage />} />
                <Route path="/review/feedback" element={<FeedbackPage />} />
                <Route path="/review/feedback-thank-you" element={<FeedbackThankYouPage />} />
                <Route path="/review/thank-you" element={<ReviewThankYouPage />} />
                
                {/* Dynamic Form Demo */}
                <Route path="/dynamic-form-demo" element={<DynamicFormDemo />} />
                
                {/* Template Parser Demo */}
                <Route path="/template-parser-demo" element={<TemplateParserDemo />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
