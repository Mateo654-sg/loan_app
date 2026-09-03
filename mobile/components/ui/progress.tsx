import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Radius, Spacing, Typography, FontWeight } from '@/constants/tokens';
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
  const width = useSharedValue(clampedValue);

  useEffect(() => {
    if (animated) {
      width.value = withSpring(clampedValue, { damping: 18, stiffness: 140 });
    } else {
      width.value = withTiming(clampedValue, { duration: 220 });
    }
  }, [clampedValue, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  const trackColor = c.primaryGhost;
  const gradient = gradientColors ?? (variant === 'glow' ? c.primaryGradient : c.primaryGradient);
  const borderRadius = radius ?? height / 2;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius, backgroundColor: trackColor }]}>
        {variant === 'default' ? (
          <Animated.View style={[styles.fill, animatedStyle, { height, borderRadius, backgroundColor: c.primary }]} />
        ) : (
          <Animated.View style={[styles.fill, animatedStyle, { height, borderRadius, overflow: 'hidden' }]}>
            <LinearGradient
              colors={[...gradient] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            {variant === 'glow' ? <View style={[styles.glow, { backgroundColor: 'rgba(255,255,255,0.22)' }]} /> : null}
          </Animated.View>
        )}
      </View>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: c.textMuted }]}>{label ?? `${Math.round(clampedValue)}%`}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { gap: Spacing.xs },
    track: {
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
    },
    glow: {
      position: 'absolute',
      top: 0,
      left: '35%',
      right: '35%',
      height: 2,
      borderRadius: 999,
      opacity: 0.85,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    label: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.semibold as any,
    },
  });
