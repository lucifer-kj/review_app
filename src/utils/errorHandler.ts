import { logger } from './logger';

export interface ErrorContext {
  service?: string;
  operation?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.isOperational = isOperational;

    // Log the error
    logger.error('AppError created', {
      message,
      code,
      context,
      stack: this.stack
    });
  }
}

export function handleServiceError(
  error: unknown,
  service: string,
  operation: string,
  context: ErrorContext = {}
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const errorCode = error instanceof Error && 'code' in error ? 
    (error as any).code : 'SERVICE_ERROR';

  return new AppError(
    errorMessage,
    errorCode,
    { ...context, service, operation },
    false
  );
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }
  if (error instanceof Error && 'code' in error) {
    return (error as any).code;
  }
  return 'UNKNOWN_ERROR';
}