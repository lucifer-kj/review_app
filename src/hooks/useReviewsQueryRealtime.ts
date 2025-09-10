import { useQuery } from '@tanstack/react-query';
import { ReviewService } from '@/services/reviewService';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useAuth } from './useAuth';

interface UseReviewsQueryOptions {
  search?: string;
  rating?: 'all' | '5' | '4' | '3' | '2' | '1';
  page?: number;
  enabled?: boolean;
}

export function useReviewsQueryRealtime({
  search = '',
  rating = 'all',
  page = 1,
  enabled = true
}: UseReviewsQueryOptions = {}) {
  const { tenant } = useAuth();

  const query = useQuery({
    queryKey: ['reviews', { search, rating, page, tenantId: tenant?.id }],
    queryFn: () => ReviewService.getReviews(tenant?.id),
    enabled: enabled && !!tenant?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute fallback
  });

  // Enable real-time updates
  useRealtimeSubscription({
    table: 'reviews',
    queryKey: ['reviews', { search, rating, page, tenantId: tenant?.id }],
    enabled: enabled && !!tenant?.id,
    tenantId: tenant?.id
  });

  return query;
}
