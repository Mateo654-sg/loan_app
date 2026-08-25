import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useDashboard } from '@/features/dashboard/queries';
import { logoutUser } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { formatMoneyCop } from '@/utils/money';

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  tone = 'neutral',
  c,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
  c: Palette;
}) {
  const valueColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.text;
  const styles = makeStyles(c);
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  href,
  label,
  emoji,
  c,
}: {
  href: string;
  label: string;
  emoji: string;
  c: Palette;
}) {
  const styles = makeStyles(c);
  return (
    <Link href={href as never} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && { opacity: 0.75 },
        ]}
      >
        <Text style={styles.actionEmoji}>{emoji}</Text>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

/**
 * Dashboard (información financiera accionable primero).
 * Los datos vienen del read-model del backend; nada se calcula en cliente.
 * Se refresca en cada focus para mantenerse actualizado.
 */
export default function HomeScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);

  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, [queryClient])
  );

  const firstName = (user?.full_name ?? '').split(' ')[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {firstName ? `Hola, ${firstName} 👋` : 'PocketPal'}
          </Text>
          {dashboard.data ? (
            <Text style={styles.businessDate}>
              {dashboard.data.business_date}
            </Text>
          ) : null}
        </View>
        <View style={[styles.logoMark, { backgroundColor: c.primary }]}>
          <Text style={styles.logoChar}>₱</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Skeleton de carga ────────────────────────────────────────── */}
        {dashboard.isPending ? (
          <SkeletonGroup gap={Spacing.sm}>
            <Skeleton height={110} />
            <View style={styles.rowGap}>
              <Skeleton height={72} width="48%" />
              <Skeleton height={72} width="48%" />
            </View>
            <View style={styles.rowGap}>
              <Skeleton height={72} width="48%" />
              <Skeleton height={72} width="48%" />
            </View>
            <Skeleton height={88} />
            <Skeleton height={52} />
          </SkeletonGroup>
        ) : dashboard.isError || !dashboard.data ? (
          /* ── Error ─────────────────────────────────────────────────── */
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>No se pudo cargar el panel.</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => void dashboard.refetch()}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── Hero: Saldo personal ──────────────────────────────── */}
            <View style={[styles.heroCard, { backgroundColor: c.primary }]}>
              <Text style={styles.heroLabel}>Saldo personal</Text>
              <Text style={styles.heroValue}>
                {formatMoneyCop(dashboard.data.finance.balance)}
              </Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>↑ Ingresos este mes</Text>
                  <Text style={[styles.heroStatValue, { color: '#86EFAC' }]}>
                    {formatMoneyCop(dashboard.data.finance.monthly_income)}
                  </Text>
                </View>
                <View style={[styles.heroStat, styles.heroStatRight]}>
                  <Text style={styles.heroStatLabel}>↓ Gastos este mes</Text>
                  <Text style={[styles.heroStatValue, { color: '#FCA5A5' }]}>
                    {formatMoneyCop(dashboard.data.finance.monthly_expenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Resumen de préstamos ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>Resumen de préstamos</Text>
            <View style={styles.grid}>
              <MetricCard
                label="Por cobrar"
                value={formatMoneyCop(dashboard.data.loans.total_receivable)}
                c={c}
              />
              <MetricCard
                label="Vencido"
                value={formatMoneyCop(dashboard.data.loans.total_overdue)}
                tone="danger"
                c={c}
              />
              <MetricCard
                label="Capital prestado"
                value={formatMoneyCop(dashboard.data.loans.total_capital_lent)}
                c={c}
              />
              <MetricCard
                label="Interés cobrado"
                value={formatMoneyCop(dashboard.data.loans.collected_interest)}
                tone="success"
                c={c}
              />
            </View>

            {/* ── Cobros de hoy ────────────────────────────────────── */}
            <Link href="/(app)/loans/collections" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.collectionsCard,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.collectionsHeader}>
                  <Text style={styles.sectionTitle}>Cobros de hoy</Text>
                  <Text style={[styles.linkHint, { color: c.primary }]}>Ver todos →</Text>
                </View>
                <Text style={styles.collectionsLine}>
                  Esperado {formatMoneyCop(dashboard.data.loans.today_collections_expected)}
                  {' · '}Pendiente{' '}
                  {formatMoneyCop(dashboard.data.loans.today_collections_pending)}
                </Text>
              </Pressable>
            </Link>

            {/* ── Metas ────────────────────────────────────────────── */}
            {dashboard.data.goals.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Metas</Text>
                {dashboard.data.goals.slice(0, 3).map((goal) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={[styles.goalPercent, { color: c.primary }]}>
                        {goal.progress_percent}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${goal.progress_percent}%` as `${number}%`,
                            backgroundColor: c.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.goalMeta}>
                      {formatMoneyCop(goal.current_amount)} /{' '}
                      {formatMoneyCop(goal.target_amount)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {/* ── Acciones rápidas ─────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <View style={styles.actionsGrid}>
              <ActionButton
                href="/(app)/finance/new-transaction"
                label="Ingreso/Gasto"
                emoji="💰"
                c={c}
              />
              <ActionButton
                href="/(app)/clients/new"
                label="Nuevo cliente"
                emoji="👤"
                c={c}
              />
              <ActionButton
                href="/(app)/loans/new"
                label="Nuevo préstamo"
                emoji="📋"
                c={c}
              />
              <ActionButton
                href="/(app)/finance"
                label="Finanzas"
                emoji="📊"
                c={c}
              />
            </View>

            {/* ── Cerrar sesión ────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => void logoutUser()}
            >
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    greeting: {
      fontSize: Typography.xl,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      letterSpacing: -0.4,
    },
    businessDate: {
      fontSize: Typography.sm,
      color: c.textMuted,
      marginTop: 2,
    },
    logoMark: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoChar: { fontSize: 20, color: '#FFF', fontWeight: '800' },

    // Content
    container: {
      padding: Spacing.lg,
      gap: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
    rowGap: { flexDirection: 'row', gap: Spacing.sm },

    // Hero card (saldo personal)
    heroCard: {
      borderRadius: Radius.cardLg,
      padding: Spacing.lg,
      gap: Spacing.sm,
      ...Shadow.lg,
    },
    heroLabel: {
      fontSize: Typography.sm,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: FontWeight.semibold,
      letterSpacing: 0.5,
    },
    heroValue: {
      fontSize: Typography.hero,
      fontWeight: FontWeight.black,
      color: '#FFFFFF',
      letterSpacing: -1,
    },
    heroRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xs,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
    },
    heroStat: { flex: 1, gap: 2 },
    heroStatRight: { alignItems: 'flex-end' },
    heroStatLabel: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.65)',
    },
    heroStatValue: {
      fontSize: Typography.base,
      fontWeight: FontWeight.bold,
    },

    // Sección
    sectionTitle: {
      fontSize: Typography.base,
      fontWeight: FontWeight.bold,
      color: c.text,
      marginTop: Spacing.xs,
      letterSpacing: 0.1,
    },

    // Metric cards
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    metricCard: {
      flexBasis: '48%',
      flexGrow: 1,
      borderRadius: Radius.card,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: 4,
      ...Shadow.sm,
    },
    metricLabel: {
      fontSize: Typography.xs,
      color: c.textMuted,
      fontWeight: FontWeight.medium,
    },
    metricValue: {
      fontSize: Typography.base,
      fontWeight: FontWeight.extrabold,
      color: c.text,
    },

    // Collections card
    collectionsCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: 6,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    collectionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collectionsLine: {
      fontSize: Typography.sm,
      color: c.textMuted,
    },
    linkHint: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.bold,
    },

    // Goals
    goalCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: 8,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalName: { fontSize: Typography.base, fontWeight: FontWeight.semibold, color: c.text },
    goalPercent: { fontSize: Typography.sm, fontWeight: FontWeight.bold },
    progressTrack: {
      height: 7,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 999 },
    goalMeta: { fontSize: Typography.xs, color: c.textMuted },

    // Actions grid
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    actionButton: {
      flexBasis: '47%',
      flexGrow: 1,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: Spacing.sm,
      ...Shadow.sm,
    },
    actionEmoji: { fontSize: 24 },
    actionText: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold,
      color: c.text,
      textAlign: 'center',
    },

    // Logout
    logoutButton: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    logoutText: {
      color: c.textMuted,
      fontSize: Typography.sm,
      fontWeight: FontWeight.medium,
    },

    // Error
    errorBox: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xl,
    },
    errorIcon: { fontSize: 40 },
    errorText: { color: c.danger, textAlign: 'center' },
    retryButton: {
      backgroundColor: c.primarySoft,
      borderRadius: Radius.button,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 4,
    },
    retryText: {
      color: c.primary,
      fontWeight: FontWeight.semibold,
      fontSize: Typography.base,
    },
  });
