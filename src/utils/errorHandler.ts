import { AuditLogService } from '@/services/auditLogService';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static async handleError(
    error: Error | unknown,
    context: ErrorContext = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log to audit system
    await AuditLogService.logEvent(
      AuditLogService.ACTIONS.SYSTEM_ERROR,
      {
        error_message: errorMessage,
        error_stack: errorStack,
        component: context.component,
        action: context.action,
        ...context.additionalData,
      },
      {
        user_id: context.userId,
        tenant_id: context.tenantId,
      }
    );

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context.component || 'Unknown'}:`, {
        error,
        context,
        stack: errorStack,
      });
    }
  }

  /**
   * Handle API errors with proper error messages
   */
  static handleApiError(error: any): string {
    if (error?.message) {
    return error.message;
  }
    
    if (error?.error_description) {
      return error.error_description;
    }
  
  if (typeof error === 'string') {
    return error;
  }
  
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Handle Supabase errors specifically
   */
  static handleSupabaseError(error: any): string {
    if (error?.message) {
      // Common Supabase error messages
      const message = error.message.toLowerCase();
      
      if (message.includes('permission denied')) {
        return 'You do not have permission to perform this action.';
      }
      
      if (message.includes('row level security')) {
        return 'Access denied. Please check your permissions.';
      }
      
      if (message.includes('foreign key')) {
        return 'Cannot perform this action due to related data constraints.';
      }
      
      if (message.includes('unique constraint')) {
        return 'This item already exists. Please use a different value.';
      }
      
      if (message.includes('not found')) {
        return 'The requested item was not found.';
      }
      
      return error.message;
    }
    
    return 'A database error occurred. Please try again.';
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: any): string {
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (error?.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    
    return 'A network error occurred. Please try again.';
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: any): string {
    if (error?.issues) {
      // Zod validation errors
      return error.issues.map((issue: any) => issue.message).join(', ');
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'Please check your input and try again.';
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    // Try different error handlers in order of specificity
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
      return this.handleNetworkError(error);
    }
    
    if (error?.issues) {
      return this.handleValidationError(error);
    }
    
    if (error?.message?.includes('supabase') || error?.code) {
      return this.handleSupabaseError(error);
    }
    
    if (error?.message) {
      return this.handleApiError(error);
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Retry mechanism for failed operations
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error | unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Log the retry attempt
        await this.handleError(error, {
          ...context,
          additionalData: {
            retry_attempt: attempt,
            max_retries: maxRetries,
          },
        });
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }

  /**
   * Safe async operation wrapper
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error, context);
      return fallback;
    }
  }

  /**
   * Safe sync operation wrapper
   */
  static safeSync<T>(
    operation: () => T,
    fallback: T,
    context?: ErrorContext
  ): T {
    try {
      return operation();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  const handleError = async (error: Error | unknown, context?: ErrorContext) => {
    await ErrorHandler.handleError(error, context);
  };

  const getUserFriendlyMessage = (error: any) => {
    return ErrorHandler.getUserFriendlyMessage(error);
  };

  return {
    handleError,
    getUserFriendlyMessage,
    safeAsync: ErrorHandler.safeAsync,
    safeSync: ErrorHandler.safeSync,
    withRetry: ErrorHandler.withRetry,
  };
}