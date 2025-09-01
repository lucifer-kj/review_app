import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} loaded in ${loadTime}ms`);
    }

    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to analytics service
      // analytics.track('component_load_time', {
      //   component: componentName,
      //   loadTime,
      //   timestamp: new Date().toISOString()
      // });
    }
  }, [componentName]);

  const measureRender = (callback: () => void) => {
    const renderStart = Date.now();
    callback();
    const renderTime = Date.now() - renderStart;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} render took ${renderTime}ms`);
    }
  };

  const getMemoryUsage = (): number | undefined => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  };

  return {
    measureRender,
    getMemoryUsage,
    getMetrics: (): PerformanceMetrics => ({
      loadTime: Date.now() - startTime.current,
      renderTime: Date.now() - renderStartTime.current,
      memoryUsage: getMemoryUsage()
    })
  };
};
