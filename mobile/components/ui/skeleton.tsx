import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Radius, Shadow } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';

interface SkeletonProps {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
  variant?: 'default' | 'card' | 'text' | 'circular';
}

export function Skeleton({ height, width = '100%', radius = Radius.card, variant = 'default' }: SkeletonProps) {
  const c = usePalette();
  const translateX = useSharedValue(-400);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.95, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    translateX.value = withRepeat(withTiming(400, { duration: 1400, easing: Easing.linear }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const baseStyles = {
    height,
    width: width as any,
    borderRadius: variant === 'circular' ? 999 : radius,
    overflow: 'hidden' as const,
    backgroundColor: c.borderSubtle,
    position: 'relative' as const,
  };

  const shimmer = (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={c.shimmerGradient as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );

  return <View style={[baseStyles, variant === 'card' ? Shadow.sm : null]}>{shimmer}</View>;
}

export function SkeletonGroup({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  const childrenArray = Array.isArray(children) ? children : [children];
  return (
    <View style={{ flexDirection: 'column' }}>
      {childrenArray.map((child, index) => (
        <View key={index} style={{ marginBottom: index === childrenArray.length - 1 ? 0 : gap }}>
          {child}
        </View>
      ))}
    </View>
  );
}
