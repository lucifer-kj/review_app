import { Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MasterSidebar } from "./MasterSidebar";
import { MasterHeader } from "./MasterHeader";

export default function MasterDashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crux_master_sidebar');
    if (stored === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('crux_master_sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className={cn(
      "min-h-screen bg-background transition-[padding] duration-200",
      collapsed ? "lg:pl-16" : "lg:pl-64"
    )}>
      {/* Fixed Sidebar */}
      <MasterSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {/* Main Content fills remaining width */}
      <div className="flex flex-col min-h-screen">
        <MasterHeader />
        <main className="flex-1 p-6">
          <Suspense fallback={<LoadingSpinner size="md" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
