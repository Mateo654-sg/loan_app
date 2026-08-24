import { apiRequest } from '@/services/api/client';
import type {
  CollectionsFilter,
  CollectionsListDto,
  TodayCollectionsDto,
} from '@/features/collections/types';

const VALID_FILTERS: CollectionsFilter[] = [
  'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'OVERDUE', 'UPCOMING', 'ALL',
];

export function getTodayCollections(): Promise<TodayCollectionsDto> {
  return apiRequest<TodayCollectionsDto>('/collections/today');
}

export function getCollections(
  filter: CollectionsFilter,
  clientId?: string,
): Promise<CollectionsListDto> {
  const valid = VALID_FILTERS.includes(filter) ? filter : 'ALL';
  const params = new URLSearchParams({ filter: valid });
  if (clientId) params.set('client_id', clientId);

  return apiRequest<CollectionsListDto>(`/collections?${params.toString()}`);
}
