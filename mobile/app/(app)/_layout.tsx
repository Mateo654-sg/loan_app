import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

import { darkPalette, lightPalette } from '@/theme/palette';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';

export default function AppLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();

  // Animaciones de entrada para cada tab
  const tabAnimations = {
    home: useSharedValue(0),
    finance: useSharedValue(0),
    loans: useSharedValue(0),
    clients: useSharedValue(0),
    settings: useSharedValue(0),
  };

  const tabAnimatedStyle = (key: keyof typeof tabAnimations) =>
    useAnimatedStyle(() => ({
      opacity: tabAnimations[key].value,
      transform: [{ translateY: interpolate(tabAnimations[key].value, [0, 1], [20, 0]) }],
    }));

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: Spacing.md,
          right: Spacing.md,
          borderRadius: Radius.badge,
          height: 68 + (insets.bottom > 0 ? insets.bottom : 8),
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.borderSubtle,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          ...Shadow.xl,
        },
        tabBarItemStyle: {
          flex: 1,
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
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={tabAnimatedStyle('home')}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={focused ? c.primaryGradient : [c.border, c.borderSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBox,
                    { backgroundColor: focused ? 'transparent' : c.surface },
                  ]}
                >
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={focused ? '#FFF' : color} />
                </LinearGradient>
                {focused && <View style={styles.activeIndicator} />}
              </View>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={tabAnimatedStyle('finance')}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={focused ? c.successGradient : [c.border, c.borderSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBox,
                    { backgroundColor: focused ? 'transparent' : c.surface },
                  ]}
                >
                  <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={focused ? '#FFF' : color} />
                </LinearGradient>
                {focused && <View style={styles.activeIndicator} />}
              </View>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={tabAnimatedStyle('loans')}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={focused ? c.goldGradient : [c.border, c.borderSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBox,
                    { backgroundColor: focused ? 'transparent' : c.surface },
                  ]}
                >
                  <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={focused ? '#FFF' : color} />
                </LinearGradient>
                {focused && <View style={styles.activeIndicator} />}
              </View>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={tabAnimatedStyle('clients')}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={focused ? c.accentGradient : [c.border, c.borderSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBox,
                    { backgroundColor: focused ? 'transparent' : c.surface },
                  ]}
                >
                  <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={focused ? '#FFF' : color} />
                </LinearGradient>
                {focused && <View style={styles.activeIndicator} />}
              </View>
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={tabAnimatedStyle('settings')}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={focused ? [c.textMuted, c.textSubtle] : [c.border, c.borderSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.iconBox,
                    { backgroundColor: focused ? 'transparent' : c.surface },
                  ]}
                >
                  <Ionicons name={focused ? 'options' : 'options-outline'} size={size} color={focused ? '#FFF' : color} />
                </LinearGradient>
                {focused && <View style={styles.activeIndicator} />}
              </View>
            </Animated.View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B2FBC',
  },
});
