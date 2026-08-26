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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
  iconName,
  tone = 'neutral',
  c,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
  c: Palette;
}) {
  const sumStyles = summaryStyles(c);
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
    <View style={[sumStyles.card, { backgroundColor: bgColor, borderColor: valueColor + '33' }]}>
      <View style={sumStyles.headerRow}>
        <Ionicons name={iconName} size={15} color={valueColor} />
        <Text style={[sumStyles.label, { color: c.textMuted }]}>{label}</Text>
      </View>
      <Text style={[sumStyles.value, { color: valueColor }]} numberOfLines={1}>
        {formatMoneyCop(value)}
      </Text>
    </View>
  );
}

const summaryStyles = (c: Palette) =>
  StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: 6,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: { fontSize: Typography.xs, fontWeight: FontWeight.semibold },
  value: { fontSize: Typography.base, fontWeight: FontWeight.extrabold },
});

function CollectionCard({ item, c }: { item: CollectionItemDto; c: Palette }) {
  const cardSt = cardStyles(c);
  const urgencyColor = CLASSIFICATION_COLOR(c)[item.classification] ?? c.textMuted;
  const isOverdue = item.days_overdue > 0;
  const classLabel = isOverdue
    ? `${item.days_overdue}d vencido`
    : (CLASSIFICATION_LABEL[item.classification] ?? item.classification);

  return (
    <View style={[cardSt.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      {/* Barra lateral de urgencia */}
      <View style={[cardSt.urgencyBar, { backgroundColor: urgencyColor }]} />
      <View style={cardSt.body}>
        <View style={cardSt.header}>
          <Text style={[cardSt.clientName, { color: c.text }]}>{item.client_name}</Text>
          <View style={[cardSt.classBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
            <View style={[cardSt.dot, { backgroundColor: urgencyColor }]} />
            <Text style={[cardSt.classLabel, { color: urgencyColor }]}>{classLabel}</Text>
          </View>
        </View>
        <Text style={[cardSt.meta, { color: c.textMuted }]}>
          Cuota #{item.installment_number} · Vence {formatIsoDateShort(item.due_date)}
          {parseFloat(item.late_fee_projected) > 0
            ? ` · Mora ${formatMoneyCop(item.late_fee_projected)}`
            : ''}
        </Text>
        <View style={cardSt.footer}>
          <View>
            <Text style={cardSt.outstandingLabel}>Pendiente por cobrar</Text>
            <Text style={[cardSt.outstanding, { color: c.text }]}>
              {formatMoneyCop(item.total_outstanding)}
            </Text>
          </View>
          <Link href={`/(app)/loans/${item.loan_id}`} asChild>
            <Pressable
              style={({ pressed }) => [
                cardSt.collectButton,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="cash-outline" size={16} color={c.onPrimary} />
              <Text style={cardSt.collectText}>Cobrar</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const cardStyles = (c: Palette) =>
  StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadow.sm,
  },
  urgencyBar: { width: 5 },
  body: { flex: 1, padding: Spacing.md, gap: Spacing.xs + 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { fontSize: Typography.base, fontWeight: FontWeight.bold, flex: 1 },
  classBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  classLabel: { fontSize: Typography.xs, fontWeight: FontWeight.bold },
  meta: { fontSize: Typography.xs, fontWeight: FontWeight.medium },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  outstandingLabel: { fontSize: 10, color: c.textMuted, fontWeight: '500' },
  outstanding: { fontSize: Typography.base, fontWeight: FontWeight.extrabold },
  collectButton: {
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  collectText: { color: c.onPrimary, fontWeight: FontWeight.bold, fontSize: Typography.xs },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CollectionsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const sumStyles = summaryStyles(c);
  const cardSt = cardStyles(c);
  const [filter, setFilter] = useState<CollectionsFilter>('TODAY');

  const todayQuery = useTodayCollections();
  const collectionsQuery = useCollections(filter);

  const summary = todayQuery.data;
  const items = collectionsQuery.data?.items ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          { paddingBottom: Spacing.xl },
          styles.container,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary tarjetas */}
        <Text style={styles.sectionTitle}>Resumen del día</Text>
        {todayQuery.isPending ? (
          <ActivityIndicator color={c.primary} style={{ padding: Spacing.md }} />
        ) : summary ? (
          <View style={styles.grid}>
            <SummaryCard
              label="Esperado hoy"
              value={summary.summary.expected_today}
              iconName="calendar-outline"
              tone="neutral"
              c={c}
            />
            <SummaryCard
              label="Cobrado hoy"
              value={summary.summary.collected_today}
              iconName="checkmark-circle-outline"
              tone="success"
              c={c}
            />
            <SummaryCard
              label="Pendiente hoy"
              value={summary.summary.pending_today}
              iconName="time-outline"
              tone="warning"
              c={c}
            />
            <SummaryCard
              label="Mora acumulada"
              value={summary.summary.overdue}
              iconName="alert-circle-outline"
              tone="danger"
              c={c}
            />
          </View>
        ) : null}

        {/* Filtros */}
        <Text style={styles.sectionTitle}>Cobros por período</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(({ value, label }) => (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.chip,
                filter === value && styles.chipActive,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setFilter(value)}
            >
              <Text
                style={[
                  styles.chipText,
                  filter === value && styles.chipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Lista de cobros */}
        {collectionsQuery.isPending ? (
          <ActivityIndicator color={c.primary} style={{ padding: Spacing.xl }} size="large" />
        ) : collectionsQuery.isError ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={32} color={c.danger} />
            <Text style={styles.error}>No se pudieron cargar los cobros.</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="checkmark-done-circle-outline" size={44} color={c.success} />
            </View>
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptySubtitle}>
              No hay cobros pendientes para el filtro seleccionado.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <CollectionCard key={`${item.loan_id}-${item.installment_number}`} item={item} c={c} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { padding: Spacing.lg, gap: Spacing.md },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      letterSpacing: -0.2,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingBottom: 4 },
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
    list: { gap: Spacing.sm },
    emptyBox: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xxl },
    emptyIconBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.successSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: c.text },
    emptySubtitle: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center' },
    errorBox: { alignItems: 'center', gap: Spacing.xs, padding: Spacing.lg },
    error: { color: c.danger, textAlign: 'center', fontWeight: FontWeight.medium },
  });
