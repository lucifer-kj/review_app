import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  column: string;
  ascending?: boolean;
}

export abstract class BaseService {
  protected static async handleSupabaseResponse<T>(
    response: { data: T | null; error: PostgrestError | null }
  ): Promise<ServiceResponse<T>> {
    if (response.error) {
      return {
        data: null,
        error: response.error.message,
        success: false,
      };
    }

    return {
      data: response.data,
      error: null,
      success: true,
    };
  }

  protected static async handleError(error: unknown, context: string): Promise<ServiceResponse<never>> {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    console.error(`[${context}] Error:`, error);
    
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }

  protected static validateId(id: string): boolean {
    return typeof id === 'string' && id.length > 0;
  }

  protected static validatePagination(params: PaginationParams): PaginationParams {
    return {
      page: Math.max(1, params.page || 1),
      limit: Math.min(100, Math.max(1, params.limit || 10)),
      offset: params.offset || 0,
    };
  }

  protected static buildQuery(
    table: string,
    params: {
      select?: string;
      filters?: Record<string, unknown>;
      sort?: SortParams;
      pagination?: PaginationParams;
    } = {}
  ) {
    let query = supabase.from(table);

    // Select fields
    if (params.select) {
      query = query.select(params.select);
    } else {
      query = query.select('*');
    }

    // Apply filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply sorting
    if (params.sort) {
      query = query.order(params.sort.column, {
        ascending: params.sort.ascending ?? true,
      });
    }

    // Apply pagination
    if (params.pagination) {
      const { limit, offset } = this.validatePagination(params.pagination);
      query = query.range(offset, offset + limit - 1);
    }

    return query;
  }

  protected static async executeQuery<T>(
    query: unknown,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      const response = await query;
      return this.handleSupabaseResponse<T>(response);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  protected static async executeMutation<T>(
    mutation: unknown,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      const response = await mutation;
      return this.handleSupabaseResponse<T>(response);
    } catch (error) {
      return this.handleError(error, context);
    }
  }
}
