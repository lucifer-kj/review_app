/**
 * Invitation Error Handler Service
 * Centralized error handling for invitation-related operations
 */

export interface InvitationError {
  code: string;
  message: string;
  details?: any;
  userMessage: string;
  retryable: boolean;
}

export class InvitationErrorHandler {
  /**
   * Handle invitation creation errors
   */
  static handleInvitationError(error: any): InvitationError {
    console.error('Invitation error:', error);

    // Database errors
    if (error.code === '23505') {
      return {
        code: 'DUPLICATE_EMAIL',
        message: 'User already exists with this email',
        userMessage: 'A user with this email address already exists. Please use a different email.',
        retryable: false,
        details: error
      };
    }

    if (error.code === '23503') {
      return {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Invalid tenant reference',
        userMessage: 'The selected tenant is invalid. Please refresh the page and try again.',
        retryable: true,
        details: error
      };
    }

    if (error.code === '42501') {
      return {
        code: 'INSUFFICIENT_PRIVILEGE',
        message: 'Insufficient privileges',
        userMessage: 'You do not have permission to create invitations. Please contact your administrator.',
        retryable: false,
        details: error
      };
    }

    // Network errors
    if (error.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        retryable: true,
        details: error
      };
    }

    // Supabase Auth errors
    if (error.message?.includes('Invalid API key')) {
      return {
        code: 'INVALID_API_KEY',
        message: 'Invalid Supabase API key',
        userMessage: 'Server configuration error. Please contact support.',
        retryable: false,
        details: error
      };
    }

    if (error.message?.includes('getUserByEmail is not a function')) {
      return {
        code: 'ADMIN_CLIENT_ERROR',
        message: 'Admin client configuration error',
        userMessage: 'Server configuration error. Please contact support.',
        retryable: false,
        details: error
      };
    }

    // Generic errors
    if (error.message?.includes('User already exists')) {
      return {
        code: 'USER_EXISTS',
        message: error.message,
        userMessage: 'A user with this email address already exists.',
        retryable: false,
        details: error
      };
    }

    if (error.message?.includes('Valid invitation already exists')) {
      return {
        code: 'INVITATION_EXISTS',
        message: error.message,
        userMessage: 'An invitation for this email is already pending.',
        retryable: false,
        details: error
      };
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      retryable: true,
      details: error
    };
  }

  /**
   * Handle email sending errors
   */
  static handleEmailError(error: any): InvitationError {
    console.error('Email sending error:', error);

    if (error.message?.includes('Invalid email')) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Invalid email address',
        userMessage: 'Please enter a valid email address.',
        retryable: false,
        details: error
      };
    }

    if (error.message?.includes('Rate limit')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Email rate limit exceeded',
        userMessage: 'Too many emails sent. Please wait a few minutes before trying again.',
        retryable: true,
        details: error
      };
    }

    if (error.message?.includes('Email service unavailable')) {
      return {
        code: 'EMAIL_SERVICE_DOWN',
        message: 'Email service unavailable',
        userMessage: 'Email service is temporarily unavailable. The invitation was created but the email could not be sent. You can resend it later.',
        retryable: true,
        details: error
      };
    }

    return {
      code: 'EMAIL_ERROR',
      message: error.message || 'Email sending failed',
      userMessage: 'The invitation was created but the email could not be sent. You can resend it later.',
      retryable: true,
      details: error
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    const invitationError = this.handleInvitationError(error);
    return invitationError.userMessage;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    const invitationError = this.handleInvitationError(error);
    return invitationError.retryable;
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context: string): void {
    const invitationError = this.handleInvitationError(error);
    console.error(`[${context}] Invitation Error:`, {
      code: invitationError.code,
      message: invitationError.message,
      retryable: invitationError.retryable,
      details: invitationError.details
    });
  }
}
