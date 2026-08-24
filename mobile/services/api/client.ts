import type { AccessTokenResponse, ApiErrorBody } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';
import { saveSession } from '@/services/auth/session-storage';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Base URL of the PocketPal backend.
 * Configured through the EXPO_PUBLIC_API_BASE_URL environment variable
 * (see mobile/.env.example). No financial logic lives in this layer:
 * it only transports requests and normalizes errors (ARCHITECTURE.md §24).
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
  /** Set to false for public endpoints (register, login, refresh). */
  authenticated?: boolean;
  _retriedAfterRefresh?: boolean;
}

/** Single-flight refresh: parallel 401s share one refresh request. */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    return false;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          useAuthStore.getState().clearSession();
          return false;
        }

        const data = (await response.json()) as AccessTokenResponse;
        const state = useAuthStore.getState();
        state.setAccessToken(data.access_token);
        // Keep persisted storage in sync with the rotated access token.
        await saveSession({
          accessToken: data.access_token,
          refreshToken,
          user: state.user,
        });
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers,
    authenticated = true,
    _retriedAfterRefresh = false,
  } = options;

  const requestHeaders: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  if (authenticated) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network request failed. Check your connection and the backend availability.');
  }

  if (response.status === 401 && authenticated && !_retriedAfterRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retriedAfterRefresh: true });
    }
  }

  if (!response.ok) {
    let code: string | undefined;
    let message = `Request failed with status ${response.status}.`;

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      code = errorBody.error?.code;
      message = errorBody.error?.message ?? message;
    } catch {
      // Non-JSON error body: keep generic message.
    }

    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('Response was not valid JSON.');
  }
}
