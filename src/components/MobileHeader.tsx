import { useState, Suspense, lazy } from "react";
import { Building2, Menu, X, Home, FileText, Settings, User, Copy, Share2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load the share and copy components
const ShareButton = lazy(() => import("@/components/ShareButton").then(module => ({ default: module.ShareButton })));
const CopyLinkButton = lazy(() => import("@/components/CopyLinkButton").then(module => ({ default: module.CopyLinkButton })));

interface MobileHeaderProps {
  onLogout: () => void;
  tenantId?: string;
}

export const MobileHeader = ({ onLogout, tenantId }: MobileHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Reviews", href: "/dashboard/reviews", icon: FileText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur px-3 shadow-sm z-50">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 hover:bg-muted">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="/web/icons8-logo-ios-17-outlined-32.png" 
                    alt="Crux Logo" 
                    className="h-8 w-8"
                  />
                  <div>
                    <span className="font-bold text-xl">Crux</span>
                    <p className="text-xs text-muted-foreground">Powered by Alpha Business Digital</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-lg font-bold">CX</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold">Account</p>
                    <p className="text-sm text-muted-foreground">Business Owner</p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 p-6">
                <div className="space-y-3">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </nav>
              
              {/* Share and Copy Section */}
              <div className="p-6 border-t border-b">
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground mb-4">Share & Copy</div>
                  <Suspense fallback={<LoadingSpinner />}>
                    <div className="space-y-3">
                      <CopyLinkButton tenantId={tenantId} />
                      <ShareButton tenantId={tenantId} />
                    </div>
                  </Suspense>
                </div>
              </div>
              
              <div className="p-6 border-t">
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <User className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
          
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img 
            src="/web/icons8-logo-ios-17-outlined-32.png" 
            alt="Crux Logo" 
            className="h-6 w-6"
          />
          <span className="font-bold text-base">Crux</span>
        </button>
        </div>
        
        <div className="w-6 h-6" />
      </header>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-50 shadow-lg">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex flex-col items-center py-3 px-4 text-xs font-medium transition-all duration-200 min-w-0 flex-1",
                  isActive(item.href)
                    ? "text-primary bg-primary/10 rounded-xl"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
                )}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
