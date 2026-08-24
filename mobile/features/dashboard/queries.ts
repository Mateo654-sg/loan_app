import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/services/api/client';
import type { DashboardDto } from '@/features/dashboard/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'] as const,
    queryFn: () => apiRequest<DashboardDto>('/dashboard'),
    staleTime: 30_000,
  });
}
