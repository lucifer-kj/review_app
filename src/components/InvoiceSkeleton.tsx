import { Skeleton } from "@/components/ui/skeleton";

export const InvoiceSkeleton = () => (
  <div className="space-y-3 p-4 border rounded-lg">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/4" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

export const InvoiceListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <InvoiceSkeleton key={index} />
    ))}
  </div>
);
