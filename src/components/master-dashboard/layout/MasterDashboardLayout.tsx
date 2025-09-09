import { Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MasterSidebar } from "./MasterSidebar";
import { MasterHeader } from "./MasterHeader";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function MasterDashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    const stored = localStorage.getItem('crux_master_sidebar');
    if (stored === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('crux_master_sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <MasterSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {/* Main Content with responsive padding */}
      <div className={cn(
        "flex flex-col min-h-screen transition-[margin-left] duration-200",
        // Mobile: no margin, full width
        isMobile ? "ml-0" : 
        // Tablet: collapsed sidebar margin
        isTablet ? (collapsed ? "ml-16" : "ml-64") :
        // Desktop: collapsed sidebar margin
        collapsed ? "ml-16" : "ml-64"
      )}>
        <MasterHeader />
        <main className={cn(
          "flex-1 transition-all duration-200",
          // Mobile: minimal padding
          isMobile ? "p-3 sm:p-4" :
          // Tablet: medium padding
          isTablet ? "p-4 lg:p-6" :
          // Desktop: full padding
          "p-6"
        )}>
          <Suspense fallback={<LoadingSpinner size="md" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
