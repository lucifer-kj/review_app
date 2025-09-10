import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeSubscriptionOptions {
  table: string;
  queryKey: string[];
  enabled?: boolean;
  tenantId?: string;
}

export function useRealtimeSubscription({
  table,
  queryKey,
  enabled = true,
  tenantId
}: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !table) return;

    try {
      // Create a unique channel name
      const channelName = `${table}-changes-${tenantId || 'all'}`;
      
      // Subscribe to table changes
      subscriptionRef.current = supabase
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
            console.log(`${table} change:`, payload);
            
            // Invalidate and refetch the query
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Real-time subscription active for ${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Real-time subscription error for ${table}`);
          }
        });
    } catch (error) {
      console.error('Failed to create real-time subscription:', error);
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [table, queryKey, enabled, tenantId, queryClient]);

  return subscriptionRef.current;
}
