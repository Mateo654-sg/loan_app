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
import { SafeAreaView , useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useCollections, useTodayCollections } from '@/features/collections/queries';
import type { CollectionItemDto, CollectionsFilter } from '@/features/collections/types';
import { formatIsoDateShort, formatMoneyCop } from '@/utils/money';

const FILTERS: { value: CollectionsFilter; label: string }[] = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Semana' },
  { value: 'THIS_MONTH', label: 'Mes' },
  { value: 'OVERDUE', label: 'Vencidos' },
  { value: 'UPCOMING', label: 'Próximos' },
  { value: 'ALL', label: 'Todos' },
];

const CLASSIFICATION_COLOR = (c: Palette): Record<string, string> => ({
  DUE_TODAY: c.primary,
  OVERDUE: c.danger,
  UPCOMING: c.textMuted,
  PAID: c.success,
});

const CLASSIFICATION_LABEL: Record<string, string> = {
  DUE_TODAY: 'Vence hoy',
  OVERDUE: 'Vencido',
  UPCOMING: 'Próximo',
  PAID: 'Pagado',
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  tone = 'neutral',
  c,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  c: Palette;
}) {
  const valueColor =
    tone === 'success'
      ? c.success
      : tone === 'danger'
        ? c.danger
        : tone === 'warning'
          ? c.warning
          : c.text;

  const bgColor =
    tone === 'success'
      ? c.successSoft
      : tone === 'danger'
        ? c.dangerSoft
        : tone === 'warning'
          ? c.warningSoft
          : c.surface;

  return (
    <View style={[summaryStyles.card, { backgroundColor: bgColor, borderColor: valueColor + '33' }]}>
      <Text style={[summaryStyles.label, { color: c.textMuted }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: valueColor }]} numberOfLines={1}>
        {formatMoneyCop(value)}
      </Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 4,
    ...Shadow.sm,
  },
  label: { fontSize: Typography.xs, fontWeight: FontWeight.medium },
  value: { fontSize: Typography.base, fontWeight: FontWeight.extrabold },
});

function CollectionCard({ item, c }: { item: CollectionItemDto; c: Palette }) {
  const urgencyColor = CLASSIFICATION_COLOR(c)[item.classification] ?? c.textMuted;
  const isOverdue = item.days_overdue > 0;
  const classLabel = isOverdue
    ? `${item.days_overdue}d vencido`
    : (CLASSIFICATION_LABEL[item.classification] ?? item.classification);

  return (
    <View style={[cardStyles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      {/* Barra lateral de urgencia */}
      <View style={[cardStyles.urgencyBar, { backgroundColor: urgencyColor }]} />
      <View style={cardStyles.body}>
        <View style={cardStyles.header}>
          <Text style={[cardStyles.clientName, { color: c.text }]}>{item.client_name}</Text>
          <View style={[cardStyles.classBadge, { backgroundColor: urgencyColor + '22', borderColor: urgencyColor + '55' }]}>
            <Text style={[cardStyles.classLabel, { color: urgencyColor }]}>{classLabel}</Text>
          </View>
        </View>
        <Text style={[cardStyles.meta, { color: c.textMuted }]}>
          Cuota #{item.installment_number} · vence {formatIsoDateShort(item.due_date)}
          {parseFloat(item.late_fee_projected) > 0
            ? ` · mora ${formatMoneyCop(item.late_fee_projected)}`
            : ''}
        </Text>
        <View style={cardStyles.footer}>
          <Text style={[cardStyles.outstanding, { color: c.text }]}>
            {formatMoneyCop(item.total_outstanding)}
          </Text>
          <Link href={`/(app)/loans/${item.loan_id}`} asChild>
            <Pressable
              style={({ pressed }) => [
                cardStyles.collectButton,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={cardStyles.collectText}>Cobrar</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  urgencyBar: { width: 4 },
  body: { flex: 1, padding: Spacing.md, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { fontSize: Typography.md, fontWeight: FontWeight.semibold, flex: 1, marginRight: 8 },
  classBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  classLabel: { fontSize: Typography.xs, fontWeight: FontWeight.bold },
  meta: { fontSize: Typography.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  outstanding: { fontSize: Typography.lg, fontWeight: FontWeight.extrabold },
  collectButton: {
    borderRadius: Radius.button,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    ...Shadow.md,
  },
  collectText: { color: '#FFF', fontWeight: FontWeight.bold, fontSize: Typography.sm },
});

// ─── Pantalla ─────────────────────────────────────────────────────────────────

/**
 * Pantalla de operaciones diarias — quién paga hoy, quién está vencido
 * y cuánto se ha cobrado. Todos los valores vienen del backend.
 */
export default function CollectionsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [filter, setFilter] = useState<CollectionsFilter>('TODAY');
  const today = useTodayCollections();
  const list = useCollections(filter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[{ paddingBottom: insets.bottom + Spacing.lg }, styles.container]}
        showsVerticalScrollIndicator={false}
      >
        {/* Título + fecha */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Cobros de hoy</Text>
          <Text style={styles.pageDate}>
            {today.data ? formatIsoDateShort(today.data.business_date) : '…'}
          </Text>
        </View>

        {/* Resumen del día */}
        {today.isPending ? (
          <ActivityIndicator color={c.primary} />
        ) : today.data ? (
          <View style={styles.summaryGrid}>
            <SummaryCard label="Esperado" value={today.data.summary.expected_today} c={c} />
            <SummaryCard label="Cobrado" value={today.data.summary.collected_today} tone="success" c={c} />
            <SummaryCard label="Pendiente" value={today.data.summary.pending_today} tone="warning" c={c} />
            <SummaryCard label="Vencido" value={today.data.summary.overdue} tone="danger" c={c} />
          </View>
        ) : (
          <Text style={styles.error}>No se pudo cargar el resumen del día.</Text>
        )}

        {/* Filtros horizontales */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.chip,
                  filter === option.value && styles.chipActive,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => setFilter(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter === option.value && styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Lista de cobros */}
        {list.isPending ? (
          <ActivityIndicator color={c.primary} />
        ) : list.isError ? (
          <Text style={styles.error}>Error al cargar cobros.</Text>
        ) : list.data.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>Nada que cobrar con este filtro.</Text>
          </View>
        ) : (
          list.data.items.map((item) => (
            <CollectionCard key={item.installment_id} item={item} c={c} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xl },

    pageHeader: { gap: 2 },
    pageTitle: { fontSize: Typography.xl, fontWeight: FontWeight.extrabold, color: c.text, letterSpacing: -0.4 },
    pageDate: { fontSize: Typography.sm, color: c.textMuted },

    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

    filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: Spacing.xs },
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

    emptyBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
    emptyEmoji: { fontSize: 40 },
    emptyText: { textAlign: 'center', color: c.textMuted, fontSize: Typography.base },

    error: { color: c.danger, textAlign: 'center', padding: Spacing.md },
  });
