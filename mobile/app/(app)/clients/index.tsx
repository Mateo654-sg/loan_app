import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/badge';
import type { BadgeTone } from '@/components/ui/badge';
import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useInfiniteClients } from '@/features/clients/queries';
import type { ClientDto } from '@/features/clients/types';

function ClientAvatar({ name, c }: { name: string; c: Palette }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: c.primary + '30',
      }}
    >
      <Text
        style={{
          fontSize: Typography.base,
          fontWeight: FontWeight.bold,
          color: c.primary,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export default function ClientsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(c);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const clients = useInfiniteClients(
    submittedSearch ? { search: submittedSearch } : {},
  );
  const allItems = clients.data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = ({ item }: { item: ClientDto }) => (
    <Link href={`/(app)/clients/${item.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.rowCard, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}
      >
        <ClientAvatar name={item.full_name} c={c} />
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.full_name}</Text>
          <Text style={styles.rowSubtitle}>
            {[item.document_number, item.phone].filter(Boolean).join(' · ') || 'Sin información de contacto'}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Badge
            label={item.status === 'ACTIVE' ? 'Activo' : item.status}
            tone={item.status === 'ACTIVE' ? ('success' as BadgeTone) : ('neutral' as BadgeTone)}
          />
          <Ionicons name="chevron-forward" size={16} color={c.textSubtle} style={{ marginTop: 4 }} />
        </View>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Buscador */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color={c.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (text === '') setSubmittedSearch('');
            }}
            onSubmitEditing={() => setSubmittedSearch(searchText.trim())}
            placeholder="Buscar por nombre, documento o teléfono..."
            placeholderTextColor={c.textSubtle}
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearchText('');
                setSubmittedSearch('');
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Estados */}
        {clients.isPending ? (
          <ActivityIndicator style={{ padding: Spacing.xl }} color={c.primary} size="large" />
        ) : clients.isError ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={36} color={c.danger} />
            <Text style={styles.error}>Error al cargar clientes. Verifica la conexión.</Text>
          </View>
        ) : allItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people-outline" size={40} color={c.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {submittedSearch ? 'No se encontraron resultados' : 'Sin clientes registrados'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {submittedSearch
                ? `No hay clientes que coincidan con "${submittedSearch}"`
                : 'Crea tu primer cliente para comenzar a gestionar préstamos.'}
            </Text>
            {!submittedSearch ? (
              <Link href="/(app)/clients/new" asChild>
                <Pressable style={styles.emptyButton}>
                  <Ionicons name="person-add" size={18} color={c.onPrimary} />
                  <Text style={styles.emptyButtonText}>Nuevo cliente</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        ) : null}

        {/* Lista */}
        {allItems.length > 0 ? (
          <FlatList
            data={allItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              clients.hasNextPage ? (
                <Pressable
                  style={styles.loadMore}
                  onPress={() => void clients.fetchNextPage()}
                  disabled={clients.isFetchingNextPage}
                >
                  <Text style={styles.loadMoreText}>
                    {clients.isFetchingNextPage ? 'Cargando...' : 'Cargar más clientes'}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        ) : null}

        {/* FAB */}
        {allItems.length > 0 || clients.isPending ? (
          <Link href="/(app)/clients/new" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: c.primary },
                pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons name="person-add" size={24} color={c.onPrimary} />
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

    // Buscador
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.card,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      paddingHorizontal: Spacing.md,
      minHeight: 50,
      ...Shadow.sm,
    },
    searchIcon: { marginRight: Spacing.xs },
    searchInput: {
      flex: 1,
      fontSize: Typography.md,
      color: c.text,
      paddingVertical: 10,
    },

    // Filas
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
    rowMain: { flex: 1, gap: 3 },
    rowTitle: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: c.text },
    rowSubtitle: { fontSize: Typography.xs, color: c.textMuted, fontWeight: FontWeight.medium },
    rowRight: { alignItems: 'flex-end', justifyContent: 'center' },

    // Carga más
    loadMore: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.sm },
    loadMoreText: { color: c.primary, fontWeight: FontWeight.bold, fontSize: Typography.sm },

    // Vacío
    emptyBox: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xxl },
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
