import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FontWeight, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';

/**
 * Navegación inferior refinada con íconos vectoriales dinámicos.
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
          height: 64,
          paddingTop: 6,
          paddingBottom: Spacing.xs,
          ...Shadow.sm,
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
          fontWeight: FontWeight.extrabold,
          fontSize: Typography.md,
          color: c.text,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Más',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
