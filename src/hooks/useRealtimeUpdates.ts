import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeTableConfig {
  table: string;
  queryKey: string[];
  tenantId?: string;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
}

interface UseRealtimeUpdatesOptions {
  tables: RealtimeTableConfig[];
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useRealtimeUpdates({
  tables,
  enabled = true,
  onError
}: UseRealtimeUpdatesOptions) {
  const queryClient = useQueryClient();
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!enabled || !tables.length) return;

    const subscriptions = new Map<string, any>();

    tables.forEach(({ table, queryKey, tenantId, events = ['INSERT', 'UPDATE', 'DELETE'] }) => {
      try {
        const channelName = `${table}-realtime-${tenantId || 'all'}`;
        
        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
            },
            (payload) => {
              console.log(`${table} real-time update:`, payload);
              
              // Check if the event type is in our allowed events
              if (events.includes(payload.eventType as any)) {
                // Invalidate and refetch the query
                queryClient.invalidateQueries({ queryKey });
                
                // Also invalidate related queries
                queryClient.invalidateQueries({ 
                  queryKey: queryKey.slice(0, -1) // Remove the last part to match broader queries
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`✅ Real-time subscription active for ${table}`);
            } else if (status === 'CHANNEL_ERROR') {
              const error = new Error(`Real-time subscription error for ${table}`);
              console.error(error.message);
              onError?.(error);
            } else if (status === 'TIMED_OUT') {
              console.warn(`Real-time subscription timed out for ${table}`);
            } else if (status === 'CLOSED') {
              console.log(`Real-time subscription closed for ${table}`);
            }
          });

        subscriptions.set(table, subscription);
      } catch (error) {
        console.error(`Failed to create real-time subscription for ${table}:`, error);
        onError?.(error as Error);
      }
    });

    subscriptionsRef.current = subscriptions;

    return () => {
      subscriptions.forEach((subscription, table) => {
        try {
          supabase.removeChannel(subscription);
          console.log(`🔌 Disconnected real-time subscription for ${table}`);
        } catch (error) {
          console.error(`Error disconnecting real-time subscription for ${table}:`, error);
        }
      });
      subscriptions.clear();
    };
  }, [tables, enabled, queryClient, onError]);

  return {
    isConnected: subscriptionsRef.current.size > 0,
    subscriptions: Array.from(subscriptionsRef.current.keys())
  };
}
