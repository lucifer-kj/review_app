import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProductionErrorBoundary } from "./components/ProductionErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardReviews = lazy(() => import("./pages/DashboardReviews"));
const DashboardInvoices = lazy(() => import("./pages/DashboardInvoices"));
const DashboardSettings = lazy(() => import("./pages/DashboardSettings"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ProductionErrorBoundary>
    <ErrorBoundary>
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
                <Route path="/review" element={<Index />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ProductionErrorBoundary>
);

export default App;
