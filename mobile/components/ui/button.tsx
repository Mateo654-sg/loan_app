import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { hapticTap } from '@/utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

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
}

/**
 * Botón reutilizable con variantes, tamaños, haptics y animación
 * de escala al presionar. Usa la paleta del tema automáticamente.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconName,
}: ButtonProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const isDisabled = disabled || loading;

  // Animación de presión: escala 1 → 0.97 → 1
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    hapticTap();
    onPress();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.primary;
      case 'secondary': return styles.secondary;
      case 'ghost': return styles.ghost;
      case 'danger': return styles.danger;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return styles.textPrimary;
      case 'secondary': return styles.textSecondary;
      case 'ghost': return styles.textGhost;
      case 'danger': return styles.textDanger;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.sizeSm;
      case 'md': return styles.sizeMd;
      case 'lg': return styles.sizeLg;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.textSm;
      case 'md': return styles.textMd;
      case 'lg': return styles.textLg;
    }
  };

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? c.onPrimary : c.primary}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {iconName ? (
            <Ionicons name={iconName} size={Typography.md + 2} color={getTextColor(c, variant)} />
          ) : null}
          <Text style={[styles.text, getTextStyle(), getTextSizeStyle()]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

function getTextColor(c: Palette, variant: ButtonVariant): string {
  switch (variant) {
    case 'primary': return c.onPrimary;
    case 'secondary': return c.primary;
    case 'ghost': return c.primary;
    case 'danger': return c.onDanger;
  }
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.button,
    },
    // Variantes
    primary: {
      backgroundColor: c.primary,
      ...Shadow.md,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: c.danger,
      ...Shadow.sm,
    },
    // Tamaños
    sizeSm: { minHeight: 38 },
    sizeMd: { minHeight: 50 },
    sizeLg: { minHeight: 56 },
    fullWidth: { alignSelf: 'stretch', width: '100%' },
    disabled: { opacity: 0.45 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    // Textos
    text: { fontWeight: FontWeight.semibold, letterSpacing: 0.2, textAlign: 'center' },
    textPrimary: { color: c.onPrimary },
    textSecondary: { color: c.primary },
    textGhost: { color: c.primary },
    textDanger: { color: c.onDanger },
    textSm: { fontSize: Typography.sm },
    textMd: { fontSize: Typography.base },
    textLg: { fontSize: Typography.lg },
  });
