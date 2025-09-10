import { toast } from '@/hooks/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

export class ErrorHandler {
  /**
   * Handle service errors with consistent user feedback
   */
  static handleServiceError(error: any, context: string = 'Unknown'): AppError {
    const timestamp = new Date().toISOString();
    
    // Extract error information
    let code = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred';
    let details = error;

    if (error?.code) {
      code = error.code;
    } else if (error?.name) {
      code = error.name;
    }

    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Categorize and provide user-friendly messages
    const userFriendlyMessage = this.getUserFriendlyMessage(code, message, context);

    // Log error for debugging
    console.error(`[${context}] Error:`, {
      code,
      message,
      details,
      timestamp,
    });

    // Show user-friendly toast
    toast({
      title: "Error",
      description: userFriendlyMessage,
      variant: "destructive",
    });

    return {
      code,
      message: userFriendlyMessage,
      details,
      timestamp,
    };
  }

  /**
   * Get user-friendly error messages
   */
  private static getUserFriendlyMessage(code: string, message: string, context: string): string {
    // Network errors
    if (code.includes('network') || code.includes('fetch') || code.includes('NETWORK_ERROR')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Timeout errors
    if (code.includes('timeout') || code.includes('TIMEOUT')) {
      return 'Request timed out. Please try again.';
    }

    // Rate limiting
    if (code.includes('rate') || code.includes('limit') || code.includes('RATE_LIMIT')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Authentication errors
    if (code.includes('auth') || code.includes('unauthorized') || code.includes('401')) {
      return 'Authentication failed. Please log in again.';
    }

    // Permission errors
    if (code.includes('permission') || code.includes('forbidden') || code.includes('403')) {
      return 'You do not have permission to perform this action.';
    }

    // Not found errors
    if (code.includes('not_found') || code.includes('404')) {
      return 'The requested resource was not found.';
    }

    // Validation errors
    if (code.includes('validation') || code.includes('invalid') || code.includes('VALIDATION_ERROR')) {
      return 'Please check your input and try again.';
    }

    // Database errors
    if (code.includes('database') || code.includes('db') || code.includes('DATABASE_ERROR')) {
      return 'Database error. Please try again in a moment.';
    }

    // RLS policy errors
    if (code.includes('RLS') || code.includes('row-level security') || code.includes('policy')) {
      return 'Access denied. Please contact support if this issue persists.';
    }

    // Supabase configuration errors
    if (code.includes('Supabase') || code.includes('configuration') || code.includes('CONFIG_ERROR')) {
      return 'System configuration error. Please contact support.';
    }

    // Context-specific messages
    switch (context) {
      case 'ReviewFormPage':
        return 'Failed to submit review. Please try again.';
      case 'Dashboard':
        return 'Failed to load dashboard data. Please refresh the page.';
      case 'MasterDashboard':
        return 'Failed to load platform data. Please try again.';
      case 'Authentication':
        return 'Authentication failed. Please check your credentials.';
      case 'UserManagement':
        return 'Failed to manage user. Please try again.';
      case 'TenantManagement':
        return 'Failed to manage tenant. Please try again.';
      default:
        return message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Handle async operations with error catching
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: string = 'Unknown',
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleServiceError(error, context);
      return fallback;
    }
  }

  /**
   * Handle form submission errors
   */
  static handleFormError(error: any, formName: string): void {
    const context = `Form: ${formName}`;
    this.handleServiceError(error, context);
  }

  /**
   * Handle API errors
   */
  static handleApiError(error: any, endpoint: string): void {
    const context = `API: ${endpoint}`;
    this.handleServiceError(error, context);
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: any, operation: string): void {
    const context = `Database: ${operation}`;
    this.handleServiceError(error, context);
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: any, action: string): void {
    const context = `Auth: ${action}`;
    this.handleServiceError(error, context);
  }

  /**
   * Show success message
   */
  static showSuccess(message: string, title: string = 'Success'): void {
    toast({
      title,
      description: message,
    });
  }

  /**
   * Show warning message
   */
  static showWarning(message: string, title: string = 'Warning'): void {
    toast({
      title,
      description: message,
      variant: 'destructive',
    });
  }

  /**
   * Show info message
   */
  static showInfo(message: string, title: string = 'Info'): void {
    toast({
      title,
      description: message,
    });
  }
}

// Convenience functions for common error handling patterns
export const handleError = ErrorHandler.handleServiceError;
export const handleAsync = ErrorHandler.handleAsync;
export const showSuccess = ErrorHandler.showSuccess;
export const showWarning = ErrorHandler.showWarning;
export const showInfo = ErrorHandler.showInfo;