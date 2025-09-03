type AnalyticsPayload = Record<string, unknown>;

export function useAnalytics() {
  const track = (event: string, props?: AnalyticsPayload) => {
    try {
      // Google Analytics gtag if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, props || {});
      }
      // Fallback console in dev
      if (import.meta.env.DEV) {
        console.log('[analytics]', event, props || {});
      }
    } catch {
      // ignore
    }
  };

  return { track };
}


