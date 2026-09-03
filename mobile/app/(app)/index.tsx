import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay, withTiming } from 'react-native-reanimated';

import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { MoneyDisplay } from '@/components/ui/money-display';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useDashboard } from '@/features/dashboard/queries';
import { useAuthStore } from '@/stores/auth-store';
import { formatMoneyCop } from '@/utils/money';
import { getErrorMessage } from '@/utils/errors-es';

function MetricCard({ label, value, iconName, tone = 'neutral', c }: { label: string; value: string; iconName: keyof typeof Ionicons.glyphMap; tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'primary'; c: Palette }) {
  const styles = makeStyles(c);
  const iconBg = tone === 'success' ? c.successSoft : tone === 'danger' ? c.dangerSoft : tone === 'warning' ? c.warningSoft : tone === 'primary' ? c.primarySoft : c.chipBg;
  const iconColor = tone === 'success' ? c.success : tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'primary' ? c.primary : c.textMuted;
  const barColor = tone === 'success' ? c.success : tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'primary' ? c.primary : c.border;
  return (
    <View style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <View style={[styles.metricAccent, { backgroundColor: barColor }]} />
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={17} color={iconColor} />
        </View>
        <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
      </View>
      <MoneyDisplay value={formatMoneyCop(value)} size="lg" tone={tone === 'neutral' ? 'neutral' : tone} weight="extrabold" alreadyFormatted />
    </View>
  );
}

function ActionButton({ href, label, iconName, gradient, c }: { href: string; label: string; iconName: keyof typeof Ionicons.glyphMap; gradient: [string, string]; c: Palette }) {
  const styles = makeStyles(c);
  return (
    <Link href={href as never} asChild>
      <Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: c.surface, borderColor: c.borderSubtle }, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]} accessibilityRole="button" accessibilityLabel={label}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionIconBox}>
          <Ionicons name={iconName} size={22} color="#FFF" />
        </LinearGradient>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function GoalCard({ goal, c }: { goal: any; c: Palette }) {
  const styles = makeStyles(c);
  const pct = Math.max(0, Math.min(100, Number(goal.progress_percent) || 0));
  return (
    <View style={[styles.goalCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <View style={[styles.goalIconBox, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="flag" size={18} color={c.primary} />
          </View>
          <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
        </View>
        <View style={[styles.goalPctBadge, { backgroundColor: c.primarySoft }]}>
          <Text style={[styles.goalPctText, { color: c.primary }]}>{Math.round(pct)}%</Text>
        </View>
      </View>
      <Progress value={pct} height={8} variant="premium" animated />
      <Text style={styles.goalMeta}>{formatMoneyCop(goal.current_amount)} de {formatMoneyCop(goal.target_amount)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [showBalance, setShowBalance] = useState(true);
  const user = useAuthStore((s) => s.user);
  const dashboard = useDashboard();
  const queryClient = useQueryClient();

  const expectedNum = Number(dashboard.data?.loans.today_collections_expected ?? 0);
  const pendingNum = Number(dashboard.data?.loans.today_collections_pending ?? 0);
  const collectedNum = Math.max(0, expectedNum - pendingNum);
  const collectedPct = expectedNum > 0 ? Math.min(100, Math.round((collectedNum / expectedNum) * 100)) : 0;

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(24);
  const cardsOpacity = useSharedValue(0);
  const cardsY = useSharedValue(16);

  useFocusEffect(
    useCallback(() => {
      heroOpacity.value = withDelay(80, withTiming(1, { duration: 420 }));
      heroY.value = withDelay(80, withSpring(0, { damping: 20, stiffness: 130 }));
      cardsOpacity.value = withDelay(260, withTiming(1, { duration: 400 }));
      cardsY.value = withDelay(260, withSpring(0, { damping: 20, stiffness: 130 }));
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, [queryClient])
  );

  const firstName = (user?.full_name ?? '').trim().split(' ')[0] || 'Hola';
  const heroAnim = useAnimatedStyle(() => ({ opacity: heroOpacity.value, transform: [{ translateY: heroY.value }] }));
  const cardsAnim = useAnimatedStyle(() => ({ opacity: cardsOpacity.value, transform: [{ translateY: cardsY.value }] }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Animated.Text style={[styles.greeting, heroAnim]} numberOfLines={1}>{firstName ? `Hola, ${firstName} 👋` : 'PocketPal'}</Animated.Text>
          {dashboard.data ? <Animated.Text style={[styles.businessDate, heroAnim]}>{dashboard.data.business_date}</Animated.Text> : null}
        </View>
        <LinearGradient colors={c.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoMark}>
          <Text style={styles.logoChar}>₱</Text>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dashboard.isRefetching} onRefresh={() => void dashboard.refetch()} tintColor={c.primary} colors={[c.primary, c.accent]} progressBackgroundColor={c.surface} />}
      >
        {dashboard.isPending ? (
          <SkeletonGroup gap={Spacing.md}>
            <Skeleton height={178} variant="card" />
            <View style={styles.rowGap}>
              <Skeleton height={98} width="48%" variant="card" />
              <Skeleton height={98} width="48%" variant="card" />
            </View>
            <View style={styles.rowGap}>
              <Skeleton height={98} width="48%" variant="card" />
              <Skeleton height={98} width="48%" variant="card" />
            </View>
            <Skeleton height={132} variant="card" />
            <Skeleton height={110} variant="card" />
          </SkeletonGroup>
        ) : dashboard.isError || !dashboard.data ? (
          <View style={styles.errorBox}>
            <View style={[styles.errorIconBox, { backgroundColor: c.dangerSoft }]}>
              <Ionicons name="cloud-offline" size={42} color={c.danger} />
            </View>
            <Text style={styles.errorText}>No se pudo cargar el panel</Text>
            <Text style={styles.errorSubtext}>{getErrorMessage(dashboard.error)}</Text>
            <Button label="Reintentar" onPress={() => void dashboard.refetch()} variant="primary" size="md" iconName="refresh" />
          </View>
        ) : (
          <Animated.View style={cardsAnim}>
            {/* Hero saldo */}
            <LinearGradient colors={c.heroGradientDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <Animated.View style={heroAnim}>
                <View style={styles.heroHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.heroLiveDot} />
                    <Text style={styles.heroLabel}>Saldo disponible</Text>
                  </View>
                  <Pressable onPress={() => setShowBalance((p) => !p)} hitSlop={12} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}>
                    <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.92)" />
                  </Pressable>
                </View>

                <View style={{ marginTop: 8, minHeight: 44 }}>
                  {showBalance ? (
                    <MoneyDisplay value={formatMoneyCop(dashboard.data.finance.balance)} size="hero" tone="inverse" weight="black" letterSpacing={-1.2} alreadyFormatted />
                  ) : (
                    <Text style={styles.hiddenBalance}>•••• ••••</Text>
                  )}
                </View>

                <View style={styles.heroRow}>
                  <View style={styles.heroStat}>
                    <View style={styles.heroStatHeader}>
                      <View style={[styles.heroTrendDot, { backgroundColor: c.successLight }]} />
                      <Text style={styles.heroStatLabel}>Ingresos mes</Text>
                    </View>
                    {showBalance ? <MoneyDisplay value={formatMoneyCop(dashboard.data.finance.monthly_income)} size="md" tone="inverse" weight="extrabold" alreadyFormatted /> : <Text style={styles.hiddenSm}>••••</Text>}
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <View style={styles.heroStatHeader}>
                      <View style={[styles.heroTrendDot, { backgroundColor: c.dangerLight }]} />
                      <Text style={styles.heroStatLabel}>Gastos mes</Text>
                    </View>
                    {showBalance ? <MoneyDisplay value={formatMoneyCop(dashboard.data.finance.monthly_expenses)} size="md" tone="inverse" weight="extrabold" alreadyFormatted /> : <Text style={styles.hiddenSm}>••••</Text>}
                  </View>
                </View>

                <View style={styles.heroFooterRow}>
                  <Ionicons name="trending-up" size={12} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.heroFooterText}>Actualizado hoy · {dashboard.data.business_date}</Text>
                </View>
              </Animated.View>
            </LinearGradient>

            {/* Métricas préstamos */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Resumen de préstamos</Text>
              <Link href="/(app)/loans" asChild>
                <Pressable style={styles.sectionLink} accessibilityRole="button" accessibilityLabel="Ver préstamos">
                  <Text style={[styles.sectionLinkText, { color: c.primary }]}>Ver todo</Text>
                  <Ionicons name="chevron-forward" size={14} color={c.primary} />
                </Pressable>
              </Link>
            </View>

            <View style={styles.grid}>
              <MetricCard label="Por cobrar" value={dashboard.data.loans.total_receivable} iconName="wallet-outline" c={c} />
              <MetricCard label="En mora" value={dashboard.data.loans.total_overdue} iconName="alert-circle-outline" tone="danger" c={c} />
              <MetricCard label="Capital prestado" value={dashboard.data.loans.total_capital_lent} iconName="cash-outline" c={c} />
              <MetricCard label="Interés cobrado" value={dashboard.data.loans.collected_interest} iconName="trending-up-outline" tone="success" c={c} />
            </View>

            {/* Cobros de hoy */}
            <Link href="/(app)/loans/collections" asChild>
              <Pressable style={({ pressed }) => [styles.collectionsCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }, pressed && { opacity: 0.86 }]} accessibilityRole="button" accessibilityLabel="Cobros de hoy">
                <View style={styles.collectionsHeader}>
                  <View style={styles.collectionsTitleRow}>
                    <View style={[styles.collectionsIconBox, { backgroundColor: c.primarySoft }]}>
                      <Ionicons name="calendar" size={20} color={c.primary} />
                    </View>
                    <View>
                      <Text style={styles.collectionsTitle}>Cobros de hoy</Text>
                      <Text style={[styles.collectionsSubtitle, { color: c.textMuted }]}>{expectedNum > 0 ? `${collectedPct}% completado` : 'Sin cobros programados'}</Text>
                    </View>
                  </View>
                  <View style={[styles.collectionsChevron, { backgroundColor: c.primarySoft }]}>
                    <Ionicons name="chevron-forward" size={16} color={c.primary} />
                  </View>
                </View>

                <View style={[styles.collectionsContent, { backgroundColor: c.primarySofter, borderColor: c.borderSubtle }]}>
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Esperado</Text>
                    <MoneyDisplay value={formatMoneyCop(dashboard.data.loans.today_collections_expected)} size="sm" weight="extrabold" alreadyFormatted />
                  </View>
                  <View style={styles.collectionsDivider} />
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Cobrado</Text>
                    <MoneyDisplay value={formatMoneyCop(String(collectedNum))} size="sm" tone="success" weight="extrabold" alreadyFormatted />
                  </View>
                  <View style={styles.collectionsDivider} />
                  <View style={styles.collectionsStat}>
                    <Text style={styles.collectionsStatLabel}>Pendiente</Text>
                    <MoneyDisplay value={formatMoneyCop(dashboard.data.loans.today_collections_pending)} size="sm" tone="warning" weight="extrabold" alreadyFormatted />
                  </View>
                </View>

                {expectedNum > 0 ? (
                  <View style={{ gap: 8, marginTop: 2 }}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progreso de recaudo</Text>
                      <Text style={[styles.progressValue, { color: collectedPct === 100 ? c.success : c.primary }]}>{collectedPct}%</Text>
                    </View>
                    <Progress value={collectedPct} height={10} variant="premium" animated />
                  </View>
                ) : null}
              </Pressable>
            </Link>

            {/* Metas */}
            {dashboard.data.goals.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Metas activas</Text>
                {dashboard.data.goals.slice(0, 3).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} c={c} />
                ))}
                <Link href="/(app)/finance/goals" asChild>
                  <Pressable style={styles.linkRow} accessibilityRole="button">
                    <Text style={[styles.linkText, { color: c.primary }]}>Ver todas las metas</Text>
                    <Ionicons name="arrow-forward" size={14} color={c.primary} />
                  </Pressable>
                </Link>
              </>
            ) : null}

            {/* Acciones rápidas */}
            <Text style={styles.sectionTitle}>Acciones rápidas</Text>
            <View style={styles.actionsGrid}>
              <ActionButton href="/(app)/finance/new-transaction" label="Ingreso / Gasto" iconName="swap-horizontal" gradient={c.successGradient} c={c} />
              <ActionButton href="/(app)/clients/new" label="Nuevo cliente" iconName="person-add" gradient={c.primaryGradient} c={c} />
              <ActionButton href="/(app)/loans/new" label="Nuevo préstamo" iconName="document-text" gradient={c.accentGradient} c={c} />
              <ActionButton href="/(app)/finance" label="Finanzas" iconName="pie-chart" gradient={c.goldGradient} c={c} />
            </View>

          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    greeting: { fontSize: Typography.xxl, fontWeight: FontWeight.black as any, color: c.text, letterSpacing: LetterSpacing.tight },
    businessDate: { fontSize: Typography.sm, color: c.textMuted, marginTop: 2, fontWeight: FontWeight.medium as any },
    logoMark: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
    logoChar: { fontSize: 24, color: '#FFF', fontWeight: '900' },
    container: { padding: Spacing.lg, gap: Spacing.lg },
    rowGap: { flexDirection: 'row', gap: Spacing.sm },
    errorBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
    errorIconBox: { width: 76, height: 76, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    errorText: { color: c.text, fontSize: Typography.lg, fontWeight: FontWeight.bold as any, textAlign: 'center' },
    errorSubtext: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center', marginBottom: Spacing.sm },
    heroCard: { borderRadius: Radius.cardLg, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.xl, overflow: 'hidden' },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLiveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#34D399', shadowColor: '#34D399', shadowOpacity: 0.8, shadowRadius: 6 },
    heroLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FontWeight.semibold as any, letterSpacing: LetterSpacing.wide, textTransform: 'uppercase' },
    eyeButton: { padding: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
    hiddenBalance: { fontSize: Typography.hero, fontWeight: FontWeight.black as any, color: '#FFF', letterSpacing: 4, opacity: 0.9 },
    hiddenSm: { fontSize: Typography.base, fontWeight: FontWeight.bold as any, color: '#FFF', letterSpacing: 3, opacity: 0.85 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
    heroDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.16)' },
    heroStat: { flex: 1, gap: 5 },
    heroStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroTrendDot: { width: 6, height: 6, borderRadius: 999 },
    heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.72)', fontWeight: FontWeight.semibold as any, letterSpacing: 0.5, textTransform: 'uppercase' },
    heroFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, opacity: 0.85 },
    heroFooterText: { fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: FontWeight.medium as any },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
    sectionTitle: { fontSize: Typography.md, fontWeight: FontWeight.extrabold as any, color: c.text, letterSpacing: LetterSpacing.tight, marginTop: Spacing.xs },
    sectionLink: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4, paddingHorizontal: 6 },
    sectionLinkText: { fontSize: Typography.sm, fontWeight: FontWeight.bold as any },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
    metricCard: { flexBasis: '48%', flexGrow: 1, borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, overflow: 'hidden', ...Shadow.md },
    metricAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    metricIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    metricLabel: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.semibold as any, flex: 1 },
    collectionsCard: { borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, ...Shadow.md },
    collectionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    collectionsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    collectionsIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    collectionsTitle: { fontSize: Typography.base, fontWeight: FontWeight.black as any, color: c.text },
    collectionsSubtitle: { fontSize: Typography.xs, fontWeight: FontWeight.medium as any, marginTop: 1 },
    collectionsChevron: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    collectionsContent: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, padding: Spacing.sm, gap: Spacing.xs, borderWidth: 1 },
    collectionsStat: { flex: 1, alignItems: 'center', gap: 3 },
    collectionsStatLabel: { fontSize: 10, color: c.textMuted, fontWeight: FontWeight.semibold as any, textTransform: 'uppercase', letterSpacing: 0.5 },
    collectionsDivider: { width: 1, height: 36, backgroundColor: c.border, opacity: 0.7 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.semibold as any },
    progressValue: { fontSize: Typography.sm, fontWeight: FontWeight.black as any },
    goalCard: { borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, ...Shadow.md },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    goalIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    goalName: { fontSize: Typography.base, fontWeight: FontWeight.bold as any, color: c.text, flex: 1 },
    goalPctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    goalPctText: { fontSize: Typography.xs, fontWeight: FontWeight.extrabold as any },
    goalMeta: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium as any },
    linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm },
    linkText: { fontSize: Typography.sm, fontWeight: FontWeight.bold as any },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
    actionButton: { flexBasis: '47%', flexGrow: 1, borderRadius: Radius.card, minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderWidth: 1, ...Shadow.md },
    actionIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    actionText: { fontSize: Typography.sm, fontWeight: FontWeight.bold as any, color: c.text, textAlign: 'center' },
  });
