export const handleError = (error: unknown, context: string): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { tags: { context } });
  }
  
  return errorMessage;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }
  return false;
};

export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('auth') || 
           error.message.includes('unauthorized') ||
           error.message.includes('forbidden');
  }
  return false;
};
