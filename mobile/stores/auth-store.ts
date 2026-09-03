import { create } from 'zustand';

import type { UserDto } from '@/types/api';

interface AuthState {
  hydrated: boolean;
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  markHydrated: () => void;
  setSession: (payload: { user: UserDto | null; accessToken: string; refreshToken: string | null }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

/**
 * Estado de autenticación cliente. Solo guarda tokens y perfil del backend;
 * nunca calcula valores financieros ni decide autorización (SECURITY.md §47–49).
 */
export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  markHydrated: () => set({ hydrated: true }),
  setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken, hydrated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, hydrated: true }),
}));

export function getAuthTokens() {
  return useAuthStore.getState();
}
