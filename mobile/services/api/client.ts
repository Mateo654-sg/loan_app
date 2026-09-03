import type { AccessTokenResponse, ApiErrorBody } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';
import { saveSession } from '@/services/auth/session-storage';
import { clearStoredSession } from '@/services/auth/session-storage';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Base URL del backend PocketPal.
 * Configurada vía EXPO_PUBLIC_API_BASE_URL (ver mobile/.env.example).
 * Capa solo de transporte: nunca calcula valores financieros (ARCHITECTURE §24).
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
  _retriedAfterRefresh?: boolean;
  timeoutMs?: number;
}

/** Single-flight refresh: paralela 401s comparten un solo refresh */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  const { refreshToken, user } = useAuthStore.getState();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          useAuthStore.getState().clearSession();
          await clearStoredSession();
          return false;
        }
        const data = (await response.json()) as AccessTokenResponse;
        const state = useAuthStore.getState();
        state.setAccessToken(data.access_token);
        await saveSession({ accessToken: data.access_token, refreshToken, user: state.user });
        return true;
      } catch {
        useAuthStore.getState().clearSession();
        await clearStoredSession().catch(() => {});
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, authenticated = true, _retriedAfterRefresh = false, timeoutMs = 15_000 } = options;

  const requestHeaders: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  if (authenticated) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') throw new ApiError('La solicitud tardó demasiado. Verifica tu conexión.', undefined, 'NETWORK_TIMEOUT');
    throw new ApiError('Sin conexión. Verifica tu internet y que el servidor esté disponible.', undefined, 'NETWORK_ERROR');
  }
  clearTimeout(timeout);

  if (response.status === 401 && authenticated && !_retriedAfterRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) return apiRequest<T>(path, { ...options, _retriedAfterRefresh: true });
  }

  if (!response.ok) {
    let code: string | undefined;
    let message = `Error ${response.status}.`;
    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      code = errorBody.error?.code;
      message = errorBody.error?.message ?? message;
    } catch {}
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('Respuesta no válida del servidor.', response.status, 'INVALID_JSON');
  }
}
