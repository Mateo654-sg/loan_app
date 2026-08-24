import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import {
  useCancelTransaction,
  useCategories,
  useFinanceSummary,
  useInfiniteTransactions,
} from '@/features/finance/queries';
import type { TransactionDto } from '@/features/finance/types';
import { formatIsoDateShort, formatMoneyCop } from '@/utils/money';

type TypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';

const PAGE_SIZE = 20;

export default function FinanceScreen() {
  const c = usePalette();
  const styles = makeStyles(c);

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'danger';
}) {
  const color =
    tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.text;
  return (
    <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const filters = typeFilter === 'ALL' ? {} : { type: typeFilter };

  const summary = useFinanceSummary();
  const transactions = useInfiniteTransactions({ ...filters, page_size: PAGE_SIZE });
  const allItems = transactions.data?.pages.flatMap((page) => page.items) ?? [];
  const hasNextPage = transactions.hasNextPage;
  const categories = useCategories();
  const cancelTransaction = useCancelTransaction();

  const categoryNameById = new Map(categories.data?.map((c) => [c.id, c.name] as const));

  const confirmCancel = (transaction: TransactionDto) => {
    Alert.alert(
      'Cancel transaction?',
      `This will exclude ${formatMoneyCop(transaction.amount)} from your balance. The record is kept for history.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel transaction',
          style: 'destructive',
          onPress: () => cancelTransaction.mutate(transaction.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: TransactionDto }) => (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.description || categoryNameById.get(item.category_id) || 'Transaction'}
        </Text>
        <Text style={styles.rowSubtitle}>
          {categoryNameById.get(item.category_id) ?? ''} · {formatIsoDateShort(item.transaction_date)}
          {item.status === 'CANCELLED' ? ' · CANCELLED' : ''}
        </Text>
      </View>
      <Text
        style={[
          styles.rowAmount,
          { color: item.type === 'INCOME' ? c.success : c.danger },
        ]}
      >
        {item.type === 'INCOME' ? '+' : '−'}
        {formatMoneyCop(item.amount)}
      </Text>
      {item.status === 'ACTIVE' ? (
        <Pressable
          onPress={() => confirmCancel(item)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel transaction"
        >
          <Text style={styles.rowAction}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const listFooter = () => {
    if (transactions.isPending) return <ActivityIndicator style={{ padding: Spacing.md }} />;
    if (transactions.isError) {
      return (
        <Text style={styles.errorText}>
          Could not load transactions. Pull to retry or check the backend.
        </Text>
      );
    }
    if (allItems.length === 0) {
      return <Text style={styles.emptyText}>No transactions yet. Add your first one above.</Text>;
    }
    if (hasNextPage) {
      return (
        <Pressable
          style={styles.loadMore}
          onPress={() => void transactions.fetchNextPage()}
          disabled={transactions.isFetchingNextPage}
        >
          <Text style={styles.loadMoreText}>
            {transactions.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {summary.isPending ? (
          <ActivityIndicator />
        ) : summary.data ? (
          <View style={styles.summaryRow}>
            <SummaryCard label="Balance" value={formatMoneyCop(summary.data.balance)} tone="primary" />
            <SummaryCard label="Income" value={formatMoneyCop(summary.data.total_income)} tone="success" />
            <SummaryCard label="Expenses" value={formatMoneyCop(summary.data.total_expenses)} tone="danger" />
          </View>
        ) : (
          <Text style={styles.errorText}>Could not load the summary.</Text>
        )}

        <Link href="/(app)/finance/new-transaction" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>+ Add income or expense</Text>
          </Pressable>
        </Link>

        <View style={styles.linksRow}>
          <Link href="/(app)/finance/categories" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text>Categories</Text>
            </Pressable>
          </Link>
          <Link href="/(app)/finance/goals" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text>Goals</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.filterRow}>
          {(['ALL', 'INCOME', 'EXPENSE'] as TypeFilter[]).map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, typeFilter === value && styles.chipActive]}
              onPress={() => setTypeFilter(value)}
            >
              <Text>{value === 'ALL' ? 'All' : value === 'INCOME' ? 'Income' : 'Expenses'}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={listFooter}
          onRefresh={() => void transactions.refetch()}
          refreshing={transactions.isRefetching}
        />
      </View>
    </SafeAreaView>
  );
}
const makeStyles = (c: Palette) =>
  StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.background },
  container: {
    flex: 1,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm + 4,
    gap: 2,
  },
  summaryLabel: { fontSize: 12, opacity: c.mutedOpacity },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  primaryButton: {
    backgroundColor: c.primary,
    borderRadius: Radius.button,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  primaryButtonText: { color: c.onPrimary, fontWeight: '600', fontSize: 15 },
  linksRow: { flexDirection: 'row', gap: Spacing.sm },
  secondaryButton: {
    flex: 1,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '500' },
  rowSubtitle: { fontSize: 12, opacity: c.mutedOpacity },
  rowAmount: { fontSize: 15, fontWeight: '700' },
  rowAction: { fontSize: 16, opacity: 0.5, paddingHorizontal: 4 },
  loadMore: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { color: c.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', opacity: 0.6, padding: Spacing.lg },
  errorText: { color: c.danger, textAlign: 'center', padding: Spacing.md },
});;
