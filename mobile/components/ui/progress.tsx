import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface ProgressProps {
  value: number; // 0-100
  height?: number;
  radius?: number;
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'premium' | 'glow';
  gradientColors?: readonly [string, string];
}

export function Progress({
  value,
  height = 8,
  radius,
  animated = true,
  showLabel = false,
  label,
  variant = 'default',
  gradientColors,
}: ProgressProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const clampedValue = Math.max(0, Math.min(100, value));
  const width = useSharedValue(0);

  // Animate on mount
  if (animated) {
    width.value = withSpring(clampedValue, { damping: 15, stiffness: 120 });
  } else {
    width.value = clampedValue;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const trackColor = c.primarySoft;
  const gradient = gradientColors ?? c.primaryGradient;

  const fillAnimatedStyle = [animatedStyle, { height, borderRadius: radius ?? height / 2 }];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          { height, borderRadius: radius ?? height / 2, backgroundColor: trackColor },
        ]}
      >
        {variant === 'glow' ? (
          <Animated.View style={fillAnimatedStyle}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : variant === 'premium' ? (
          <Animated.View style={fillAnimatedStyle}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.fill,
              animatedStyle,
              { height, borderRadius: radius ?? height / 2, backgroundColor: c.primary },
            ]}
          />
        )}
      </View>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label ?? `${Math.round(clampedValue)}%`}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      gap: Spacing.xs,
    },
    track: {
      overflow: 'hidden',
      position: 'relative',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textMuted,
    },
  });