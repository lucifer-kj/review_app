import { Skeleton } from "@/components/ui/skeleton";

export const ReviewSkeleton = () => (
  <div className="space-y-3 p-4 border rounded-lg">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-4 w-1/2" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-4" />
    </div>
  </div>
);

export const ReviewListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <ReviewSkeleton key={index} />
    ))}
  </div>
);
