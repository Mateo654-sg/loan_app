import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FontWeight, Radius, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type LoanStatus = 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PENDING';
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

type StatusType = LoanStatus | InstallmentStatus;

const STATUS_CONFIG: Record<
  StatusType,
  {
    label: string;
    icon: string;
    gradient: readonly [string, string];
    glowColor: string;
    textColor: string;
  }
> = {
  // Loan statuses
  ACTIVE: {
    label: 'Activo',
    icon: 'radio-button-on',
    gradient: ['#3B2FBC', '#5A4FE8'],
    glowColor: '#3B2FBC',
    textColor: '#FFFFFF',
  },
  PAID: {
    label: 'Pagado',
    icon: 'checkmark-circle',
    gradient: ['#0D9668', '#10B981'],
    glowColor: '#0D9668',
    textColor: '#FFFFFF',
  },
  OVERDUE: {
    label: 'Vencido',
    icon: 'alert-circle',
    gradient: ['#DC2626', '#EF4444'],
    glowColor: '#DC2626',
    textColor: '#FFFFFF',
  },
  CANCELLED: {
    label: 'Cancelado',
    icon: 'close-circle',
    gradient: ['#6B728A', '#9CA3B8'],
    glowColor: '#6B728A',
    textColor: '#FFFFFF',
  },
  // Installment statuses
  PENDING: {
    label: 'Pendiente',
    icon: 'time',
    gradient: ['#6B728A', '#9CA3B8'],
    glowColor: '#6B728A',
    textColor: '#FFFFFF',
  },
  PARTIAL: {
    label: 'Parcial',
    icon: 'pie-chart',
    gradient: ['#D97706', '#F59E0B'],
    glowColor: '#D97706',
    textColor: '#FFFFFF',
  },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  customLabel?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  animated = true,
  customLabel,
}: StatusBadgeProps) {
  const c = usePalette();
  const config = STATUS_CONFIG[status];
  const styles = makeStyles(c);

  if (!config) {
    return <View style={styles.unknown}><Text style={styles.unknownText}>Desconocido</Text></View>;
  }

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label = customLabel ?? config.label;

  const sizeConfig = {
    sm: { paddingH: 8, paddingV: 3, fontSize: Typography.xs, iconSize: 10, radius: 8 },
    md: { paddingH: 12, paddingV: 5, fontSize: Typography.xs, iconSize: 11, radius: 10 },
    lg: { paddingH: 16, paddingV: 7, fontSize: Typography.sm, iconSize: 12, radius: 12 },
  }[size];

  const BadgeContent = () => (
    <View style={[styles.container, { borderRadius: sizeConfig.radius, paddingHorizontal: sizeConfig.paddingH, paddingVertical: sizeConfig.paddingV }]}>
      {showIcon && (
        <View style={styles.iconWrapper}>
          <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={sizeConfig.iconSize} color={config.textColor} />
        </View>
      )}
      <Text
        style={[
          styles.text,
          { fontSize: sizeConfig.fontSize, color: config.textColor, fontWeight: FontWeight.extrabold },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={config.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradientContainer,
        { borderRadius: sizeConfig.radius },
        animated ? animatedStyle : undefined,
      ].filter(Boolean) as any}
    >
      <BadgeContent />
    </LinearGradient>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    gradientContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    iconWrapper: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      letterSpacing: 0.4,
    },
    unknown: {
      backgroundColor: c.chipBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    unknownText: {
      color: c.textMuted,
      fontSize: Typography.xs,
      fontWeight: FontWeight.semibold,
    },
  });