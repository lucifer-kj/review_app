import { supabase } from '@/integrations/supabase/client';
import { env } from '@/utils/env';

export interface PlatformMetrics {
  total_tenants: number;
  total_users: number;
  total_reviews: number;
  active_tenants: number;
  revenue_current_month?: number;
  growth_rate?: number;
  reviews_this_month?: number;
  reviews_last_month?: number;
  average_rating?: number;
  system_health_score?: number;
}

export interface TenantFilters {
  search?: string;
  status?: 'active' | 'suspended' | 'all';
  page?: number;
  pageSize?: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface TenantListResponse {
  items: TenantListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const mockMetrics: PlatformMetrics = {
  total_tenants: 25,
  active_tenants: 23,
  total_users: 156,
  total_reviews: 1247,
  revenue_current_month: 3200,
  growth_rate: 12.5,
  reviews_this_month: 89,
  reviews_last_month: 76,
  average_rating: 4.3,
  system_health_score: 94,
};

const mockTenants: TenantListItem[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `mock-tenant-${i + 1}`,
  name: `Tenant ${i + 1}`,
  status: i % 9 === 0 ? 'suspended' : 'active',
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

export class MasterDashboardService {
  static async getPlatformMetrics(): Promise<PlatformMetrics> {
    // Fallback to mock when Supabase is not configured
    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      return mockMetrics;
    }

    try {
      // Try to call the SQL function first
      const { data, error } = await supabase.rpc('get_platform_analytics');
      if (error) throw error;

      // Return the real data from the database
      return {
        total_tenants: data?.total_tenants ?? 0,
        active_tenants: data?.active_tenants ?? 0,
        total_users: data?.total_users ?? 0,
        total_reviews: data?.total_reviews ?? 0,
        reviews_this_month: data?.reviews_this_month ?? 0,
        reviews_last_month: data?.reviews_last_month ?? 0,
        average_rating: data?.average_rating ?? 0,
        revenue_current_month: 0, // Placeholder until billing is implemented
        growth_rate: 0, // Placeholder until growth calculation is implemented
        system_health_score: 95, // Mock for now
      };
    } catch (_e) {
      // Safe fallback to mock to keep UI functional
      return mockMetrics;
    }
  }

  static async getTenantUsageStats(tenantId: string): Promise<{ users: number; reviews: number }> {
    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      // Return mock data for development
      return { users: Math.floor(Math.random() * 50) + 1, reviews: Math.floor(Math.random() * 200) + 1 };
    }

    try {
      // Get user count for this tenant
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (userError) throw userError;

      // Get review count for this tenant
      const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (reviewError) throw reviewError;

      return {
        users: userCount || 0,
        reviews: reviewCount || 0,
      };
    } catch (error) {
      console.error('Error fetching tenant usage stats:', error);
      // Return zeros on error
      return { users: 0, reviews: 0 };
    }
  }

  static async getTenantList(filters: TenantFilters = {}): Promise<TenantListResponse> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      const filtered = mockTenants.filter(t =>
        (filters.status && filters.status !== 'all' ? t.status === filters.status : true) &&
        (filters.search ? t.name.toLowerCase().includes(filters.search.toLowerCase()) : true)
      );
      return {
        items: filtered.slice(from, to + 1),
        total: filtered.length,
        page,
        pageSize,
      };
    }

    try {
      let query = supabase.from('tenants').select('*', { count: 'exact' });
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });
      if (error) throw error;
      const items: TenantListItem[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name ?? row.company_name ?? 'Tenant',
        status: (row.status as 'active' | 'suspended') ?? 'active',
        created_at: row.created_at,
      }));
      return { items, total: count ?? items.length, page, pageSize };
    } catch (_e) {
      // Fallback to mock
      return {
        items: mockTenants.slice(from, to + 1),
        total: mockTenants.length,
        page,
        pageSize,
      };
    }
  }
}


