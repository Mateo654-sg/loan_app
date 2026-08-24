import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteLoans } from '@/features/loans/queries';
import type { LoanDto } from '@/features/loans/types';
import { formatMoneyCop } from '@/utils/money';

const STATUS_FILTERS = ['ACTIVE', 'OVERDUE', 'PAID', 'CANCELLED', 'ALL'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const statusColors = (c: Palette): Record<string, string> => ({
  ACTIVE: c.primary,
  OVERDUE: c.danger,
  PAID: c.success,
  CANCELLED: c.border,
});

export default function LoansScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const loans = useInfiniteLoans(statusFilter === 'ALL' ? {} : { status: statusFilter });
  const items = loans.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: LoanDto }) => (
    <Link href={`/(app)/loans/${item.id}`} asChild>
      <Pressable style={styles.row}>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.client_name}</Text>
          <Text style={styles.rowSubtitle}>
            {formatMoneyCop(item.principal)} · {item.number_of_installments} installments ·{' '}
            {item.amortization_type === 'FRENCH' ? 'French' : 'Fixed'}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.outstanding}>{formatMoneyCop(item.total_outstanding)}</Text>
          <Text style={[styles.badge, { color: statusColors(c)[item.status], borderColor: statusColors(c)[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <Link href="/(app)/loans/collections" asChild>
          <Pressable style={styles.collectionsButton}>
            <Text style={styles.collectionsText}>Today's collections →</Text>
          </Pressable>
        </Link>
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, statusFilter === value && styles.chipActive]}
              onPress={() => setStatusFilter(value)}
            >
              <Text>{value === 'ALL' ? 'All' : value}</Text>
            </Pressable>
          ))}
        </View>

        {loans.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.lg }} />
        ) : loans.isError ? (
          <Text style={styles.error}>Could not load loans. Check the backend and retry.</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No loans here</Text>
            <Text style={styles.emptySubtitle}>Create a loan for one of your customers.</Text>
            <Link href="/(app)/loans/new" asChild>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ New loan</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListFooterComponent={
              loans.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void loans.fetchNextPage()}
                  disabled={loans.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {loans.isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}

        {items.length > 0 || loans.isPending ? (
          <Link href="/(app)/loans/new" asChild>
            <Pressable style={styles.fab}>
              <Text style={styles.fabText}>+ New loan</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowSubtitle: { fontSize: 13, opacity: c.mutedOpacity },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  outstanding: { fontSize: 15, fontWeight: '700' },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 3,
  },
  loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: c.primary, fontWeight: '600' },
  emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { textAlign: 'center', opacity: 0.6 },
  emptyButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyButtonText: { color: c.onPrimary, fontWeight: '600' },
  fab: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: c.onPrimary, fontWeight: '700' },
  error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  collectionsButton: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primary,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionsText: { color: c.primary, fontWeight: '600' },
});;
