import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontWeight, Shadow, Typography, LetterSpacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  variant?: 'default' | 'hero' | 'compact';
}

const SIZE_MAP = {
  sm: { box: 44, radius: 13, icon: 22, name: Typography.lg, gap: 6 },
  md: { box: 64, radius: 18, icon: 30, name: Typography.xl, gap: 8 },
  lg: { box: 76, radius: 22, icon: 36, name: Typography.xxl, gap: 8 },
  hero: { box: 96, radius: 28, icon: 46, name: Typography.xxxl, gap: 10 },
};

export function AppLogo({ size = 'md', showTagline = true, variant = 'default' }: AppLogoProps) {
  const c = usePalette();
  const cfg = SIZE_MAP[size];

  if (variant === 'compact') {
    return (
      <View style={[styles.compactRow, { gap: cfg.gap }]}>
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.compactBox, { width: cfg.box * 0.72, height: cfg.box * 0.72, borderRadius: cfg.radius * 0.72 }]}
        >
          <Text style={[styles.compactIcon, { fontSize: cfg.icon * 0.72 }]}>₱</Text>
        </LinearGradient>
        <Text style={[styles.compactName, { color: c.text, fontSize: cfg.name * 0.85 }]}>PocketPal</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { gap: cfg.gap }]}>
      <LinearGradient
        colors={variant === 'hero' ? c.primaryGradientDeep : c.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.iconBox,
          { width: cfg.box, height: cfg.box, borderRadius: cfg.radius },
          Shadow.lg,
          variant === 'hero' && Shadow.xl,
        ]}
      >
        <Text style={[styles.iconText, { fontSize: cfg.icon }]}>₱</Text>
        <View style={styles.shine} />
      </LinearGradient>
      <Text style={[styles.appName, { color: c.text, fontSize: cfg.name }]}>PocketPal</Text>
      {showTagline ? <Text style={[styles.tagline, { color: c.textMuted }]}>FINANZAS  ·  PRÉSTAMOS  ·  CONTROL</Text> : null}
      {variant === 'hero' ? <View style={[styles.divider, { backgroundColor: c.border }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: -1 },
  shine: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '-12deg' }],
    borderRadius: 999,
  },
  appName: {
    fontWeight: FontWeight.black as any,
    letterSpacing: LetterSpacing.tight,
  },
  tagline: {
    fontSize: Typography.xxs,
    fontWeight: FontWeight.bold as any,
    letterSpacing: LetterSpacing.ultra,
    marginTop: 2,
    opacity: 0.85,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 999,
    marginTop: 6,
    opacity: 0.18,
  },
  compactRow: { flexDirection: 'row', alignItems: 'center' },
  compactBox: { alignItems: 'center', justifyContent: 'center' },
  compactIcon: { color: '#FFFFFF', fontWeight: '900' },
  compactName: { fontWeight: FontWeight.extrabold as any, letterSpacing: -0.5 },
});
