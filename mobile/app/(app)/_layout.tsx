import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { darkPalette, lightPalette } from '@/theme/palette';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { useThemeStore } from '@/stores/theme-store';

const TAB_CONFIG = [
  { name: 'index', title: 'Inicio', icon: 'home' as const, iconOutline: 'home-outline' as const, gradient: 'primary' as const },
  { name: 'finance', title: 'Finanzas', icon: 'wallet' as const, iconOutline: 'wallet-outline' as const, gradient: 'success' as const },
  { name: 'loans', title: 'Préstamos', icon: 'cash' as const, iconOutline: 'cash-outline' as const, gradient: 'gold' as const },
  { name: 'clients', title: 'Clientes', icon: 'people' as const, iconOutline: 'people-outline' as const, gradient: 'accent' as const },
  { name: 'settings', title: 'Más', icon: 'grid' as const, iconOutline: 'grid-outline' as const, gradient: 'neutral' as const },
];

export default function AppLayout() {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const scheme = preference === 'system' ? systemScheme : preference;
  const c = scheme === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();

  const getGradient = (key: string, focused: boolean): [string, string] => {
    if (!focused) return [c.surface, c.surface] as [string, string];
    switch (key) {
      case 'primary':
        return c.primaryGradient;
      case 'success':
        return c.successGradient;
      case 'gold':
        return c.goldGradient;
      case 'accent':
        return c.accentGradient;
      default:
        return [c.textMuted, c.textSubtle];
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom : 10,
          left: Spacing.md,
          right: Spacing.md,
          height: 72,
          borderRadius: Radius.xl,
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.borderSubtle,
          borderLeftWidth: 1,
          borderLeftColor: c.borderSubtle,
          borderRightWidth: 1,
          borderRightColor: c.borderSubtle,
          borderBottomWidth: 1,
          borderBottomColor: c.borderSubtle,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 6,
          ...Shadow.xl,
          ...(Platform.OS === 'android' ? { elevation: 18 } : {}),
        },
        tabBarItemStyle: { flex: 1, paddingVertical: 2 },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: FontWeight.bold as any,
          letterSpacing: 0.2,
          marginTop: 4,
        },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ focused, size }) => {
              const gradient = getGradient(tab.gradient, focused);
              const isActive = focused;
              return (
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.iconBox, isActive && styles.iconBoxActive, !isActive && { backgroundColor: c.surface }]}
                  >
                    <Ionicons name={isActive ? tab.icon : tab.iconOutline} size={isActive ? 22 : 20} color={isActive ? '#FFFFFF' : c.textMuted} />
                  </LinearGradient>
                  {isActive ? <View style={[styles.activeDot, { backgroundColor: c.primary }]} /> : null}
                </View>
              );
            },
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    ...Shadow.md,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    marginTop: 1,
  },
});
