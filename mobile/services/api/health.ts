import { apiRequest } from './client';
import type { DatabaseHealthResponse, HealthResponse } from '@/types/api';

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

export function getDatabaseHealth(): Promise<DatabaseHealthResponse> {
  return apiRequest<DatabaseHealthResponse>('/health/db');
}
