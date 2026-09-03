import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { UserDto } from '@/types/api';

const ACCESS_TOKEN_KEY = 'pp.access_token';
const REFRESH_TOKEN_KEY = 'pp.refresh_token';
const USER_KEY = 'pp.user_json';

/**
 * Persistencia de sesión en almacenamiento seguro (SECURITY.md §10).
 * En web, SecureStore usa localStorage; errores se absorben.
 */
export async function saveSession(payload: {
  accessToken: string;
  refreshToken: string | null;
  user: UserDto | null;
}): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, payload.accessToken),
      payload.refreshToken
        ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, payload.refreshToken)
        : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(payload.user)),
    ]);
  } catch {
    // storage no disponible: queda solo memoria
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
  } catch {}
}

export function isNativePlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
