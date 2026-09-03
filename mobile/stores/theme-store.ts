import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => Promise<void>;
  hydrate: () => Promise<void>;
}

const THEME_KEY = '@pocketpal_theme';

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: async (pref) => {
    set({ preference: pref });
    await AsyncStorage.setItem(THEME_KEY, pref);
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ preference: stored });
      }
    } catch {
      // ignore
    }
  },
}));
