import { apiRequest } from '@/services/api/client';
import type { ClientDto, ClientListDto, ClientSummaryDto, ReferenceDto } from '@/features/clients/types';

export interface ClientFilters {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  page_size?: number;
}

export function getClients(filters: ClientFilters = {}): Promise<ClientListDto> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page ?? 1));
  params.set('page_size', String(filters.page_size ?? 20));

  return apiRequest<ClientListDto>(`/clients?${params.toString()}`);
}

export interface ClientPayload {
  full_name: string;
  document_number?: string | null;
  phone?: string | null;
  alternative_phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export function createClient(payload: ClientPayload): Promise<ClientDto> {
  return apiRequest<ClientDto>('/clients', { method: 'POST', body: payload });
}

export function getClient(clientId: string): Promise<ClientDto> {
  return apiRequest<ClientDto>(`/clients/${clientId}`);
}

export function updateClient(clientId: string, payload: Partial<ClientPayload>): Promise<ClientDto> {
  return apiRequest<ClientDto>(`/clients/${clientId}`, { method: 'PATCH', body: payload });
}

export function deactivateClient(clientId: string): Promise<ClientDto> {
  return apiRequest<ClientDto>(`/clients/${clientId}/deactivate`, { method: 'POST' });
}

export function getClientSummary(clientId: string): Promise<ClientSummaryDto> {
  return apiRequest<ClientSummaryDto>(`/clients/${clientId}/summary`);
}

// ---------- References ----------

export function getReferences(clientId: string): Promise<ReferenceDto[]> {
  return apiRequest<ReferenceDto[]>(`/clients/${clientId}/references`);
}

export interface ReferencePayload {
  name: string;
  phone?: string | null;
  address?: string | null;
  relationship?: string | null;
}

export function createReference(clientId: string, payload: ReferencePayload): Promise<ReferenceDto> {
  return apiRequest<ReferenceDto>(`/clients/${clientId}/references`, {
    method: 'POST',
    body: payload,
  });
}
