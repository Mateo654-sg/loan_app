import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';

import { hydrateSession } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { usePalette } from '@/hooks/use-palette';
import { FontWeight, Shadow, Typography } from '@/constants/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppLogo() {
  const c = usePalette();
  return (
    <View style={logoStyles.container}>
      <View style={[logoStyles.icon, { backgroundColor: c.primary, ...Shadow.lg }]}>
        <Text style={logoStyles.iconText}>₱</Text>
      </View>
      <Text style={[logoStyles.name, { color: c.text }]}>PocketPal</Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 14 },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 40, color: '#FFF', fontWeight: FontWeight.bold },
  name: {
    fontSize: Typography.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
});

function LoadingScreen() {
  const c = usePalette();
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }]}>
      <AppLogo />
    </View>
  );
}

function RootLayoutInner() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.accessToken !== null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    void hydrateSession();
  }, []);

  if (!hydrated) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
    </QueryClientProvider>
  );
}
