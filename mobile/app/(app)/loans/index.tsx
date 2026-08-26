import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/badge';
import type { BadgeTone } from '@/components/ui/badge';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteLoans } from '@/features/loans/queries';
import type { LoanDto } from '@/features/loans/types';
import { formatMoneyCop } from '@/utils/money';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'OVERDUE', 'PAID', 'CANCELLED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'Todos',
  ACTIVE: 'Activos',
  OVERDUE: 'Vencidos',
  PAID: 'Pagados',
  CANCELLED: 'Cancelados',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'primary',
  OVERDUE: 'danger',
  PAID: 'success',
  CANCELLED: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

function ClientAvatar({ name, c }: { name: string; c: Palette }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: c.primary + '25',
      }}
    >
      <Text style={{ fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.primary }}>
        {initials}
      </Text>
    </View>
  );
}

export default function LoansScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const loans = useInfiniteLoans(statusFilter === 'ALL' ? {} : { status: statusFilter });
  const items = loans.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: LoanDto }) => (
    <Link href={`/(app)/loans/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.rowCard, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}
      >
        <ClientAvatar name={item.client_name} c={c} />
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.client_name}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {formatMoneyCop(item.principal)} · {item.number_of_installments} cuotas
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.outstanding}>{formatMoneyCop(item.total_outstanding)}</Text>
          <Badge
            label={STATUS_LABEL[item.status] ?? item.status}
            tone={STATUS_TONE[item.status] ?? 'neutral'}
          />
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Acceso rápido a cobros */}
        <Link href="/(app)/loans/collections" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.collectionsButton,
              pressed && { opacity: 0.82 },
            ]}
          >
            <View style={styles.collectionsIconBox}>
              <Ionicons name="card-outline" size={18} color={c.primary} />
            </View>
            <Text style={styles.collectionsText}>Cobros de hoy</Text>
            <Ionicons name="chevron-forward" size={16} color={c.primary} style={{ marginLeft: 'auto' }} />
          </Pressable>
        </Link>

        {/* Filtros horizontales */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {STATUS_FILTERS.map((value) => (
              <Pressable
                key={value}
                style={({ pressed }) => [
                  styles.chip,
                  statusFilter === value && styles.chipActive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setStatusFilter(value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    statusFilter === value && styles.chipTextActive,
                  ]}
                >
                  {FILTER_LABELS[value]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Lista / estados */}
        {loans.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.xl }} color={c.primary} size="large" />
        ) : loans.isError ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={36} color={c.danger} />
            <Text style={styles.error}>Error al cargar préstamos. Verifica la conexión.</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="document-text-outline" size={38} color={c.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin préstamos registrados</Text>
            <Text style={styles.emptySubtitle}>
              Crea un nuevo préstamo para comenzar el seguimiento de cobros.
            </Text>
            <Link href="/(app)/loans/new" asChild>
              <Pressable style={styles.emptyButton}>
                <Ionicons name="add" size={20} color={c.onPrimary} />
                <Text style={styles.emptyButtonText}>Nuevo préstamo</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              loans.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void loans.fetchNextPage()}
                  disabled={loans.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {loans.isFetchingNextPage ? 'Cargando...' : 'Cargar más préstamos'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}

        {/* FAB circular */}
        {items.length > 0 || loans.isPending ? (
          <Link href="/(app)/loans/new" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons name="add" size={30} color={c.onPrimary} />
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
    container: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },

    // Cobros
    collectionsButton: {
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    collectionsIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectionsText: {
      color: c.text,
      fontWeight: FontWeight.bold,
      fontSize: Typography.base,
    },

    // Chips
    filterWrapper: {
      marginHorizontal: -Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingRight: Spacing.lg },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: Spacing.md,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: Typography.sm, fontWeight: FontWeight.semibold, color: c.textMuted },
    chipTextActive: { color: c.onPrimary, fontWeight: FontWeight.bold },

    // Filas de préstamo
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.card,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...Shadow.sm,
    },
    rowMain: { flex: 1, gap: 4 },
    rowTitle: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    rowSubtitle: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    outstanding: { fontSize: Typography.base, fontWeight: FontWeight.extrabold, color: c.text },

    // Carga más
    loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.sm },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.bold, fontSize: Typography.sm },

    // Vacío
    emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
    emptyIconBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: c.text },
    emptySubtitle: { textAlign: 'center', color: c.textMuted, fontSize: Typography.sm, paddingHorizontal: Spacing.lg },
    emptyButton: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      ...Shadow.md,
    },
    emptyButtonText: { color: c.onPrimary, fontWeight: FontWeight.bold, fontSize: Typography.base },

    // FAB
    fab: {
      position: 'absolute',
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.lg,
    },

    // Error
    errorBox: { alignItems: 'center', gap: Spacing.xs, padding: Spacing.lg },
    error: { color: c.danger, textAlign: 'center', fontWeight: FontWeight.medium },
  });
