import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { MoneyDisplay } from '@/components/ui/money-display';
import { Progress } from '@/components/ui/progress';
import { Chip } from '@/components/ui/chip';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { FontWeight, Radius, Shadow, Spacing, Typography, LetterSpacing } from '@/constants/tokens';
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

const CLASSIFICATION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  DUE_TODAY: 'calendar',
  OVERDUE: 'alert-circle',
  UPCOMING: 'time',
  PAID: 'checkmark-circle',
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

  const borderColor =
    tone === 'success'
      ? c.success + '33'
      : tone === 'danger'
      ? c.danger + '33'
      : tone === 'warning'
      ? c.warning + '33'
      : c.borderSubtle;

  return (
    <View style={[sumStyles.card, { backgroundColor: bgColor, borderColor }]}>
      <View style={sumStyles.headerRow}>
        <Ionicons name={iconName} size={16} color={valueColor} />
        <Text style={[sumStyles.label, { color: c.textMuted }]}>{label}</Text>
      </View>
      <MoneyDisplay value={value} size="lg" tone={tone} weight="extrabold" />
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
      gap: Spacing.xs,
      ...Shadow.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    label: { fontSize: Typography.xs, fontWeight: FontWeight.semibold },
  });

function CollectionCard({ item, c }: { item: CollectionItemDto; c: Palette }) {
  const cardSt = cardStyles(c);
  const urgencyColor = CLASSIFICATION_COLOR(c)[item.classification] ?? c.textMuted;
  const isOverdue = item.days_overdue > 0;
  const classLabel = isOverdue
    ? `${item.days_overdue}d vencido`
    : CLASSIFICATION_LABEL[item.classification] ?? item.classification;
  const classIcon = CLASSIFICATION_ICON[item.classification] ?? 'time';

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <View style={[cardSt.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        {/* Barra lateral de urgencia con gradiente */}
        <LinearGradient
          colors={isOverdue ? [c.danger, c.dangerLight] : urgencyColor === c.warning ? [c.warning, c.warningLight] : [c.primary, c.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={cardSt.urgencyBar}
        />
        <View style={cardSt.body}>
          <View style={cardSt.header}>
            <Text style={[cardSt.clientName, { color: c.text }]}>{item.client_name}</Text>
            <View style={[cardSt.classBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
              <View style={[cardSt.dot, { backgroundColor: urgencyColor }]} />
              <Ionicons name={classIcon} size={10} color={urgencyColor} />
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
              <MoneyDisplay value={item.total_outstanding} size="lg" tone="primary" weight="extrabold" />
            </View>
            <Link href={`/(app)/loans/${item.loan_id}`} asChild>
              <Pressable
                style={({ pressed }) => [
                  cardSt.collectButton,
                  { backgroundColor: c.primary },
                  pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="cash" size={16} color={c.onPrimary} />
                <Text style={cardSt.collectText}>Cobrar</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const cardStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.card,
      borderWidth: 1,
      overflow: 'hidden',
      flexDirection: 'row',
      ...Shadow.md,
    },
    urgencyBar: { width: 5 },
    body: { flex: 1, padding: Spacing.md, gap: Spacing.xs + 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clientName: { fontSize: Typography.base, fontWeight: FontWeight.bold, flex: 1 },
    classBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
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
      borderTopColor: c.borderSubtle,
    },
    outstandingLabel: { fontSize: 10, color: c.textMuted, fontWeight: '500', letterSpacing: LetterSpacing.wide },
    collectButton: {
      borderRadius: Radius.button,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      ...Shadow.sm,
    },
    collectText: { color: c.onPrimary, fontWeight: FontWeight.bold, fontSize: Typography.sm },
  });

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CollectionsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [filter, setFilter] = useState<CollectionsFilter>('TODAY');

  const todayQuery = useTodayCollections();
  const collectionsQuery = useCollections(filter);

  const summary = todayQuery.data;
  const items = collectionsQuery.data?.items ?? [];

  // Animaciones de entrada
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const summaryOpacity = useSharedValue(0);
  const summaryTranslateY = useSharedValue(20);
  const listOpacity = useSharedValue(0);
  const listTranslateY = useSharedValue(20);

  useFocusEffect(
    useCallback(() => {
      headerOpacity.value = withDelay(50, withSpring(1, { damping: 20, stiffness: 120 }));
      headerTranslateY.value = withDelay(50, withSpring(0, { damping: 20, stiffness: 120 }));

      summaryOpacity.value = withDelay(150, withSpring(1, { damping: 20, stiffness: 120 }));
      summaryTranslateY.value = withDelay(150, withSpring(0, { damping: 20, stiffness: 120 }));

      listOpacity.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 120 }));
      listTranslateY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 120 }));
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

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateY: listTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          { paddingBottom: Spacing.xxxl },
          styles.container,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header animado */}
        <Animated.View style={[styles.headerSection, headerAnimatedStyle]}>
          <Text style={styles.pageTitle}>Cobros</Text>
          <Text style={styles.pageSubtitle}>Gestiona tus cobros diarios y seguimiento</Text>
        </Animated.View>

        {/* Summary tarjetas */}
        <Animated.View style={[styles.summarySection, summaryAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Resumen del día</Text>
          {todayQuery.isPending ? (
            <View style={styles.summaryGrid}>
              <Skeleton height={100} variant="card" />
              <Skeleton height={100} variant="card" />
              <Skeleton height={100} variant="card" />
              <Skeleton height={100} variant="card" />
            </View>
          ) : summary ? (
            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Esperado hoy"
                value={summary.summary.expected_today}
                iconName="calendar"
                tone="neutral"
                c={c}
              />
              <SummaryCard
                label="Cobrado hoy"
                value={summary.summary.collected_today}
                iconName="checkmark-circle"
                tone="success"
                c={c}
              />
              <SummaryCard
                label="Pendiente hoy"
                value={summary.summary.pending_today}
                iconName="time"
                tone="warning"
                c={c}
              />
              <SummaryCard
                label="Mora acumulada"
                value={summary.summary.overdue}
                iconName="alert-circle"
                tone="danger"
                c={c}
              />
            </View>
          ) : null}
        </Animated.View>

        {/* Filtros */}
        <Animated.View style={[styles.filterSection, listAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Cobros por período</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(({ value, label }) => (
              <Chip
                key={value}
                label={label}
                selected={filter === value}
                onPress={() => setFilter(value)}
                variant="primary"
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Lista de cobros */}
        <Animated.View style={[styles.listSection, listAnimatedStyle]}>
          {collectionsQuery.isPending ? (
            <View style={styles.skeletonContainer}>
              <Skeleton height={130} variant="card" />
              <Skeleton height={130} variant="card" />
              <Skeleton height={130} variant="card" />
            </View>
          ) : collectionsQuery.isError ? (
            <View style={styles.errorBox}>
              <View style={styles.errorIconBox}>
                <Ionicons name="cloud-offline" size={40} color={c.danger} />
              </View>
              <Text style={styles.errorText}>No se pudieron cargar los cobros</Text>
              <Text style={styles.errorSubtext}>Verifica tu conexión e inténtalo de nuevo</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="checkmark-done-circle" size={48} color={c.success} />
              </View>
              <Text style={styles.emptyTitle}>¡Todo al día!</Text>
              <Text style={styles.emptySubtitle}>
                No hay cobros pendientes para el filtro seleccionado.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item, index) => (
                <CollectionCard key={`${item.loan_id}-${item.installment_number}`} item={item} c={c} />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.xl },

    // Header
    headerSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.xs },
    pageTitle: { fontSize: Typography.xxxl, fontWeight: FontWeight.black, color: c.text, letterSpacing: LetterSpacing.tight },
    pageSubtitle: { fontSize: Typography.sm, color: c.textMuted, fontWeight: FontWeight.medium },

    // Summary
    summarySection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: FontWeight.extrabold,
      color: c.text,
      letterSpacing: LetterSpacing.tight,
    },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

    // Filter
    filterSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingBottom: Spacing.xs },

    // List
    listSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
    list: { gap: Spacing.md },

    // Empty
    emptyBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl },
    emptyIconBox: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.successSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
      ...Shadow.md,
    },
    emptyTitle: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: c.text },
    emptySubtitle: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },

    // Error
    errorBox: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xl },
    errorIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    errorText: { color: c.text, fontSize: Typography.lg, fontWeight: FontWeight.bold, textAlign: 'center' },
    errorSubtext: { color: c.textMuted, fontSize: Typography.sm, textAlign: 'center' },

    // Skeleton
    skeletonContainer: { paddingHorizontal: Spacing.lg },
  });