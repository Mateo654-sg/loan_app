import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';

/**
 * Bottom navigation con íconos SF Symbols y colores del tema.
 * Solo las secciones implementadas están expuestas.
 */
export default function AppLayout() {
  const c = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderSubtle,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: FontWeight.semibold,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: c.surface,
        },
        headerShadowVisible: false,
        headerTintColor: c.text,
        headerTitleStyle: {
          fontWeight: FontWeight.bold,
          fontSize: Typography.md,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
