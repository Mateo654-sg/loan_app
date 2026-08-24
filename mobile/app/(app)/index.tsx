import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useDashboard } from '@/features/dashboard/queries';
import { logoutUser } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { formatMoneyCop } from '@/utils/money';

/**
 * Dashboard (UI_UX.md §6–13): actionable financial information first.
 * Every value comes from the consolidated backend read-model; nothing is
 * computed client-side. Data refetches on every focus so the numbers stay
 * current after financial mutations done elsewhere.
 */
export default function HomeScreen() {
  const c = usePalette();
  const styles = makeStyles(c);

function SkeletonBox({
  height,
  flex,
}: {
  height: number;
  flex?: boolean;
}) {
  return <View style={[styles.skeleton, { height }, flex && { flexGrow: 1 }]} />;
}
function MetricCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const color =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.text;

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
function ActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable style={styles.actionButton}>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Link>
  );
}
  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboard();
  const queryClient = useQueryClient();

  // Financial mutations elsewhere invalidate ['dashboard']; refetching on
  // focus also covers changes made outside the app session.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }, [queryClient])
  );

  const firstName = (user?.full_name ?? '').split(' ')[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>
          {firstName ? `Hello, ${firstName}` : 'PocketPal'}
        </Text>
        {dashboard.data ? (
          <Text style={styles.businessDate}>
            Business date: {dashboard.data.business_date}
          </Text>
        ) : null}

        {dashboard.isPending ? (
          <View style={styles.skeletonGroup} accessibilityLabel="Loading dashboard">
            <SkeletonBox height={92} />
            <View style={styles.rowGap}>
              <SkeletonBox height={64} flex />
              <SkeletonBox height={64} flex />
            </View>
            <SkeletonBox height={64} />
            <SkeletonBox height={56} />
          </View>
        ) : dashboard.isError || !dashboard.data ?(
          <>
            <Text style={styles.error}>Could not load your dashboard.</Text>
            <Pressable style={styles.retryButton} onPress={() => void dashboard.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Personal finance */}
            <View style={[styles.heroCard]}>
              <Text style={styles.heroLabel}>Personal balance</Text>
              <Text style={styles.heroValue}>
                {formatMoneyCop(dashboard.data.finance.balance)}
              </Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroSide, { color: c.success }]}>
                  +{formatMoneyCop(dashboard.data.finance.monthly_income)} this month
                </Text>
                <Text style={[styles.heroSide, { color: c.danger }]}>
                  −{formatMoneyCop(dashboard.data.finance.monthly_expenses)}
                </Text>
              </View>
            </View>

            {/* Lending */}
            <Text style={styles.sectionTitle}>Lending overview</Text>
            <View style={styles.grid}>
              <MetricCard label="Total receivable" value={formatMoneyCop(dashboard.data.loans.total_receivable)} />
              <MetricCard label="Overdue" value={formatMoneyCop(dashboard.data.loans.total_overdue)} tone="danger" />
              <MetricCard label="Capital lent" value={formatMoneyCop(dashboard.data.loans.total_capital_lent)} />
              <MetricCard label="Interest collected" value={formatMoneyCop(dashboard.data.loans.collected_interest)} tone="success" />
            </View>

            {/* Today's collections summary with deep link */}
            <Link href="/(app)/loans/collections" asChild>
              <Pressable style={styles.collectionsCard}>
                <Text style={styles.sectionTitle}>Today's collections</Text>
                <Text style={styles.collectionsLine}>
                  Expected {formatMoneyCop(dashboard.data.loans.today_collections_expected)} · Pending{' '}
                  {formatMoneyCop(dashboard.data.loans.today_collections_pending)}
                </Text>
                <Text style={styles.linkHint}>Open collections →</Text>
              </Pressable>
            </Link>

            {/* Goals progress */}
            {dashboard.data.goals.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Goals</Text>
                {dashboard.data.goals.slice(0, 3).map((goal) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalPercent}>{goal.progress_percent}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${goal.progress_percent}%` }]} />
                    </View>
                    <Text style={styles.goalMeta}>
                      {formatMoneyCop(goal.current_amount)} / {formatMoneyCop(goal.target_amount)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.actionsGrid}>
              <ActionLink href="/(app)/finance/new-transaction" label="+ Income/Expense" />
              <ActionLink href="/(app)/clients/new" label="+ Customer" />
              <ActionLink href="/(app)/loans/new" label="+ Loan" />
              <ActionLink href="/(app)/finance" label="Finanzas" />
            </View>

            {/* Session exit lives here until the Settings section ships */}
            <Pressable style={styles.logoutLink} onPress={() => void logoutUser()}>
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.sm },
  greeting: { fontSize: 24, fontWeight: '700' },
  businessDate: { fontSize: 12, opacity: c.mutedOpacity },
  heroCard: {
    gap: 4,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  heroLabel: { fontSize: 13, opacity: c.mutedOpacity },
  heroValue: { fontSize: 30, fontWeight: '800' },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  heroSide: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 4,
    gap: 2,
  },
  metricLabel: { fontSize: 12, opacity: c.mutedOpacity },
  metricValue: { fontSize: 15, fontWeight: '800' },
  collectionsCard: {
    gap: 2,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primary,
  },
  collectionsLine: { fontSize: 13 },
  linkHint: { fontSize: 12, color: c.primary, fontWeight: '600', marginTop: 2 },
  goalCard: {
    gap: 4,
    padding: Spacing.sm + 4,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalName: { fontSize: 14, fontWeight: '600' },
  goalPercent: { fontSize: 12, fontWeight: '700', color: c.primary },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.primarySoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: c.primary },
  goalMeta: { fontSize: 11, opacity: c.mutedOpacity },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionButton: {
    flexGrow: 1,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  error: { color: c.danger, textAlign: 'center', paddingVertical: Spacing.md },
  retryButton: {
    alignSelf: 'center',
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  retryText: { fontWeight: '600' },
  logoutLink: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  logoutText: { color: c.danger, fontSize: 14 },
  skeletonGroup: { gap: Spacing.sm },
  rowGap: { flexDirection: 'row', gap: Spacing.sm },
  skeleton: {
    borderRadius: Radius.card,
    backgroundColor: c.primarySoft,
    opacity: 0.6,
    width: '100%',
  },
});;
