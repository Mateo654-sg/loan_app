import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
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

const FILTER_LABELS: Record<TypeFilter, string> = {
  ALL: 'Todo',
  INCOME: 'Ingresos',
  EXPENSE: 'Gastos',
};

const PAGE_SIZE = 20;

export default function FinanceScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
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
      '¿Cancelar transacción?',
      `Esto excluirá ${formatMoneyCop(transaction.amount)} de tu saldo. El registro se conserva en el historial.`,
      [
        { text: 'Mantener', style: 'cancel' },
        {
          text: 'Cancelar transacción',
          style: 'destructive',
          onPress: () => cancelTransaction.mutate(transaction.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: TransactionDto }) => {
    const isIncome = item.type === 'INCOME';
    const amountColor = isIncome ? c.success : c.danger;
    const amountPrefix = isIncome ? '＋' : '−';
    const isCancelled = item.status === 'CANCELLED';

    return (
      <View style={[styles.row, isCancelled && { opacity: 0.45 }]}>
        {/* Ícono de tipo */}
        <View style={[styles.txIcon, { backgroundColor: isIncome ? c.successSoft : c.dangerSoft }]}>
          <Text style={{ fontSize: 16 }}>{isIncome ? '↑' : '↓'}</Text>
        </View>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.description || categoryNameById.get(item.category_id) || 'Transacción'}
          </Text>
          <Text style={styles.rowSubtitle}>
            {categoryNameById.get(item.category_id) ?? ''} · {formatIsoDateShort(item.transaction_date)}
            {isCancelled ? ' · CANCELADA' : ''}
          </Text>
        </View>
        <Text style={[styles.rowAmount, { color: amountColor }]}>
          {amountPrefix}{formatMoneyCop(item.amount)}
        </Text>
        {item.status === 'ACTIVE' ? (
          <Pressable
            onPress={() => confirmCancel(item)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancelar transacción"
            style={({ pressed }) => [{ opacity: pressed ? 0.4 : 0.5 }]}
          >
            <Text style={styles.rowAction}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const listFooter = () => {
    if (transactions.isPending) return <ActivityIndicator style={{ padding: Spacing.md }} color={c.primary} />;
    if (transactions.isError) {
      return (
        <Text style={styles.errorText}>
          Error al cargar transacciones. Verifica la conexión.
        </Text>
      );
    }
    if (allItems.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={styles.emptyText}>Sin transacciones aún. ¡Agrega la primera!</Text>
        </View>
      );
    }
    if (hasNextPage) {
      return (
        <Pressable
          style={({ pressed }) => [styles.loadMore, pressed && { opacity: 0.7 }]}
          onPress={() => void transactions.fetchNextPage()}
          disabled={transactions.isFetchingNextPage}
        >
          <Text style={styles.loadMoreText}>
            {transactions.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Resumen de saldo */}
        {summary.isPending ? (
          <ActivityIndicator color={c.primary} />
        ) : summary.data ? (
          <View style={styles.summaryRow}>
            {/* Saldo — prominente */}
            <View style={[styles.balanceCard, { backgroundColor: c.primary }]}>
              <Text style={styles.balanceLabel}>Saldo</Text>
              <Text style={styles.balanceValue} numberOfLines={1}>
                {formatMoneyCop(summary.data.balance)}
              </Text>
            </View>
            {/* Ingresos y gastos */}
            <View style={styles.summaryCol}>
              <View style={[styles.miniCard, { backgroundColor: c.successSoft, borderColor: c.success + '40' }]}>
                <Text style={[styles.miniLabel, { color: c.textMuted }]}>Ingresos</Text>
                <Text style={[styles.miniValue, { color: c.success }]} numberOfLines={1}>
                  {formatMoneyCop(summary.data.total_income)}
                </Text>
              </View>
              <View style={[styles.miniCard, { backgroundColor: c.dangerSoft, borderColor: c.danger + '40' }]}>
                <Text style={[styles.miniLabel, { color: c.textMuted }]}>Gastos</Text>
                <Text style={[styles.miniValue, { color: c.danger }]} numberOfLines={1}>
                  {formatMoneyCop(summary.data.total_expenses)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Error al cargar el resumen.</Text>
        )}

        {/* Botón principal */}
        <Link href="/(app)/finance/new-transaction" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.86 },
            ]}
          >
            <Text style={styles.primaryButtonText}>＋ Agregar movimiento</Text>
          </Pressable>
        </Link>

        {/* Links secundarios */}
        <View style={styles.linksRow}>
          <Link href="/(app)/finance/categories" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.secondaryText}>🏷 Categorías</Text>
            </Pressable>
          </Link>
          <Link href="/(app)/finance/goals" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.secondaryText}>🎯 Metas</Text>
            </Pressable>
          </Link>
        </View>

        {/* Filtros */}
        <View style={styles.filterRow}>
          {(['ALL', 'INCOME', 'EXPENSE'] as TypeFilter[]).map((value) => (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.chip,
                typeFilter === value && styles.chipActive,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => setTypeFilter(value)}
            >
              <Text
                style={[
                  styles.chipText,
                  typeFilter === value && styles.chipTextActive,
                ]}
              >
                {FILTER_LABELS[value]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lista de transacciones */}
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={listFooter}
          onRefresh={() => void transactions.refetch()}
          refreshing={transactions.isRefetching}
          showsVerticalScrollIndicator={false}
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
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },

    // Resumen
    summaryRow: { flexDirection: 'row', gap: Spacing.sm },
    balanceCard: {
      flex: 1.2,
      borderRadius: Radius.card,
      padding: Spacing.md,
      gap: 4,
      justifyContent: 'center',
      ...Shadow.md,
    },
    balanceLabel: {
      fontSize: Typography.xs,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: FontWeight.semibold,
      letterSpacing: 0.5,
    },
    balanceValue: {
      fontSize: Typography.lg,
      fontWeight: FontWeight.extrabold,
      color: '#FFF',
    },
    summaryCol: { flex: 1, gap: Spacing.sm },
    miniCard: {
      flex: 1,
      borderRadius: Radius.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm + 4,
      gap: 2,
      borderWidth: 1,
      ...Shadow.sm,
    },
    miniLabel: { fontSize: Typography.xs, fontWeight: FontWeight.medium },
    miniValue: { fontSize: Typography.sm, fontWeight: FontWeight.extrabold },

    // Botones
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      ...Shadow.md,
    },
    primaryButtonText: { color: c.onPrimary, fontWeight: FontWeight.bold, fontSize: Typography.base },

    linksRow: { flexDirection: 'row', gap: Spacing.sm },
    secondaryButton: {
      flex: 1,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      minHeight: 42,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    secondaryText: { fontSize: Typography.sm, fontWeight: FontWeight.semibold, color: c.text },

    // Chips
    filterRow: { flexDirection: 'row', gap: Spacing.xs },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    chipText: { fontSize: Typography.sm, fontWeight: FontWeight.medium, color: c.textMuted },
    chipTextActive: { color: c.primary, fontWeight: FontWeight.bold },

    // Transacciones
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    txIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowMain: { flex: 1, gap: 2 },
    rowTitle: { fontSize: Typography.base, fontWeight: FontWeight.medium, color: c.text },
    rowSubtitle: { fontSize: Typography.xs, color: c.textMuted },
    rowAmount: { fontSize: Typography.base, fontWeight: FontWeight.bold },
    rowAction: { fontSize: Typography.md, color: c.textMuted },

    // Footer
    loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.semibold },
    emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
    emptyEmoji: { fontSize: 40 },
    emptyText: { textAlign: 'center', color: c.textMuted, fontSize: Typography.base },
    errorText: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  });
