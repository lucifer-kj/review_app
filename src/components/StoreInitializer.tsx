/**
 * Store Initializer Component
 * Initializes Zustand stores once when the app starts
 * Prevents infinite loops by running only once
 */

import { useEffect, useRef } from 'react';
import { useAuthStore, useTenantStore } from '@/stores';

export const StoreInitializer = () => {
  const initialized = useRef(false);
  const { initialize: initAuth } = useAuthStore();
  const { initialize: initTenant } = useTenantStore();

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    initialized.current = true;

    const initializeStores = async () => {
      try {
        console.log('Initializing stores...');
        await Promise.all([
          initAuth(),
          initTenant(),
        ]);
        console.log('Stores initialized successfully');
      } catch (error) {
        console.error('Failed to initialize stores:', error);
      }
    };

    initializeStores();
  }, [initAuth, initTenant]);

  // This component doesn't render anything
  return null;
};
