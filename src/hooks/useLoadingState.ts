import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export interface UseLoadingStateReturn<T> {
  loadingState: LoadingState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: T) => void;
  reset: () => void;
  execute: (operation: () => Promise<T>) => Promise<T | null>;
}

export function useLoadingState<T = any>(initialData: T | null = null): UseLoadingStateReturn<T> {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData,
  });

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting to load
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const setData = useCallback((data: T) => {
    setLoadingState(prev => ({
      ...prev,
      data,
      error: null,
      isLoading: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      error: null,
      data: initialData,
    });
  }, [initialData]);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      return null;
    }
  }, [setLoading, setData, setError]);

  return {
    loadingState,
    setLoading,
    setError,
    setData,
    reset,
    execute,
  };
}

// Convenience hook for simple loading states
export function useSimpleLoading(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.error('Operation failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    setLoading,
    execute,
  };
}
