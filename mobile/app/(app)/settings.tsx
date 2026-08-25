import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { fetchCurrentUser, logoutUser } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { formatIsoDateShort } from '@/utils/money';

type Ionicon = keyof typeof Ionicons.glyphMap;

/**
 * Perfil y ajustes (UI_UX.md §84). Presentación pura: los datos vienen
 * del backend; aquí solo se muestra información y se cierra sesión.
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const c = usePalette();
  const styles = makeStyles(c);

  const user = useAuthStore((state) => state.user);
  const me = useQuery({ queryKey: ['me'], queryFn: fetchCurrentUser });

  const profile = me.data ?? user;
  const initials =
    (profile?.full_name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      'Tendrás que iniciar sesión otra vez para volver a entrar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => void logoutUser(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Perfil */}
        <View style={[styles.profileCard, { backgroundColor: c.surface }]}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={[styles.avatarText, { color: c.onPrimary }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
              {profile?.full_name ?? '…'}
            </Text>
            <Text style={[styles.email, { color: c.textMuted }]} numberOfLines={1}>
              {profile?.email ?? ''}
            </Text>
            <Badge label="Cuenta activa" tone="success" />
          </View>
        </View>

        <Section title="Perfil" icon="person-outline" c={c} styles={styles}>
          <Row
            c={c}
            styles={styles}
            icon="mail-outline"
            label="Correo"
            value={profile?.email ?? '—'}
          />
          <Row
            c={c}
            styles={styles}
            icon="calendar-outline"
            label="Miembro desde"
            value={profile ? formatIsoDateShort(profile.created_at.slice(0, 10)) : '—'}
          />
        </Section>

        <Section title="Preferencias" icon="options-outline" c={c} styles={styles}>
          <Row c={c} styles={styles} icon="color-palette-outline" label="Tema" value="Según el sistema" />
          <Row c={c} styles={styles} icon="language-outline" label="Idioma" value="Español" />
          <Row c={c} styles={styles} icon="cash-outline" label="Moneda" value="COP" />
        </Section>

        <Section title="Seguridad" icon="shield-checkmark-outline" c={c} styles={styles}>
          <Pressable
            style={({ pressed }) => [styles.rowLink, pressed && { opacity: 0.55 }]}
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'El cambio de contraseña llegará en una próxima actualización.'
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
          >
            <Ionicons name="key-outline" size={18} color={c.textMuted} />
            <Text style={[styles.rowLabel, { color: c.text }]}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
          <Row
            c={c}
            styles={styles}
            icon="phone-portrait-outline"
            label="Sesiones activas"
            value="Este dispositivo"
          />
        </Section>

        <Section title="Acerca de" icon="information-circle-outline" c={c} styles={styles}>
          <Row c={c} styles={styles} icon="apps-outline" label="Versión" value="1.0.0" />
          <Row c={c} styles={styles} icon="server-outline" label="Backend" value="Render · Supabase" />
        </Section>

        <Button label="Cerrar sesión" onPress={confirmLogout} variant="danger" fullWidth />

        <Text style={[styles.footer, { color: c.textSubtle }]}>
          PocketPal v1.0.0 · Tus datos están protegidos y aislados por usuario
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  c,
  styles,
  children,
}: {
  title: string;
  icon: Ionicon;
  c: Palette;
  styles: Record<string, object>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={15} color={c.primary} />
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>{children}</View>
    </View>
  );
}

function Row({
  c,
  styles,
  icon,
  label,
  value,
}: {
  c: Palette;
  styles: Record<string, object>;
  icon: Ionicon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={17} color={c.textMuted} style={{ marginRight: 2 }} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    container: { padding: Spacing.md, gap: Spacing.lg },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 24, fontWeight: '800' },
    profileInfo: { flex: 1, gap: 3 },
    name: { fontSize: 20, fontWeight: '800' },
    email: { fontSize: 13 },
    section: { gap: Spacing.sm },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
    },
    sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
    sectionCard: {
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: Spacing.md,
      gap: 2,
      borderColor: c.borderSubtle,
    },
    row: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    rowLabel: { flex: 1, fontSize: 14.5 },
    rowValue: { fontSize: 13.5, opacity: 0.75, maxWidth: '55%', textAlign: 'right' },
    rowLink: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    footer: { textAlign: 'center', fontSize: 12 },
  });
