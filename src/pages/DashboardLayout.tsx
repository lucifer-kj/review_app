import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Building2 } from "lucide-react";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ShareButton = lazy(() => import("@/components/ShareButton").then(module => ({ default: module.ShareButton })));

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-semibold text-base">Alpha Business Designs</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Suspense fallback={<LoadingSpinner />}>
                <ShareButton />
              </Suspense>
            </div>
          </header>
          <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;