import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Shadow, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'bordered' | 'glass' | 'gradient' | 'premium';
  padding?: number;
  children: React.ReactNode;
}

export function Card({ children, onPress, variant = 'bordered', padding = Spacing.md, style, ...rest }: CardProps) {
  const c = usePalette();
  const styles = makeStyles(c);

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'bordered':
        return styles.bordered;
      case 'flat':
        return styles.flat;
      case 'glass':
        return styles.glass;
      case 'gradient':
        return styles.gradient;
      case 'premium':
        return styles.premium;
    }
  };

  const ContentView = ({ extraStyle }: { extraStyle?: any }) => (
    <View style={[styles.content, { padding }, extraStyle]}>{children}</View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.base, getVariantStyle(), pressed && styles.pressed, style]}
        onPress={onPress}
        accessibilityRole="button"
        {...rest}
      >
        <ContentView />
      </Pressable>
    );
  }

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={c.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, getVariantStyle(), style]}
      >
        <ContentView extraStyle={{ padding }} />
      </LinearGradient>
    );
  }

  if (variant === 'premium') {
    return (
      <LinearGradient
        colors={c.primaryGradientDeep}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, getVariantStyle(), style]}
      >
        <ContentView extraStyle={{ padding }} />
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), style]} {...rest}>
      <ContentView />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      borderRadius: Radius.card,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    content: {},
    bordered: {
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    elevated: {
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.md,
    },
    flat: {
      backgroundColor: c.primarySofter,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    glass: {
      backgroundColor: c.surfaceGlass,
      borderWidth: 1,
      borderColor: c.glassBorder,
      ...Shadow.sm,
    },
    gradient: {
      borderWidth: 0,
      ...Shadow.lg,
    },
    premium: {
      borderWidth: 0,
      ...Shadow.xl,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
  });
