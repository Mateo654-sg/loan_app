import { useQuery } from '@tanstack/react-query';

import { getHealth } from '@/services/api/health';
import type { ConnectionState } from '@/types/api';

export function useApiHealth() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: 1,
    staleTime: 10_000,
  });

  const state: ConnectionState = query.isPending
    ? 'loading'
    : query.isError
      ? 'offline'
      : 'online';

  return {
    state,
    refetch: () => {
      void query.refetch();
    },
  };
}
