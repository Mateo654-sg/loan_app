import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { UserDto } from '@/types/api';

const ACCESS_TOKEN_KEY = 'pp.access_token';
const REFRESH_TOKEN_KEY = 'pp.refresh_token';
const USER_KEY = 'pp.user_json';

/**
 * Session persistence using platform secure storage (SECURITY.md §10).
 * On web, expo-secure-store falls back to localStorage; failures are
 * swallowed so an unavailable storage never blocks authentication.
 */

export async function saveSession(payload: {
  accessToken: string;
  refreshToken: string | null;
  user: UserDto | null;
}): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, payload.accessToken);
    if (payload.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, payload.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(payload.user));
  } catch {
    // Storage unavailable: keep the in-memory session only.
  }
}

export interface PersistedSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
}

export async function loadSession(): Promise<PersistedSession> {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);

    let user: UserDto | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson) as UserDto;
      } catch {
        user = null;
      }
    }

    return { accessToken, refreshToken, user };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export async function clearStoredSession(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  } catch {
    // Nothing else to do: the in-memory session is already cleared.
  }
}

export function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
