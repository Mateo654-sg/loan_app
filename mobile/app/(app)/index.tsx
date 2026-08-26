import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  iconName,
  tone = 'neutral',
  c,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'success' | 'danger';
  c: Palette;
}) {
  const valueColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.text;
  const iconBg =
    tone === 'success' ? c.successSoft : tone === 'danger' ? c.dangerSoft : c.primarySoft;
  const iconColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.primary;
  const styles = makeStyles(c);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  href,
  label,
  iconName,
  bgTint,
  iconColor,
  c,
}: {
  href: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  bgTint: string;
  iconColor: string;
  c: Palette;
}) {
  const styles = makeStyles(c);
  return (
    <Link href={href as never} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={[styles.actionIconBox, { backgroundColor: bgTint }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

/**
 * Dashboard refinado UX/UI.
 */
export default function HomeScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);

  const [showBalance, setShowBalance] = useState(true);
  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const expectedNum = parseFloat(dashboard.data?.loans.today_collections_expected ?? '0');
  const pendingNum = parseFloat(dashboard.data?.loans.today_collections_pending ?? '0');
  const collectedPct =
    expectedNum > 0 ? Math.min(100, Math.round(((expectedNum - pendingNum) / expectedNum) * 100)) : 0;
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
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoMark}
        >
          <Text style={styles.logoChar}>₱</Text>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Skeleton de carga ────────────────────────────────────────── */}
        {dashboard.isPending ? (
          <SkeletonGroup gap={Spacing.sm}>
            <Skeleton height={140} />
            <View style={styles.rowGap}>
              <Skeleton height={82} width="48%" />
              <Skeleton height={82} width="48%" />
            </View>
            <View style={styles.rowGap}>
              <Skeleton height={82} width="48%" />
              <Skeleton height={82} width="48%" />
            </View>
            <Skeleton height={94} />
            <Skeleton height={52} />
          </SkeletonGroup>
        ) : dashboard.isError || !dashboard.data ? (
          /* ── Error ─────────────────────────────────────────────────── */
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={44} color={c.danger} />
            <Text style={styles.errorText}>No se pudo cargar el panel financiero.</Text>
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
            {/* ── Hero: Saldo personal con Gradiente ──────────────────── */}
            <LinearGradient
              colors={c.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>Saldo personal disponible</Text>
                <Pressable
                  onPress={() => setShowBalance((prev) => !prev)}
                  hitSlop={10}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="rgba(255,255,255,0.85)"
                  />
                </Pressable>
              </View>

              <Text style={styles.heroValue}>
                {showBalance
                  ? formatMoneyCop(dashboard.data.finance.balance)
                  : '$ ••••••••'}
              </Text>

              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <View style={styles.heroStatHeader}>
                    <Ionicons name="arrow-up-circle" size={14} color={c.onHeroSuccess} />
                    <Text style={styles.heroStatLabel}>Ingresos mes</Text>
                  </View>
                  <Text style={[styles.heroStatValue, { color: c.onHeroSuccess }]}>
                    {showBalance
                      ? formatMoneyCop(dashboard.data.finance.monthly_income)
                      : '$ ••••'}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={[styles.heroStat, styles.heroStatRight]}>
                  <View style={styles.heroStatHeader}>
                    <Ionicons name="arrow-down-circle" size={14} color={c.onHeroDanger} />
                    <Text style={styles.heroStatLabel}>Gastos mes</Text>
                  </View>
                  <Text style={[styles.heroStatValue, { color: c.onHeroDanger }]}>
                    {showBalance
                      ? formatMoneyCop(dashboard.data.finance.monthly_expenses)
                      : '$ ••••'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Resumen de préstamos ──────────────────────────────── */}
            <Text style={styles.sectionTitle}>Resumen de préstamos</Text>
            <View style={styles.grid}>
              <MetricCard
                label="Por cobrar"
                value={formatMoneyCop(dashboard.data.loans.total_receivable)}
                iconName="cash-outline"
                c={c}
              />
              <MetricCard
                label="Vencido"
                value={formatMoneyCop(dashboard.data.loans.total_overdue)}
                iconName="alert-circle-outline"
                tone="danger"
                c={c}
              />
              <MetricCard
                label="Capital prestado"
                value={formatMoneyCop(dashboard.data.loans.total_capital_lent)}
                iconName="wallet-outline"
                c={c}
              />
              <MetricCard
                label="Interés cobrado"
                value={formatMoneyCop(dashboard.data.loans.collected_interest)}
                iconName="trending-up-outline"
                tone="success"
                c={c}
              />
            </View>

            {/* ── Cobros de hoy ────────────────────────────────────── */}
            <Link href="/(app)/loans/collections" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.collectionsCard,
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View style={styles.collectionsHeader}>
                  <View style={styles.collectionsTitleRow}>
                    <View style={styles.collectionsIconBox}>
                      <Ionicons name="card-outline" size={20} color={c.primary} />
                    </View>
                    <Text style={styles.collectionsTitle}>Cobros de hoy</Text>
                  </View>
                  <View style={styles.linkHintRow}>
                    <Text style={[styles.linkHint, { color: c.primary }]}>Gestionar</Text>
                    <Ionicons name="chevron-forward" size={16} color={c.primary} />
                  </View>
                </View>

                <View style={styles.collectionsContent}>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Esperado hoy</Text>
                    <Text style={styles.collectionsStatValue}>
                      {formatMoneyCop(dashboard.data.loans.today_collections_expected)}
                    </Text>
                  </View>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Pendiente</Text>
                    <Text style={[styles.collectionsStatValue, { color: c.warning }]}>
                      {formatMoneyCop(dashboard.data.loans.today_collections_pending)}
                    </Text>
                  </View>
                </View>

                {/* Barra de progreso de recaudo */}
                {expectedNum > 0 ? (
                  <View style={styles.collectionProgressTrack}>
                    <View
                      style={[
                        styles.collectionProgressFill,
                        {
                          width: `${collectedPct}%`,
                          backgroundColor: c.success,
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </Pressable>
            </Link>

            {/* ── Metas ────────────────────────────────────────────── */}
            {dashboard.data.goals.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Metas activas</Text>
                {dashboard.data.goals.slice(0, 3).map((goal) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalTitleRow}>
                        <Ionicons name="flag-outline" size={18} color={c.primary} />
                        <Text style={styles.goalName}>{goal.name}</Text>
                      </View>
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
                      {formatMoneyCop(goal.current_amount)} de{' '}
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
                iconName="swap-horizontal-outline"
                bgTint={c.successSoft}
                iconColor={c.success}
                c={c}
              />
              <ActionButton
                href="/(app)/clients/new"
                label="Nuevo cliente"
                iconName="person-add-outline"
                bgTint={c.primarySoft}
                iconColor={c.primary}
                c={c}
              />
              <ActionButton
                href="/(app)/loans/new"
                label="Nuevo préstamo"
                iconName="document-text-outline"
                bgTint={c.accentSoft}
                iconColor={c.accent}
                c={c}
              />
              <ActionButton
                href="/(app)/finance"
                label="Finanzas"
                iconName="pie-chart-outline"
                bgTint={c.warningSoft}
                iconColor={c.warning}
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
              <Ionicons name="log-out-outline" size={16} color={c.textMuted} />
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
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    logoChar: { fontSize: 22, color: '#FFF', fontWeight: '800' },

    // Content
    container: {
      padding: Spacing.lg,
      gap: Spacing.md,
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
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      fontSize: Typography.sm,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: FontWeight.semibold,
      letterSpacing: 0.4,
    },
    eyeButton: {
      padding: 4,
    },
    heroValue: {
      fontSize: Typography.hero,
      fontWeight: FontWeight.black,
      color: c.onPrimary,
      letterSpacing: -1,
      marginVertical: 2,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.xs,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.18)',
    },
    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    heroStat: { flex: 1, gap: 2 },
    heroStatRight: { alignItems: 'flex-start' },
    heroStatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroStatLabel: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: FontWeight.medium,
    },
    heroStatValue: {
      fontSize: Typography.base,
      fontWeight: FontWeight.bold,
    },

    // Sección
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      marginTop: Spacing.xs,
      letterSpacing: -0.2,
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
      gap: 8,
      ...Shadow.sm,
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    metricIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricLabel: {
      fontSize: Typography.xs,
      color: c.textMuted,
      fontWeight: FontWeight.semibold,
      flex: 1,
    },
    metricValue: {
      fontSize: Typography.md,
      fontWeight: FontWeight.extrabold,
      color: c.text,
    },

    // Collections card
    collectionsCard: {
      backgroundColor: c.surface,
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    collectionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collectionsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs + 2,
    },
    collectionsIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionsTitle: {
      fontSize: Typography.base,
      fontWeight: FontWeight.bold,
      color: c.text,
    },
    linkHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    linkHint: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold,
    },
    collectionsContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: c.primarySofter,
      padding: Spacing.sm,
      borderRadius: Radius.sm,
    },
    collectionsStat: {
      gap: 2,
    },
    collectionsStatLabel: {
      fontSize: Typography.xs,
      color: c.textMuted,
      fontWeight: FontWeight.medium,
    },
    collectionsStatValue: {
      fontSize: Typography.base,
      fontWeight: FontWeight.extrabold,
      color: c.text,
    },
    collectionProgressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: c.borderSubtle,
      overflow: 'hidden',
    },
    collectionProgressFill: {
      height: '100%',
      borderRadius: 999,
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
    goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    goalName: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    goalPercent: { fontSize: Typography.sm, fontWeight: FontWeight.extrabold },
    progressTrack: {
      height: 7,
      borderRadius: 999,
      backgroundColor: c.primarySoft,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 999 },
    goalMeta: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },

    // Actions grid
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    actionButton: {
      flexBasis: '47%',
      flexGrow: 1,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      minHeight: 80,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.md,
      ...Shadow.sm,
    },
    actionIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: Typography.sm,
      fontWeight: FontWeight.bold,
      color: c.text,
      textAlign: 'center',
    },

    // Logout
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      marginTop: Spacing.xs,
    },
    logoutText: {
      color: c.textMuted,
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold,
    },

    // Error
    errorBox: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xl,
    },
    errorText: { color: c.danger, textAlign: 'center', fontWeight: FontWeight.medium },
    retryButton: {
      backgroundColor: c.primarySoft,
      borderRadius: Radius.button,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 4,
    },
    retryText: {
      color: c.primary,
      fontWeight: FontWeight.bold,
      fontSize: Typography.base,
    },
  });
