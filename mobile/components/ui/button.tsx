import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

import { Animation, FontWeight, LetterSpacing, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { hapticTap } from '@/utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  haptic?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconName,
  iconPosition = 'left',
  haptic = true,
}: ButtonProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (haptic) hapticTap();
    onPress();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      case 'danger':
        return styles.danger;
      case 'gold':
        return styles.gold;
      case 'outline':
        return styles.outline;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'md':
        return styles.sizeMd;
      case 'lg':
        return styles.sizeLg;
      case 'xl':
        return styles.sizeXl;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return c.onPrimary;
      case 'secondary':
        return c.primary;
      case 'ghost':
        return c.primary;
      case 'danger':
        return c.onDanger;
      case 'gold':
        return '#1A1500';
      case 'outline':
        return c.primary;
    }
  };

  const spinnerColor = variant === 'primary' || variant === 'danger' ? c.onPrimary : variant === 'gold' ? '#1A1500' : c.primary;

  return (
    <AnimatedPressable
      style={[animatedStyle, styles.base, getVariantStyle(), getSizeStyle(), fullWidth && styles.fullWidth, isDisabled && styles.disabled]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: Animation.fast });
        opacity.value = withTiming(0.92, { duration: Animation.fast });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Animation.spring);
        opacity.value = withTiming(1, { duration: Animation.fast });
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={styles.row}>
          {iconName && iconPosition === 'left' ? <Ionicons name={iconName} size={18} color={getTextColor()} /> : null}
          <Text style={[styles.text, { color: getTextColor() }, getTextSizeStyle(size)]} numberOfLines={1}>
            {label}
          </Text>
          {iconName && iconPosition === 'right' ? <Ionicons name={iconName} size={18} color={getTextColor()} /> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

function getTextSizeStyle(size: ButtonSize): any {
  switch (size) {
    case 'sm':
      return { fontSize: Typography.sm, letterSpacing: LetterSpacing.wide };
    case 'md':
      return { fontSize: Typography.base, letterSpacing: LetterSpacing.wide };
    case 'lg':
      return { fontSize: Typography.md, letterSpacing: LetterSpacing.wide };
    case 'xl':
      return { fontSize: Typography.lg, letterSpacing: LetterSpacing.wide };
  }
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.button,
      flexDirection: 'row',
    },
    primary: {
      backgroundColor: c.primary,
      ...Shadow.md,
    },
    secondary: {
      backgroundColor: c.primarySoft,
      borderWidth: 1,
      borderColor: c.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: c.danger,
      ...Shadow.sm,
    },
    gold: {
      backgroundColor: c.gold,
      ...Shadow.gold,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.8,
      borderColor: c.primary,
    },
    sizeSm: { minHeight: 44, paddingHorizontal: Spacing.md, minWidth: 88 },
    sizeMd: { minHeight: 52, paddingHorizontal: Spacing.lg, minWidth: 120 },
    sizeLg: { minHeight: 56, paddingHorizontal: Spacing.xl, minWidth: 140 },
    sizeXl: { minHeight: 64, paddingHorizontal: Spacing.xxl, minWidth: 160 },
    fullWidth: { alignSelf: 'stretch', width: '100%' },
    disabled: { opacity: 0.45 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    text: { fontWeight: FontWeight.semibold as any, textAlign: 'center', flexShrink: 1 },
  });
