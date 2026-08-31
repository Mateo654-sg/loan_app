import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { MoneyDisplay } from '@/components/ui/money-display';
import { Progress } from '@/components/ui/progress';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
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
  trend,
  c,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'primary';
  trend?: string;
  c: Palette;
}) {
  const valueColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'primary' ? c.primary : c.text;
  const iconBg =
    tone === 'success' ? c.successSoft : tone === 'danger' ? c.dangerSoft : tone === 'warning' ? c.warningSoft : tone === 'primary' ? c.primarySoft : c.chipBg;
  const iconColor =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'primary' ? c.primary : c.textMuted;
  const styles = makeStyles(c);

  return (
    <View style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <MoneyDisplay value={value} size="lg" tone={tone} weight="extrabold" />
      {trend && <Text style={[styles.metricTrend, { color: trend.startsWith('+') ? c.success : c.danger }]}>{trend}</Text>}
    </View>
  );
}

function ActionButton({
  href,
  label,
  iconName,
  gradient,
  c,
}: {
  href: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  c: Palette;
}) {
  const styles = makeStyles(c);
  return (
    <Link href={href as never} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionIconBox}
        >
          <Ionicons name={iconName} size={24} color="#FFF" />
        </LinearGradient>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function GoalCard({ goal, c }: { goal: any; c: Palette }) {
  const styles = makeStyles(c);
  return (
    <View style={[styles.goalCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <View style={styles.goalIconBox}>
            <Ionicons name="flag" size={20} color={c.primary} />
          </View>
          <Text style={styles.goalName}>{goal.name}</Text>
        </View>
        <MoneyDisplay value={goal.progress_percent} size="sm" tone="primary" showCurrency={false} suffix="%" />
      </View>
      <Progress value={goal.progress_percent} height={8} variant="premium" animated />
      <Text style={styles.goalMeta}>
        {formatMoneyCop(goal.current_amount)} de {formatMoneyCop(goal.target_amount)}
      </Text>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────

export default function HomeScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);

  const [showBalance, setShowBalance] = useState(true);
  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const expectedNum = parseFloat(dashboard.data?.loans.today_collections_expected ?? '0');
  const pendingNum = parseFloat(dashboard.data?.loans.today_collections_pending ?? '0');
  const collectedPct = expectedNum > 0 ? Math.min(100, Math.round(((expectedNum - pendingNum) / expectedNum) * 100)) : 0;
  const queryClient = useQueryClient();

  // Animaciones de entrada
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(20);

  useFocusEffect(
    useCallback(() => {
      // Animación de entrada escalonada
      heroOpacity.value = withDelay(100, withSpring(1, { damping: 20, stiffness: 120 }));
      heroTranslateY.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 120 }));

      cardsOpacity.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 120 }));
      cardsTranslateY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 120 }));

      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, [queryClient])
  );

  const firstName = (user?.full_name ?? '').split(' ')[0];

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header Premium ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Animated.Text style={[styles.greeting, heroAnimatedStyle]}> {firstName ? `Hola, ${firstName} 👋` : 'PocketPal'} </Animated.Text>
          {dashboard.data ? (
            <Animated.Text style={[styles.businessDate, heroAnimatedStyle]}> {dashboard.data.business_date} </Animated.Text>
          ) : null}
        </View>
        <LinearGradient
          colors={c.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoMark}
        >
          <Text style={styles.logoChar}>₱</Text>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={[{ paddingBottom: Spacing.xxl }, styles.container]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => void dashboard.refetch()}
            tintColor={c.primary}
            colors={[c.primary, c.accent]}
            progressBackgroundColor={c.surface}
          />
        }
      >
        {/* ── Skeleton de carga ────────────────────────────────────────── */}
        {dashboard.isPending ? (
          <SkeletonGroup gap={Spacing.md}>
            <Skeleton height={160} variant="card" />
            <View style={styles.rowGap}>
              <Skeleton height={90} width="48%" variant="card" />
              <Skeleton height={90} width="48%" variant="card" />
            </View>
            <View style={styles.rowGap}>
              <Skeleton height={90} width="48%" variant="card" />
              <Skeleton height={90} width="48%" variant="card" />
            </View>
            <Skeleton height={120} variant="card" />
            <Skeleton height={60} variant="card" />
          </SkeletonGroup>
        ) : dashboard.isError || !dashboard.data ? (
          /* ── Error State Premium ─────────────────────────────────────────────── */
          <View style={styles.errorBox}>
            <View style={styles.errorIconBox}>
              <Ionicons name="cloud-offline" size={48} color={c.danger} />
            </View>
            <Text style={styles.errorText}>No se pudo cargar el panel financiero</Text>
            <Text style={styles.errorSubtext}>Verifica tu conexión e inténtalo de nuevo</Text>
            <Button label="Reintentar" onPress={() => void dashboard.refetch()} variant="primary" size="md" />
          </View>
        ) : (
          <Animated.View style={[styles.contentWrapper, cardsAnimatedStyle]}>
            {/* ── Hero: Saldo personal con Gradiente Profundo ──────────────────── */}
            <LinearGradient colors={c.heroGradientDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard]}>
              <Animated.View style={heroAnimatedStyle}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>Saldo personal disponible</Text>
                <Pressable
                  onPress={() => setShowBalance((prev) => !prev)}
                  hitSlop={12}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showBalance ? 'eye' : 'eye-off'}
                    size={22}
                    color="rgba(255,255,255,0.9)"
                  />
                </Pressable>
              </View>

              <MoneyDisplay
                value={showBalance ? dashboard.data.finance.balance : '••••••••'}
                size="hero"
                tone="inverse"
                weight="black"
                letterSpacing={-1.5}
              />

              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <View style={styles.heroStatHeader}>
                    <Ionicons name="arrow-up-circle" size={14} color={c.successLight} />
                    <Text style={styles.heroStatLabel}>Ingresos mes</Text>
                  </View>
                  <MoneyDisplay
                    value={showBalance ? dashboard.data.finance.monthly_income : '••••'}
                    size="lg"
                    tone="inverse"
                    weight="extrabold"
                  />
                </View>

                <View style={styles.heroDivider} />

                <View style={[styles.heroStat, styles.heroStatRight]}>
                  <View style={styles.heroStatHeader}>
                    <Ionicons name="arrow-down-circle" size={14} color={c.dangerLight} />
                    <Text style={styles.heroStatLabel}>Gastos mes</Text>
                  </View>
                  <MoneyDisplay
                    value={showBalance ? dashboard.data.finance.monthly_expenses : '••••'}
                    size="lg"
                    tone="inverse"
                    weight="extrabold"
                  />
                </View>
              </View>
              </Animated.View>
              </LinearGradient>

            {/* ── Resumen de préstamos ──────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Resumen de préstamos</Text>
            <View style={styles.grid}>
              <MetricCard
                label="Por cobrar"
                value={formatMoneyCop(dashboard.data.loans.total_receivable)}
                iconName="cash"
                c={c}
              />
              <MetricCard
                label="Vencido"
                value={formatMoneyCop(dashboard.data.loans.total_overdue)}
                iconName="alert-circle"
                tone="danger"
                c={c}
              />
              <MetricCard
                label="Capital prestado"
                value={formatMoneyCop(dashboard.data.loans.total_capital_lent)}
                iconName="wallet"
                c={c}
              />
              <MetricCard
                label="Interés cobrado"
                value={formatMoneyCop(dashboard.data.loans.collected_interest)}
                iconName="trending-up"
                tone="success"
                c={c}
              />
            </View>

            {/* ── Cobros de hoy — Card Premium ────────────────────────────────── */}
            <Link href="/(app)/loans/collections" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.collectionsCard,
                  { backgroundColor: c.surface, borderColor: c.borderSubtle },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View style={styles.collectionsHeader}>
                  <View style={styles.collectionsTitleRow}>
                    <View style={styles.collectionsIconBox}>
                      <Ionicons name="card" size={22} color={c.primary} />
                    </View>
                    <Text style={styles.collectionsTitle}>Cobros de hoy</Text>
                  </View>
                  <View style={styles.linkHintRow}>
                    <Text style={[styles.linkHint, { color: c.primary }]}>Gestionar</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.primary} />
                  </View>
                </View>

                <View style={styles.collectionsContent}>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Esperado hoy</Text>
                    <MoneyDisplay
                      value={dashboard.data.loans.today_collections_expected}
                      size="lg"
                      weight="extrabold"
                    />
                  </View>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Cobrado</Text>
                    <MoneyDisplay
                      value={String(Math.max(0, expectedNum - pendingNum))}
                      size="lg"
                      tone="success"
                      weight="extrabold"
                    />
                  </View>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Pendiente</Text>
                    <MoneyDisplay
                      value={dashboard.data.loans.today_collections_pending}
                      size="lg"
                      tone="warning"
                      weight="extrabold"
                    />
                  </View>
                </View>

                {/* Barra de progreso de recaudo premium */}
                {expectedNum > 0 ? (
                  <>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progreso de recaudo</Text>
                      <Text style={[styles.progressValue, { color: c.success }]}>{collectedPct}%</Text>
                    </View>
                    <Progress value={collectedPct} height={10} variant="premium" animated />
                  </>
                ) : (
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Sin cobros programados hoy</Text>
                  </View>
                )}
              </Pressable>
            </Link>

            {/* ── Metas activas ────────────────────────────────────────────── */}
            {dashboard.data.goals.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Metas activas</Text>
                {dashboard.data.goals.slice(0, 3).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} c={c} />
                ))}
              </>
            ) : null}

            {/* ── Acciones rápidas — Grid Premium ─────────────────────────────── */}
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <View style={styles.actionsGrid}>
              <ActionButton
                href="/(app)/finance/new-transaction"
                label="Ingreso / Gasto"
                iconName="swap-horizontal"
                gradient={c.successGradient || [c.success, c.successLight]}
                c={c}
              />
              <ActionButton
                href="/(app)/clients/new"
                label="Nuevo cliente"
                iconName="person-add"
                gradient={c.primaryGradient}
                c={c}
              />
              <ActionButton
                href="/(app)/loans/new"
                label="Nuevo préstamo"
                iconName="document-text"
                gradient={c.accentGradient}
                c={c}
              />
              <ActionButton
                href="/(app)/finance"
                label="Ver finanzas"
                iconName="pie-chart"
                gradient={c.goldGradient}
                c={c}
              />
            </View>

            {/* ── Cerrar sesión ──────────────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.6 }]}
              onPress={() => void logoutUser()}
            >
              <Ionicons name="log-out" size={18} color={c.textMuted} />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos Premium ────────────────────────────────────────────────────────────

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
      fontSize: Typography.xxl,
      fontWeight: FontWeight.black,
      color: c.text,
      letterSpacing: LetterSpacing.tight,
    },
    businessDate: {
      fontSize: Typography.sm,
      color: c.textMuted,
      marginTop: 2,
      fontWeight: FontWeight.medium,
    },
    logoMark: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.lg,
    },
    logoChar: { fontSize: 24, color: '#FFF', fontWeight: '900' },

    // Content
    container: {
      padding: Spacing.lg,
      gap: Spacing.lg,
      paddingBottom: Spacing.xxxl,
    },
    contentWrapper: {
      // Wrapper for animated content
    },
    rowGap: { flexDirection: 'row', gap: Spacing.sm },

    // Hero card
    heroCard: {
      borderRadius: Radius.cardLg,
      padding: Spacing.xl,
      gap: Spacing.md,
      ...Shadow.xl,
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
      letterSpacing: LetterSpacing.wide,
    },
    eyeButton: { padding: 6 },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      marginTop: Spacing.sm,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
    },
    heroDivider: {
      width: 1,
      height: 32,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    heroStat: { flex: 1, gap: 4 },
    heroStatRight: { alignItems: 'flex-start' },
    heroStatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    heroStatLabel: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: FontWeight.medium,
    },

    // Sección
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      marginTop: Spacing.xs,
      letterSpacing: LetterSpacing.tight,
    },

    // Metric cards
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    metricCard: {
      flexBasis: '48%',
      flexGrow: 1,
      borderRadius: Radius.card,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.xs,
      ...Shadow.md,
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    metricIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricLabel: {
      fontSize: Typography.xs,
      color: c.textMuted,
      fontWeight: FontWeight.semibold,
      flex: 1,
    },
    metricTrend: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold,
      marginTop: 2,
    },

    // Collections card
    collectionsCard: {
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.md,
    },
    collectionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collectionsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    collectionsIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionsTitle: {
      fontSize: Typography.base,
      fontWeight: FontWeight.black,
      color: c.text,
    },
    linkHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    linkHint: {
      fontSize: Typography.xs,
      fontWeight: FontWeight.bold,
    },
    collectionsContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: c.primarySofter,
      padding: Spacing.md,
      borderRadius: Radius.md,
      gap: Spacing.sm,
    },
    collectionsStat: { flex: 1, gap: 2 },
    collectionsStatLabel: {
      fontSize: Typography.xs,
      color: c.textMuted,
      fontWeight: FontWeight.medium,
    },

    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    progressLabel: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.semibold },
    progressValue: { fontSize: Typography.xs, fontWeight: FontWeight.bold },

    // Goals
    goalCard: {
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.md,
    },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    goalIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalName: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    goalMeta: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },

    // Actions grid
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    actionButton: {
      flexBasis: '47%',
      flexGrow: 1,
      borderRadius: Radius.card,
      minHeight: 90,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.lg,
      ...Shadow.md,
    },
    actionIconBox: {
      width: 50,
      height: 50,
      borderRadius: 16,
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
      marginTop: Spacing.md,
    },
    logoutText: {
      color: c.textMuted,
      fontSize: Typography.sm,
      fontWeight: FontWeight.semibold,
    },

    // Error
    errorBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
    errorIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    errorText: { color: c.text, fontSize: Typography.lg, fontWeight: FontWeight.bold, textAlign: 'center' },
    errorSubtext: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center', marginBottom: Spacing.lg },
  });