import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import { Shadow } from '@/constants/tokens';

interface SkeletonProps {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
  variant?: 'default' | 'card' | 'text' | 'circular';
}

/**
 * Skeleton premium con efecto shimmer gradiente usando react-native-reanimated.
 */
export function Skeleton({
  height,
  width = '100%',
  radius = Radius.card,
  variant = 'default',
}: SkeletonProps) {
  const c = usePalette();
  const translateX = useSharedValue(-150);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    const w = typeof width === 'number' ? width : 300;
    translateX.value = withRepeat(
      withSequence(
        withTiming(w, { duration: 1500, easing: Easing.linear }),
        withTiming(-w, { duration: 0 }),
      ),
      -1,
    );
  }, [opacity, translateX, width]);

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
  };

  if (variant === 'card') {
    return (
      <View style={[baseStyles, { backgroundColor: c.borderSubtle, ...Shadow.sm }]}>
        <Animated.View style={[animatedStyle, styles.shimmerCard]} />
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View style={baseStyles}>
        <Animated.View style={[animatedStyle, styles.shimmerText]} />
      </View>
    );
  }

  if (variant === 'circular') {
    return (
      <View style={baseStyles}>
        <Animated.View style={[animatedStyle, styles.shimmerCircle]} />
      </View>
    );
  }

  return (
    <View style={baseStyles}>
      <Animated.View style={[animatedStyle, styles.shimmerDefault]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerDefault: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  shimmerCard: {
    ...StyleSheet.absoluteFill,
  },
  shimmerText: {
    ...StyleSheet.absoluteFill,
  },
  shimmerCircle: {
    ...StyleSheet.absoluteFill,
  },
});

/** Contenedor para agrupar skeletons con gap uniforme */
export function SkeletonGroup({
  children,
  gap = 12,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  // Use a wrapper with flexDirection and margin on children instead of gap
  // since gap in View style has limited TypeScript support
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