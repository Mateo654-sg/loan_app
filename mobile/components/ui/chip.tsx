import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

import { Animation, FontWeight, Radius, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  variant?: 'default' | 'primary' | 'outline';
  disabled?: boolean;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  variant = 'default',
  disabled = false,
}: ChipProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!disabled && onPress) onPress();
  };

  const isPrimary = variant === 'primary' || (selected && variant !== 'outline');

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        styles.base,
        isPrimary ? styles.primary : variant === 'outline' ? styles.outline : styles.default,
        selected && !isPrimary && styles.selected,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        if (!disabled) scale.value = withTiming(0.94, { duration: Animation.fast });
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1, Animation.spring);
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <View style={styles.row}>
        {icon && <Text style={[styles.icon, { color: isPrimary ? c.onPrimary : c.text }]}>{icon}</Text>}
        <Text
          style={[
            styles.text,
            { color: isPrimary ? c.onPrimary : c.text },
            selected && !isPrimary && styles.textSelected,
          ]}
        >
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
      borderRadius: 999,
      minHeight: 44,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    default: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      ...Shadow.sm,
    },
    primary: {
      backgroundColor: c.primary,
      ...Shadow.md,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: c.primary,
    },
    selected: {
      backgroundColor: c.primarySoft,
      borderColor: c.primary,
      borderWidth: 1.5,
    },
    disabled: { opacity: 0.4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    text: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold,
      letterSpacing: 0.2,
    },
    textSelected: {
      color: c.primary,
      fontWeight: FontWeight.bold,
    },
    icon: { fontSize: Typography.sm },
  });

const Shadow = {
  sm: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#3B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};