import { useQuery } from '@tanstack/react-query';
import { ReviewService } from '@/services/reviewService';

type Params = {
  search?: string;
  rating?: 'all' | 'high' | 'low';
  page?: number;
  pageSize?: number;
};

export function useReviewsQuery({ search = '', rating = 'all', page = 1, pageSize = 20 }: Params) {
  return useQuery({
    queryKey: ['reviews', { search, rating, page, pageSize }],
    queryFn: async () => {
      const res = await ReviewService.getReviews();
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch reviews');
      const filtered = res.data.filter((r) => {
        const matchesSearch = !search || 
          r.customer_name.toLowerCase().includes(search.toLowerCase()) || 
          (r.customer_phone && r.customer_phone.toLowerCase().includes(search.toLowerCase()));
        const matchesRating = rating === 'all' || (rating === 'high' && r.rating >= 4) || (rating === 'low' && r.rating < 4);
        return matchesSearch && matchesRating;
      });
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return { rows: filtered.slice(start, end), total: filtered.length };
    },
    staleTime: 30_000,
    keepPreviousData: true,
  });
}


