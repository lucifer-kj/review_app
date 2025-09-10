import { Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MasterSidebar } from "./MasterSidebar";
import { MasterHeader } from "./MasterHeader";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function MasterDashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    const stored = localStorage.getItem('crux_master_sidebar');
    if (stored === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('crux_master_sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  // Close mobile menu when screen size changes
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <MasterSidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(v => !v)}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(v => !v)}
      />

      {/* Main Content with enhanced responsive design */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        // Mobile: no margin, full width with mobile menu support
        isMobile ? "ml-0" : 
        // Tablet: responsive margin based on collapsed state
        isTablet ? (collapsed ? "ml-16" : "ml-64") :
        // Desktop: responsive margin based on collapsed state
        collapsed ? "ml-16" : "ml-64"
      )}>
        <MasterHeader 
          onMobileMenuToggle={() => setMobileMenuOpen(v => !v)}
          mobileMenuOpen={mobileMenuOpen}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          // Mobile: minimal padding with safe areas
          isMobile ? "p-3 sm:p-4 pb-safe" :
          // Tablet: medium padding
          isTablet ? "p-4 lg:p-6" :
          // Desktop: full padding
          "p-6"
        )}>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="md" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}