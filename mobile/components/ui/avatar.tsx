import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Shadow } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'ring';
  onPress?: () => void;
}

// Paleta curada premium — nunca neón, siempre índigo/violeta/dorado
const PALETTE_COLORS: [string, string][] = [
  ['#3B2FBC', '#5A4FE8'],
  ['#7C3AED', '#A855F7'],
  ['#0D9668', '#10B981'],
  ['#C9A84C', '#E8C85A'],
  ['#2563EB', '#60A5FA'],
  ['#B45309', '#F59E0B'],
  ['#BE123C', '#FB7185'],
  ['#0E7490', '#22D3EE'],
];

const SIZE_MAP = {
  xs: { size: 28, fontSize: 10 },
  sm: { size: 36, fontSize: 12 },
  md: { size: 44, fontSize: 14 },
  lg: { size: 56, fontSize: 18 },
  xl: { size: 72, fontSize: 24 },
};

export function Avatar({ name, size = 'md', variant = 'default', onPress }: AvatarProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const cfg = SIZE_MAP[size];

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '•';

  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 0);
  const paletteIndex = Math.abs(hash) % PALETTE_COLORS.length;
  const gradient = PALETTE_COLORS[paletteIndex];

  const Content = () => (
    <View style={[styles.content, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}>
      <Text style={[styles.initials, { fontSize: cfg.fontSize }]} numberOfLines={1}>
        {initials}
      </Text>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientWrapper, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}
      >
        <Content />
      </LinearGradient>
    );
  }

  if (variant === 'ring') {
    return (
      <View style={[styles.ringWrapper, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ringOuter, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}
        >
          <View style={[styles.ringInner, { width: cfg.size - 5, height: cfg.size - 5, borderRadius: (cfg.size - 5) / 2 }]}>
            <Content />
          </View>
        </LinearGradient>
      </View>
    );
  }

  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      style={[styles.wrapper, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`Avatar de ${name}`}
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
      borderWidth: 1.5,
      borderColor: c.border,
      overflow: 'hidden',
    },
    gradientWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.md,
      overflow: 'hidden',
    },
    ringWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringOuter: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2.5,
      ...Shadow.sm,
    },
    ringInner: {
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
  });
