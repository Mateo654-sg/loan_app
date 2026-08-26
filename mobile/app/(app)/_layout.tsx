import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { darkPalette, lightPalette } from '@/theme/palette';
import { FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';

/**
 * Navegación inferior (PRODUCT_SPECIFICATION.md §31):
 * Inicio · Finanzas · Préstamos · Clientes · Más.
 *
 * El inset inferior se aplica EXPLÍCITAMENTE al tab bar: es la única forma
 * determinista de garantizar que la barra/gesture de Android nunca tape
 * las pestañas, independiente de cómo reporte insets cada dispositivo.
 */
export default function AppLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();

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
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
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
