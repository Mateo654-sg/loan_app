import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { darkPalette, lightPalette } from '@/theme/palette';
import { FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';

/**
 * Navegación inferior (PRODUCT_SPECIFICATION.md §31):
 * Inicio · Finanzas · Préstamos · Clientes · Más.
 */
export default function AppLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? darkPalette : lightPalette;

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
          paddingTop: Spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: FontWeight.semibold,
          color: c.text,
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="options" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
