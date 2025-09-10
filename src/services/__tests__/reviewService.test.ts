import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReviewService } from '../reviewService';
import { supabase } from '@/integrations/supabase/client';
import { AppError } from '@/utils/errorHandler';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ReviewService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getReviews', () => {
    it('should get reviews for current tenant when no tenantId provided', async () => {
      const mockReviews = [
        {
          id: '1',
          customer_name: 'John Doe',
          rating: 5,
          review_text: 'Great service!',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 'test-tenant-id', error: null });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockReviews,
        error: null
      });

      (supabase as any).rpc = mockSupabase.rpc;

      const result = await ReviewService.getReviews();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_current_tenant_id');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_reviews_for_dashboard', {
        p_tenant_id: 'test-tenant-id'
      });
    });

    it('should get reviews for specific tenant when tenantId provided', async () => {
      const mockReviews = [
        {
          id: '1',
          customer_name: 'Jane Doe',
          rating: 4,
          review_text: 'Good experience',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockReviews,
        error: null
      });

      (supabase as any).rpc = mockSupabase.rpc;

      const result = await ReviewService.getReviews('specific-tenant-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_reviews_for_dashboard', {
        p_tenant_id: 'specific-tenant-id'
      });
      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('get_current_tenant_id');
    });

    it('should handle tenant context error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'No tenant context' }
      });

      (supabase as any).rpc = mockSupabase.rpc;

      const result = await ReviewService.getReviews();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.message).toContain('No tenant context available');
    });

    it('should fallback to direct query when dashboard function fails', async () => {
      const mockReviews = [
        {
          id: '1',
          customer_name: 'Fallback User',
          rating: 3,
          review_text: 'Fallback review',
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: 'test-tenant-id', error: null });
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Function not found' }
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockReviews,
          error: null
        })
      });

      (supabase as any).rpc = mockSupabase.rpc;
      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.getReviews();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReviews);
      expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    });
  });

  describe('createReview', () => {
    const mockReviewData = {
      customer_name: 'New Customer',
      customer_email: 'new@example.com',
      rating: 5,
      review_text: 'Excellent service!',
      tenant_id: 'test-tenant-id',
      user_id: 'test-user-id',
    };

    it('should create a review successfully', async () => {
      const mockCreatedReview = {
        id: 'new-review-id',
        ...mockReviewData,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [mockCreatedReview],
            error: null
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.createReview(mockReviewData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedReview);
      expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    });

    it('should handle creation error', async () => {
      const mockError = { message: 'Database error' };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.createReview(mockReviewData);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AppError);
    });
  });

  describe('updateReview', () => {
    const mockUpdateData = {
      rating: 4,
      review_text: 'Updated review text',
    };

    it('should update a review successfully', async () => {
      const mockUpdatedReview = {
        id: 'review-id',
        customer_name: 'Test Customer',
        rating: 4,
        review_text: 'Updated review text',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockUpdatedReview],
              error: null
            })
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.updateReview('review-id', mockUpdateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedReview);
    });

    it('should handle update error', async () => {
      const mockError = { message: 'Update failed' };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.updateReview('review-id', mockUpdateData);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AppError);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.deleteReview('review-id');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    });

    it('should handle deletion error', async () => {
      const mockError = { message: 'Deletion failed' };

      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: mockError
          })
        })
      });

      (supabase as any).from = mockSupabase.from;

      const result = await ReviewService.deleteReview('review-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AppError);
    });
  });
});
