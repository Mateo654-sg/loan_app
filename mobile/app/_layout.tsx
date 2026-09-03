import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { darkPalette, lightPalette } from '@/theme/palette';
import { hydrateSession } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { FontWeight, Typography, Shadow } from '@/constants/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null && s.user !== null);

  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    void hydrateSession();
    void useThemeStore.getState().hydrate();
  }, []);

  const effectiveScheme = preference === 'system' ? colorScheme : preference;
  const palette = effectiveScheme === 'dark' ? darkPalette : lightPalette;

  const stabilizeSystemBars = useCallback(() => {
    void SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  useEffect(stabilizeSystemBars, [stabilizeSystemBars]);

  if (!hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: palette.background }]}>
        <LinearGradient colors={palette.primaryGradientDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.splashLogo, Shadow.xl]}>
          <Text style={styles.splashChar}>₱</Text>
        </LinearGradient>
        <Text style={[styles.splashName, { color: palette.text }]}>PocketPal</Text>
        <Text style={[styles.splashTagline, { color: palette.textMuted }]}>FINANZAS PREMIUM</Text>
        <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background }, animation: 'fade' }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  splashLogo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  splashChar: { fontSize: 34, color: '#FFF', fontWeight: '900' },
  splashName: { fontSize: Typography.xxl, fontWeight: FontWeight.black as any, letterSpacing: -0.7, marginTop: 12 },
  splashTagline: { fontSize: 10, fontWeight: FontWeight.bold as any, letterSpacing: 2.8, opacity: 0.85 },
});
