import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => {
  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  } as const;

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span
        className={cn("rounded-full bg-current animate-bounce", dotSizes[size])}
        style={{ animationDelay: "0ms" }}
      />
      <span
        className={cn("rounded-full bg-current animate-bounce", dotSizes[size])}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={cn("rounded-full bg-current animate-bounce", dotSizes[size])}
        style={{ animationDelay: "300ms" }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
