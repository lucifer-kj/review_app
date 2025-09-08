import { useQuery } from '@tanstack/react-query';
import { MasterDashboardService, PlatformMetrics } from '@/services/masterDashboardService';

export const usePlatformMetrics = () => {
  return useQuery<PlatformMetrics>({
    queryKey: ['platform-analytics'],
    queryFn: () => MasterDashboardService.getPlatformMetrics(),
    staleTime: 30_000,
  });
};


