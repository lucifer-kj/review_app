import { ReactNode } from 'react';
import { MasterSidebar } from './MasterSidebar';
import { MasterHeader } from './MasterHeader';

interface MasterDashboardLayoutProps {
  children: ReactNode;
}

export function MasterDashboardLayout({ children }: MasterDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <MasterSidebar />
      
      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <MasterHeader />
        
        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
