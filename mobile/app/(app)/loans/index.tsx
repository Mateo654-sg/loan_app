import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import type { BadgeTone } from '@/components/ui/badge';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteLoans } from '@/features/loans/queries';
import type { LoanDto } from '@/features/loans/types';
import { formatMoneyCop } from '@/utils/money';

const STATUS_FILTERS = ['ACTIVE', 'OVERDUE', 'PAID', 'CANCELLED', 'ALL'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_LABELS: Record<StatusFilter, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
  ALL: 'Todos',
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
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.primary }}>
        {initials}
      </Text>
    </View>
  );
}

export default function LoansScreen() {
  const c = usePalette();
  const styles = makeStyles(c);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const loans = useInfiniteLoans(statusFilter === 'ALL' ? {} : { status: statusFilter });
  const items = loans.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: LoanDto }) => (
    <Link href={`/(app)/loans/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      >
        <ClientAvatar name={item.client_name} c={c} />
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.client_name}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {formatMoneyCop(item.principal)} · {item.number_of_installments} cuotas ·{' '}
            {item.amortization_type === 'FRENCH' ? 'Francés' : 'Cuota fija'}
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
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.collectionsEmoji}>💳</Text>
            <Text style={styles.collectionsText}>Cobros de hoy →</Text>
          </Pressable>
        </Link>

        {/* Filtros */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((value) => (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.chip,
                statusFilter === value && styles.chipActive,
                pressed && { opacity: 0.75 },
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
        </View>

        {/* Lista / estados */}
        {loans.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.lg }} color={c.primary} />
        ) : loans.isError ? (
          <Text style={styles.error}>Error al cargar préstamos. Verifica la conexión.</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Sin préstamos</Text>
            <Text style={styles.emptySubtitle}>
              Crea un préstamo para uno de tus clientes.
            </Text>
            <Link href="/(app)/loans/new" asChild>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ Nuevo préstamo</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              loans.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void loans.fetchNextPage()}
                  disabled={loans.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {loans.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
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
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.fabText}>＋</Text>
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
    container: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },

    // Cobros
    collectionsButton: {
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      ...Shadow.sm,
    },
    collectionsEmoji: { fontSize: Typography.md },
    collectionsText: {
      color: c.primary,
      fontWeight: FontWeight.semibold,
      fontSize: Typography.base,
    },

    // Chips
    filterRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
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

    // Filas de préstamo
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    rowMain: { flex: 1, gap: 3 },
    rowTitle: { fontSize: Typography.md, fontWeight: FontWeight.semibold, color: c.text },
    rowSubtitle: { fontSize: Typography.sm, color: c.textMuted },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    outstanding: { fontSize: Typography.base, fontWeight: FontWeight.extrabold, color: c.text },

    // Carga más
    loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.semibold },

    // Vacío
    emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: c.text },
    emptySubtitle: { textAlign: 'center', color: c.textMuted, fontSize: Typography.sm },
    emptyButton: {
      backgroundColor: c.primary,
      borderRadius: Radius.button,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      ...Shadow.md,
    },
    emptyButtonText: { color: c.onPrimary, fontWeight: FontWeight.bold },

    // FAB
    fab: {
      position: 'absolute',
      bottom: Spacing.lg,
      right: Spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.lg,
    },
    fabText: { color: '#FFF', fontSize: 28, fontWeight: '700', lineHeight: 32 },

    // Error
    error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  });
