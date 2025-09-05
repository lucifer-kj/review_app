import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MasterSidebar } from "./MasterSidebar";
import { MasterHeader } from "./MasterHeader";

export default function MasterDashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <MasterSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <MasterHeader />
          <main className="flex-1 p-6">
            <Suspense fallback={<LoadingSpinner size="md" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
