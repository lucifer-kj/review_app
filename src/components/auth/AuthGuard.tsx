import { ReactNode, useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard component ensures that the auth store is fully initialized
 * before rendering protected routes. This prevents premature redirects
 * during the initialization process.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const loading = useAuthStore(state => state.loading);
  const error = useAuthStore(state => state.error);

  useEffect(() => {
    // Check if store is initialized
    const checkInitialization = () => {
      // Store is considered initialized if:
      // 1. Not loading AND
      // 2. Either has a user (authenticated) OR has an error (not authenticated but initialized)
      const storeInitialized = !loading && (useAuthStore.getState().user || error);
      
      if (storeInitialized) {
        console.log('🔐 AuthGuard: Store initialization complete');
        setIsInitialized(true);
      } else {
        console.log('🔐 AuthGuard: Waiting for store initialization...');
        // Check again in 100ms
        setTimeout(checkInitialization, 100);
      }
    };

    checkInitialization();
  }, [loading, error]);

  // Show loading spinner while waiting for initialization
  if (!isInitialized) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return <>{children}</>;
};
