import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FontWeight, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';

export type LoanStatus = 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PENDING';
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

type StatusType = LoanStatus | InstallmentStatus;

const STATUS_CONFIG: Record<StatusType, { label: string; icon: keyof typeof Ionicons.glyphMap; gradient: readonly [string, string] }> = {
  ACTIVE: { label: 'Activo', icon: 'radio-button-on', gradient: ['#3B2FBC', '#6366F1'] },
  PAID: { label: 'Pagado', icon: 'checkmark-circle', gradient: ['#0D9668', '#10B981'] },
  OVERDUE: { label: 'En mora', icon: 'alert-circle', gradient: ['#DC2626', '#F87171'] },
  CANCELLED: { label: 'Cancelado', icon: 'close-circle', gradient: ['#6B728A', '#9CA3B8'] },
  PENDING: { label: 'Pendiente', icon: 'time', gradient: ['#6B728A', '#9CA3B8'] },
  PARTIAL: { label: 'Parcial', icon: 'pie-chart', gradient: ['#D97706', '#F59E0B'] },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customLabel?: string;
}

export function StatusBadge({ status, size = 'md', showIcon = true, customLabel }: StatusBadgeProps) {
  const c = usePalette();
  const styles = makeStyles(c);
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <View style={styles.unknown} accessibilityLabel="Estado desconocido">
        <Text style={styles.unknownText}>Desconocido</Text>
      </View>
    );
  }

  const sizeCfg = {
    sm: { h: 8, v: 3, font: Typography.xs, icon: 10, radius: 8 },
    md: { h: 11, v: 5, font: Typography.xs, icon: 11, radius: 10 },
    lg: { h: 14, v: 7, font: Typography.sm, icon: 13, radius: 12 },
  }[size];

  return (
    <LinearGradient
      colors={config.gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientContainer, { borderRadius: sizeCfg.radius }]}
    >
      <View style={[styles.container, { borderRadius: sizeCfg.radius, paddingHorizontal: sizeCfg.h, paddingVertical: sizeCfg.v }]}>
        {showIcon ? (
          <View style={styles.iconWrapper}>
            <Ionicons name={config.icon} size={sizeCfg.icon} color="#FFFFFF" />
          </View>
        ) : null}
        <Text style={[styles.text, { fontSize: sizeCfg.font }]} numberOfLines={1}>
          {customLabel ?? config.label}
        </Text>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    gradientContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
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
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: '#FFFFFF',
      fontWeight: FontWeight.extrabold as any,
      letterSpacing: 0.35,
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
      fontWeight: FontWeight.semibold as any,
    },
  });
