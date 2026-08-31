import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Radius, Shadow, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'ring';
  onPress?: () => void;
  imageUri?: string;
}

const SIZE_MAP = {
  xs: { size: 28, fontSize: 10, ringWidth: 1.5 },
  sm: { size: 36, fontSize: 12, ringWidth: 2 },
  md: { size: 44, fontSize: 14, ringWidth: 2 },
  lg: { size: 56, fontSize: 18, ringWidth: 2.5 },
  xl: { size: 72, fontSize: 24, ringWidth: 3 },
};

export function Avatar({
  name,
  size = 'md',
  variant = 'default',
  onPress,
  imageUri,
}: AvatarProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const sizeConfig = SIZE_MAP[size];

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = (hash * 137) % 360;
  const bgColor = `hsl(${hue}, 65%, 52%)`;

  const gradientColors = [
    `hsl(${hue}, 65%, 52%)`,
    `hsl(${(hue + 30) % 360}, 65%, 48%)`,
    `hsl(${(hue + 60) % 360}, 70%, 45%)`,
  ] as const;

  const Content = () => (
    <View style={[styles.content, { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 }]}>
      {imageUri ? (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: sizeConfig.fontSize, color: c.onPrimary }}>📷</Text>
        </View>
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: sizeConfig.fontSize,
              fontWeight: '800',
              color: c.onPrimary,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientWrapper,
          { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 },
        ]}
      >
        <Content />
      </LinearGradient>
    );
  }

  if (variant === 'ring') {
    return (
      <View
        style={[
          styles.ringWrapper,
          { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 },
        ]}
      >
        <View style={styles.ring}>
          <Content />
        </View>
      </View>
    );
  }

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[
        styles.wrapper,
        { width: sizeConfig.size, height: sizeConfig.size, borderRadius: sizeConfig.size / 2 },
      ]}
      onPress={onPress}
    >
      <Content />
    </Wrapper>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
      borderWidth: 2,
      borderColor: c.primary + '25',
    },
    gradientWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.md,
    },
    ringWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      width: '100%',
      height: '100%',
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 3,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      // fontSize applied inline
    },
    imagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });