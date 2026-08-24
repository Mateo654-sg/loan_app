import { apiRequest } from '@/services/api/client';
import {
  clearStoredSession,
  loadSession,
  saveSession,
} from '@/services/auth/session-storage';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthSessionResponse, UserDto } from '@/types/api';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterData extends Credentials {
  full_name: string;
}

function persistAuthSession(data: AuthSessionResponse, fallbackUser: UserDto | null): void {
  useAuthStore.getState().setSession({
    user: data.user ?? fallbackUser,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
  });

  void saveSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    user: data.user ?? fallbackUser,
  });
}

export async function registerUser(data: RegisterData): Promise<void> {
  const response = await apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    authenticated: false,
    body: data,
  });

  persistAuthSession(response, null);
}

export async function loginUser(credentials: Credentials): Promise<void> {
  const response = await apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    authenticated: false,
    body: credentials,
  });

  persistAuthSession(response, null);
}

/** Restores a previously persisted session at app startup. */
export async function hydrateSession(): Promise<void> {
  const persisted = await loadSession();

  if (persisted.accessToken) {
    useAuthStore.getState().setSession({
      user: persisted.user,
      accessToken: persisted.accessToken,
      refreshToken: persisted.refreshToken,
    });
  } else {
    useAuthStore.getState().markHydrated();
  }
}

export async function fetchCurrentUser(): Promise<UserDto> {
  return apiRequest<UserDto>('/auth/me');
}

export async function logoutUser(): Promise<void> {
  // Server-side logout is stateless in v1.0 (204). Local invalidation is
  // what actually ends the session (SECURITY.md §11).
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network failures during logout: local session must be cleared.
  }

  useAuthStore.getState().clearSession();
  await clearStoredSession();
}
