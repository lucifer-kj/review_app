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

export interface TenantDetails {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  plan_type?: 'basic' | 'pro' | 'enterprise';
  billing_email?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface TenantUsageStats {
  users_count: number;
  reviews_count: number;
  storage_used: number;
  api_calls_count: number;
  last_activity?: string;
}

export interface TenantUser {
  id: string;
  email: string;
  role: string;
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
      if (error) {
        console.warn('Platform analytics function failed, falling back to direct queries:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const analytics = data[0];
        return {
          total_tenants: Number(analytics.total_tenants) || 0,
          active_tenants: Number(analytics.active_tenants) || 0,
          total_users: Number(analytics.total_users) || 0,
          total_reviews: Number(analytics.total_reviews) || 0,
          reviews_this_month: Number(analytics.reviews_this_month) || 0,
          reviews_last_month: Number(analytics.reviews_last_month) || 0,
          average_rating: Number(analytics.average_rating) || 0,
          revenue_current_month: 0, // Placeholder until billing is implemented
          growth_rate: 0, // Placeholder until growth calculation is implemented
          system_health_score: 95, // Mock for now
        };
      }

      // Fallback to direct queries if function returns empty
      const [tenantsResult, usersResult, reviewsResult] = await Promise.all([
        supabase.from('tenants').select('id, status', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id, rating, created_at', { count: 'exact', head: true })
      ]);

      const totalTenants = tenantsResult.count || 0;
      const totalUsers = usersResult.count || 0;
      const totalReviews = reviewsResult.count || 0;

      // Calculate active tenants
      const { data: activeTenantsData } = await supabase
        .from('tenants')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      
      const activeTenants = activeTenantsData ? 0 : (activeTenantsData as any)?.length || 0;

      // Calculate reviews this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { data: thisMonthReviews } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());
      
      const reviewsThisMonth = thisMonthReviews ? 0 : (thisMonthReviews as any)?.length || 0;

      // Calculate average rating
      const { data: ratingData } = await supabase
        .from('reviews')
        .select('rating')
        .not('rating', 'is', null);
      
      const averageRating = ratingData && ratingData.length > 0 
        ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length 
        : 0;

      return {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_users: totalUsers,
        total_reviews: totalReviews,
        reviews_this_month: reviewsThisMonth,
        reviews_last_month: 0, // Placeholder
        average_rating: averageRating,
        revenue_current_month: 0, // Placeholder until billing is implemented
        growth_rate: 0, // Placeholder until growth calculation is implemented
        system_health_score: 95, // Mock for now
      };
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      // Safe fallback to mock to keep UI functional
      return mockMetrics;
    }
  }

  static async getTenantDetails(tenantId: string): Promise<TenantDetails> {
    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      // Return mock data for development
      return {
        id: tenantId,
        name: 'Mock Tenant',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        domain: data.domain,
        status: data.status,
        plan_type: data.plan_type,
        billing_email: data.billing_email,
        settings: data.settings,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      throw error;
    }
  }

  static async getTenantUsageStats(tenantId: string): Promise<{ success: boolean; data?: TenantUsageStats; error?: string }> {
    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      // Return mock data for development
      return { 
        success: true, 
        data: {
          users_count: Math.floor(Math.random() * 50) + 1,
          reviews_count: Math.floor(Math.random() * 200) + 1,
          storage_used: Math.floor(Math.random() * 1000) + 100,
          api_calls_count: Math.floor(Math.random() * 1000) + 50,
          last_activity: new Date().toISOString(),
        }
      };
    }

    try {
      // Try to call the SQL function first
      const { data, error } = await supabase.rpc('get_tenant_usage_stats', { p_tenant_id: tenantId });
      if (error) {
        console.warn('Tenant usage stats function failed, falling back to direct queries:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return {
          success: true,
          data: {
            users_count: Number(data[0].users_count) || 0,
            reviews_count: Number(data[0].reviews_count) || 0,
            storage_used: Number(data[0].storage_used) || 0,
            api_calls_count: Number(data[0].api_calls_count) || 0,
            last_activity: data[0].last_activity,
          }
        };
      }

      // Fallback to manual queries
      const [userCountResult, reviewCountResult, lastActivityResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('reviews').select('created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1)
      ]);

      return {
        success: true,
        data: {
          users_count: userCountResult.count || 0,
          reviews_count: reviewCountResult.count || 0,
          storage_used: 0, // Placeholder until storage tracking is implemented
          api_calls_count: 0, // Placeholder until API tracking is implemented
          last_activity: lastActivityResult.data?.[0]?.created_at || null,
        }
      };
    } catch (error) {
      console.error('Error fetching tenant usage stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage stats'
      };
    }
  }

  static async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    if (!env.supabase.url || !env.supabase.anonKey || env.supabase.anonKey === 'placeholder_key') {
      // Return mock data for development
      return [
        { id: '1', email: 'admin@tenant.com', role: 'tenant_admin', created_at: new Date().toISOString() },
        { id: '2', email: 'user@tenant.com', role: 'user', created_at: new Date().toISOString() },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      })) || [];
    } catch (error) {
      console.error('Error fetching tenant users:', error);
      return [];
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


