import { useQuery } from '@tanstack/react-query';

import { getCollections, getTodayCollections } from '@/features/collections/api';
import type { CollectionsFilter } from '@/features/collections/types';

export const collectionsKeys = {
  today: ['collections', 'today'] as const,
  list: (filter: CollectionsFilter) => ['collections', 'list', filter] as const,
};

export function useTodayCollections() {
  return useQuery({
    queryKey: collectionsKeys.today,
    queryFn: getTodayCollections,
    staleTime: 30_000,
  });
}

export function useCollections(filter: CollectionsFilter) {
  return useQuery({
    queryKey: collectionsKeys.list(filter),
    queryFn: () => getCollections(filter),
    staleTime: 30_000,
  });
}
