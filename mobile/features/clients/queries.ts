import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createClient,
  createReference,
  deactivateClient,
  getClient,
  getClients,
  getClientSummary,
  getReferences,
  type ClientFilters,
  type ClientPayload,
  type ReferencePayload,
} from '@/features/clients/api';

export const clientKeys = {
  list: (filters: Omit<ClientFilters, 'page'>) => ['clients', 'list', filters] as const,
  detail: (clientId: string) => ['clients', 'detail', clientId] as const,
  summary: (clientId: string) => ['clients', 'summary', clientId] as const,
  references: (clientId: string) => ['clients', 'references', clientId] as const,
};

export function useClients(filters: Omit<ClientFilters, 'page'> = {}) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => getClients(filters),
  });
}

export function useInfiniteClients(filters: Omit<ClientFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['clients', 'infinite', filters] as const,
    queryFn: ({ pageParam }) => getClients({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => getClient(clientId),
  });
}

export function useClientSummary(clientId: string) {
  return useQuery({
    queryKey: clientKeys.summary(clientId),
    queryFn: () => getClientSummary(clientId),
  });
}

export function useReferences(clientId: string) {
  return useQuery({
    queryKey: clientKeys.references(clientId),
    queryFn: () => getReferences(clientId),
  });
}

function useInvalidateClients() {
  const queryClient = useQueryClient();
  return (clientId?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
    if (clientId) {
      // Keep detail-scoped keys fresh too.
      void queryClient.invalidateQueries({ queryKey: clientKeys.summary(clientId) });
      void queryClient.invalidateQueries({ queryKey: clientKeys.references(clientId) });
    }
  };
}

export function useCreateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClient(payload),
    onSuccess: () => invalidate(),
  });
}

export function useDeactivateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: deactivateClient,
    onSuccess: (_client, _vars, _ctx, clientId) => invalidate(_client.id),
  });
}

export function useCreateReference() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: ({
      clientId,
      payload,
    }: {
      clientId: string;
      payload: ReferencePayload;
    }) => createReference(clientId, payload),
    onSuccess: (_ref, vars) => invalidate(vars.clientId),
  });
}
