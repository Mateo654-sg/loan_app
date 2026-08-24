import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useCollections, useTodayCollections } from '@/features/collections/queries';
import type { CollectionItemDto, CollectionsFilter } from '@/features/collections/types';
import { formatIsoDateShort, formatMoneyCop } from '@/utils/money';

const FILTERS: { value: CollectionsFilter; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'Week' },
  { value: 'THIS_MONTH', label: 'Month' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'ALL', label: 'All' },
];

const classificationColors = (c: Palette): Record<string, string> => ({
  DUE_TODAY: c.primary,
  OVERDUE: c.danger,
  UPCOMING: c.text,
  PAID: c.success,
});

/**
 * Daily operations screen (UI_UX.md §47–52): answers who should pay today,
 * who is overdue and how much has been collected. All values come from the
 * backend; tapping Collect goes straight to that loan's payment form.
 */
export default function CollectionsScreen() {
  const c = usePalette();
  const styles = makeStyles(c);

function SummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const color =
    tone === 'success'
      ? c.success
      : tone === 'danger'
        ? c.danger
        : tone === 'warning'
          ? c.warning
          : c.text;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>
        {formatMoneyCop(value)}
      </Text>
    </View>
  );
}
function CollectionCard({ item }: { item: CollectionItemDto }) {
  const urgencyColor = classificationColors(c)[item.classification] ?? c.text;
  const isOverdue = item.days_overdue > 0;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.client_name}</Text>
        <Text style={{ color: urgencyColor, fontWeight: '700', fontSize: 11 }}>
          {isOverdue ? `${item.days_overdue}d overdue` : item.classification.replace('_', ' ')}
        </Text>
      </View>
      <Text style={styles.itemMeta}>
        Installment #{item.installment_number} · due {formatIsoDateShort(item.due_date)}
        {parseFloat(item.late_fee_projected) > 0
          ? ` · late fee ${formatMoneyCop(item.late_fee_projected)}`
          : ''}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemOutstanding}>{formatMoneyCop(item.total_outstanding)}</Text>
        <Link href={`/(app)/loans/${item.loan_id}`} asChild>
          <Pressable style={styles.collectButton}>
            <Text style={styles.collectButtonText}>Collect</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
  const [filter, setFilter] = useState<CollectionsFilter>('TODAY');
  const today = useTodayCollections();
  const list = useCollections(filter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Today's collections</Text>
        <Text style={styles.businessDate}>
          Business date: {today.data ? formatIsoDateShort(today.data.business_date) : '…'}
        </Text>

        {today.isPending ? (
          <ActivityIndicator />
        ) : today.data ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Expected" value={today.data.summary.expected_today} />
            <SummaryCard label="Collected" value={today.data.summary.collected_today} tone="success" />
            <SummaryCard label="Pending" value={today.data.summary.pending_today} tone="warning" />
            <SummaryCard label="Overdue" value={today.data.summary.overdue} tone="danger" />
          </View>
        ) : (
          <Text style={styles.error}>Could not load the daily summary.</Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, filter === option.value && styles.chipActive]}
              onPress={() => setFilter(option.value)}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {list.isPending ? (
          <ActivityIndicator />
        ) : list.isError ? (
          <Text style={styles.error}>Could not load collections.</Text>
        ) : list.data.items.length === 0 ? (
          <Text style={styles.empty}>Nothing to collect under this filter.</Text>
        ) : (
          list.data.items.map((item) => <CollectionCard key={item.installment_id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { padding: Spacing.md, gap: Spacing.sm },
  screenTitle: { fontSize: 20, fontWeight: '700' },
  businessDate: { fontSize: 12, opacity: c.mutedOpacity, marginBottom: Spacing.xs },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  summaryCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 4,
    gap: 2,
  },
  summaryLabel: { fontSize: 12, opacity: c.mutedOpacity },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  filterRow: { marginTop: Spacing.xs },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  empty: { textAlign: 'center', opacity: 0.6, paddingVertical: Spacing.lg },
  error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  itemCard: {
    gap: 4,
    padding: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 12, opacity: c.mutedOpacity },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  itemOutstanding: { fontSize: 17, fontWeight: '800' },
  collectButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  collectButtonText: { color: c.onPrimary, fontWeight: '600' },
});;
