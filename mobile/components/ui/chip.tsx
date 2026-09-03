import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

import { Animation, FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  variant?: 'default' | 'primary' | 'outline';
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Chip({ label, selected = false, onPress, icon, variant = 'default', disabled = false, size = 'md' }: ChipProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isPrimary = variant === 'primary' || (selected && variant !== 'outline');
  const isSmall = size === 'sm';

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        styles.base,
        isSmall ? styles.baseSm : styles.baseMd,
        isPrimary ? styles.primary : variant === 'outline' ? styles.outline : styles.default,
        selected && !isPrimary && styles.selected,
        disabled && styles.disabled,
      ]}
      onPress={() => !disabled && onPress?.()}
      onPressIn={() => !disabled && (scale.value = withTiming(0.94, { duration: Animation.fast }))}
      onPressOut={() => !disabled && (scale.value = withSpring(1, Animation.spring))}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
    >
      <View style={styles.row}>
        {icon ? <Text style={[styles.icon, { color: isPrimary ? c.onPrimary : c.text }]}>{icon}</Text> : null}
        <Text style={[styles.text, { color: isPrimary ? c.onPrimary : selected ? c.primary : c.text }, isSmall && styles.textSm]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: Radius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    baseSm: { minHeight: 36, paddingHorizontal: Spacing.sm + 4, paddingVertical: 6 },
    baseMd: { minHeight: 44, paddingHorizontal: Spacing.md, paddingVertical: 8 },
    default: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      ...Shadow.xs,
    },
    primary: {
      backgroundColor: c.primary,
      borderWidth: 1,
      borderColor: c.primary,
      ...Shadow.md,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.8,
      borderColor: c.primary,
    },
    selected: {
      backgroundColor: c.primarySoft,
      borderColor: c.primary,
      borderWidth: 1.5,
    },
    disabled: { opacity: 0.42 },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    text: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold as any,
      letterSpacing: 0.2,
    },
    textSm: { fontSize: Typography.xs },
    icon: { fontSize: Typography.sm },
  });
