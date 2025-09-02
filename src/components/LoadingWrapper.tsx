import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Skeleton } from "./ui/skeleton";

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: boolean;
  skeletonCount?: number;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  children,
  fallback,
  skeleton = false,
  skeletonCount = 3,
  error,
  onRetry,
  className = ""
}) => {
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">
            Something went wrong
          </div>
          <div className="text-muted-foreground text-sm">
            {error}
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (skeleton) {
      return (
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
};

// Specialized loading wrappers for common use cases
export const CardLoadingWrapper: React.FC<Omit<LoadingWrapperProps, 'skeleton'> & {
  cardCount?: number;
}> = ({ cardCount = 3, ...props }) => (
  <LoadingWrapper
    {...props}
    skeleton={true}
    skeletonCount={cardCount}
    fallback={
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    }
  />
);

export const TableLoadingWrapper: React.FC<Omit<LoadingWrapperProps, 'skeleton'> & {
  rowCount?: number;
  columnCount?: number;
}> = ({ rowCount = 5, columnCount = 4, ...props }) => (
  <LoadingWrapper
    {...props}
    skeleton={true}
    skeletonCount={rowCount}
    fallback={
      <div className="space-y-2">
        {/* Header skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: columnCount }).map((_, index) => (
            <Skeleton key={index} className="h-8 flex-1" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-12 flex-1" />
            ))}
          </div>
        ))}
      </div>
    }
  />
);

export const FormLoadingWrapper: React.FC<Omit<LoadingWrapperProps, 'skeleton'> & {
  fieldCount?: number;
}> = ({ fieldCount = 4, ...props }) => (
  <LoadingWrapper
    {...props}
    skeleton={true}
    skeletonCount={fieldCount}
    fallback={
      <div className="space-y-4">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    }
  />
);
