import { useEffect } from 'react';
import { View } from 'react-native';
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

interface SkeletonProps {
  height: number;
  width?: number | `${number}%`;
  radius?: number;
}

/**
 * Skeleton animado con pulso suave usando react-native-reanimated.
 * Úsalo para estados de carga para evitar el layout shift.
 */
export function Skeleton({ height, width = '100%', radius = Radius.card }: SkeletonProps) {
  const c = usePalette();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: c.primarySoft,
        },
        animatedStyle,
      ]}
    />
  );
}

/** Contenedor para agrupar skeletons con gap uniforme */
export function SkeletonGroup({
  children,
  gap = 12,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return <View style={{ gap }}>{children}</View>;
}
