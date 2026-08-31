import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { MoneyDisplay } from '@/components/ui/money-display';
import { Chip } from '@/components/ui/chip';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
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
import { hapticWarning } from '@/utils/haptics';

type TypeFilter = 'TODOS' | 'INGRESOS' | 'GASTOS';

const FILTER_LABELS: Record<TypeFilter, string> = {
  TODOS: 'Todos',
  INGRESOS: 'Ingresos',
  GASTOS: 'Gastos',
};

const PAGE_SIZE = 20;

export default function FinanceScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('TODOS');
  const filters = typeFilter === 'TODOS' ? {} : { type: (typeFilter === 'INGRESOS' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE' };

  const summary = useFinanceSummary();
  const transactions = useInfiniteTransactions({ ...filters, page_size: PAGE_SIZE });
  const allItems = transactions.data?.pages.flatMap((page) => page.items) ?? [];
  const hasNextPage = transactions.hasNextPage;
  const categories = useCategories();
  const cancelTransaction = useCancelTransaction();

  const categoryNameById = new Map(categories.data?.map((cat) => [cat.id, cat.name] as const));

  // Animaciones de entrada
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const summaryOpacity = useSharedValue(0);
  const summaryTranslateY = useSharedValue(20);
  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(20);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(20);

  useFocusEffect(
    useCallback(() => {
      headerOpacity.value = withDelay(50, withSpring(1, { damping: 20, stiffness: 120 }));
      headerTranslateY.value = withDelay(50, withSpring(0, { damping: 20, stiffness: 120 }));

      summaryOpacity.value = withDelay(150, withSpring(1, { damping: 20, stiffness: 120 }));
      summaryTranslateY.value = withDelay(150, withSpring(0, { damping: 20, stiffness: 120 }));

      actionsOpacity.value = withDelay(250, withSpring(1, { damping: 20, stiffness: 120 }));
      actionsTranslateY.value = withDelay(250, withSpring(0, { damping: 20, stiffness: 120 }));

      listOpacity.value = withDelay(350, withSpring(1, { damping: 20, stiffness: 120 }));
      listTranslateY.value = withDelay(350, withSpring(0, { damping: 20, stiffness: 120 }));
    }, [])
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const summaryAnimatedStyle = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
    transform: [{ translateY: summaryTranslateY.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  const confirmCancel = (transaction: TransactionDto) => {
    Alert.alert(
      '¿Cancelar transacción?',
      `Esto excluirá ${formatMoneyCop(transaction.amount)} de tu saldo. El registro se conserva en el historial.`,
      [
        { text: 'Mantener', style: 'cancel' },
        {
          text: 'Cancelar transacción',
          style: 'destructive',
          onPress: () => {
            hapticWarning();
            cancelTransaction.mutate(transaction.id);
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: TransactionDto }) => {
    const isIncome = item.type === 'INCOME';
    const isCancelled = item.status === 'CANCELLED';

    return (
      <View style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.borderSubtle }, isCancelled && { opacity: 0.45 }]}>
        {/* Ícono de tipo con gradiente */}
        <View style={[styles.txIcon, { backgroundColor: isIncome ? c.successSoft : c.dangerSoft }]}>
          <Ionicons
            name={isIncome ? 'arrow-up' : 'arrow-down'}
            size={20}
            color={isIncome ? c.success : c.danger}
          />
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
        <View style={styles.rowRight}>
          <MoneyDisplay value={item.amount} size="md" tone={isIncome ? 'success' : 'danger'} weight="extrabold" showCurrency={false} prefix={isIncome ? '＋' : '−'} />
          {item.status === 'ACTIVE' ? (
            <Pressable
              onPress={() => confirmCancel(item)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cancelar transacción"
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 0.7, paddingLeft: 4 }]}
            >
              <Ionicons name="close-circle" size={20} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const listFooter = () => {
    if (transactions.isPending) return <ActivityIndicator style={{ padding: Spacing.md }} color={c.primary} />;
    if (transactions.isError) {
      return (
        <View style={styles.errorBox}>
          <View style={styles.errorIconBox}>
            <Ionicons name="cloud-offline" size={36} color={c.danger} />
          </View>
          <Text style={styles.errorText}>Error al cargar transacciones</Text>
          <Text style={styles.errorSubtext}>Verifica tu conexión e inténtalo de nuevo</Text>
        </View>
      );
    }
    if (allItems.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="wallet" size={44} color={c.textMuted} />
          </View>
          <Text style={styles.emptyText}>Sin transacciones en este filtro</Text>
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
            {transactions.isFetchingNextPage ? 'Cargando...' : 'Cargar más transacciones'}
          </Text>
        </Pressable>
      );
    }
    return null;
  };

  const headerComponent = (
    <View style={{ gap: Spacing.lg, paddingBottom: Spacing.md }}>
      {/* Header animado */}
      <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
        <Text style={styles.pageTitle}>Finanzas</Text>
        <Text style={styles.pageSubtitle}>Controla tus ingresos, gastos y metas</Text>
      </Animated.View>

      {/* Resumen de saldo — Premium */}
      <Animated.View style={[styles.summarySection, summaryAnimatedStyle]}>
        {summary.isPending ? (
          <View style={styles.summaryGrid}>
            <Skeleton height={120} variant="card" />
            <Skeleton height={100} variant="card" />
            <Skeleton height={100} variant="card" />
          </View>
        ) : summary.data ? (
          <View style={styles.summaryGrid}>
            <LinearGradient
              colors={c.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>Saldo actual</Text>
              <MoneyDisplay value={summary.data.balance} size="xl" weight="black" tone="inverse" />
            </LinearGradient>
            <View style={styles.summaryCol}>
              <View style={[styles.miniCard, { backgroundColor: c.successSoft, borderColor: c.success + '30' }]}>
                <View style={styles.miniHeader}>
                  <Ionicons name="arrow-up-circle" size={16} color={c.success} />
                  <Text style={[styles.miniLabel, { color: c.textMuted }]}>Ingresos</Text>
                </View>
                <MoneyDisplay value={summary.data.total_income} size="lg" tone="success" weight="extrabold" />
              </View>
              <View style={[styles.miniCard, { backgroundColor: c.dangerSoft, borderColor: c.danger + '30' }]}>
                <View style={styles.miniHeader}>
                  <Ionicons name="arrow-down-circle" size={16} color={c.danger} />
                  <Text style={[styles.miniLabel, { color: c.textMuted }]}>Gastos</Text>
                </View>
                <MoneyDisplay value={summary.data.total_expenses} size="lg" tone="danger" weight="extrabold" />
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Error al cargar el resumen</Text>
        )}
      </Animated.View>

      {/* Botón principal de agregar movimiento */}
      <Animated.View style={[styles.actionSection, actionsAnimatedStyle]}>
        <Link href="/(app)/finance/new-transaction" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
            ]}
          >
            <LinearGradient
              colors={c.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="add-circle" size={22} color={c.onPrimary} />
              <Text style={styles.primaryButtonText}>Nuevo movimiento</Text>
            </LinearGradient>
          </Pressable>
        </Link>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Link href="/(app)/finance/categories" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: c.surface, borderColor: c.borderSubtle },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="pricetags" size={18} color={c.primary} />
              <Text style={styles.secondaryText}>Categorías</Text>
            </Pressable>
          </Link>
          <Link href="/(app)/finance/goals" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: c.surface, borderColor: c.borderSubtle },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="flag" size={18} color={c.accent} />
              <Text style={styles.secondaryText}>Metas</Text>
            </Pressable>
          </Link>
        </View>
      </Animated.View>

      {/* Filtros */}
      <Animated.View style={listAnimatedStyle}>
        <View style={{ flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.lg }}>
          {(['TODOS', 'INGRESOS', 'GASTOS'] as TypeFilter[]).map((value) => (
            <Chip
              key={value}
              label={FILTER_LABELS[value]}
              selected={typeFilter === value}
              onPress={() => setTypeFilter(value)}
              variant="primary"
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: 90 + insets.bottom }}
          ListHeaderComponent={headerComponent}
          ListFooterComponent={listFooter}
          onRefresh={() => void transactions.refetch()}
          refreshing={transactions.isRefetching}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, gap: Spacing.xl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

    // Header
    headerSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.xs },
    pageTitle: { fontSize: Typography.xxxl, fontWeight: FontWeight.black, color: c.text, letterSpacing: LetterSpacing.tight },
    pageSubtitle: { fontSize: Typography.sm, color: c.textMuted, fontWeight: FontWeight.medium },

    // Summary
    summarySection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    summaryGrid: { flexDirection: 'row', gap: Spacing.sm },

    balanceCard: {
      flex: 1.3,
      borderRadius: Radius.cardLg,
      padding: Spacing.lg,
      gap: Spacing.sm,
      justifyContent: 'center',
      ...Shadow.xl,
    },
    balanceLabel: {
      fontSize: Typography.sm,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: FontWeight.semibold,
      letterSpacing: LetterSpacing.wide,
    },
    summaryCol: { flex: 1, gap: Spacing.sm },
    miniCard: {
      flex: 1,
      borderRadius: Radius.card,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.xs,
      borderWidth: 1,
      ...Shadow.md,
    },
    miniHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    miniLabel: { fontSize: Typography.xs, fontWeight: FontWeight.semibold },
    miniValue: { fontSize: Typography.md, fontWeight: FontWeight.extrabold },

    // Actions
    actionSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    primaryButton: {
      borderRadius: Radius.button,
      overflow: 'hidden',
      ...Shadow.lg,
    },
    primaryButtonGradient: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    primaryButtonText: { color: c.onPrimary, fontWeight: FontWeight.bold, fontSize: Typography.base, letterSpacing: LetterSpacing.wide },
    linksRow: { flexDirection: 'row', gap: Spacing.sm },
    secondaryButton: {
      flex: 1,
      borderRadius: Radius.button,
      borderWidth: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      ...Shadow.sm,
    },
    secondaryText: { fontSize: Typography.sm, fontWeight: FontWeight.bold, color: c.text },

    // Filter
    filterSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    filterRow: { flexDirection: 'row', gap: Spacing.xs },

    // Transactions
    listSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.card,
      ...Shadow.md,
    },
    txIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowMain: { flex: 1, gap: Spacing.xs },
    rowTitle: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    rowSubtitle: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },
    rowRight: { alignItems: 'flex-end', gap: Spacing.sm },

    // Footer
    loadMore: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md, borderRadius: Radius.button },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.bold, fontSize: Typography.sm },
    emptyBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl },
    emptyIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    emptyText: { color: c.textMuted, fontSize: Typography.sm, fontWeight: FontWeight.medium, textAlign: 'center' },
    errorBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xl },
    errorIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    errorText: { color: c.text, fontSize: Typography.lg, fontWeight: FontWeight.bold, textAlign: 'center' },
    errorSubtext: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center' },
  });