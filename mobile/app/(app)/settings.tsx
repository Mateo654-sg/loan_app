import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { FontWeight, Radius, Shadow, Spacing, Typography } from '@/constants/tokens';
import { usePalette } from '@/hooks/use-palette';
import type { Palette } from '@/theme/palette';
import { useThemeStore, type ThemePreference } from '@/stores/theme-store';
import { fetchCurrentUser, logoutUser, updateUserProfile, changePassword } from '@/services/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { formatIsoDateShort } from '@/utils/money';
import { FormInput } from '@/components/form-input';
import { getErrorMessage } from '@/utils/errors-es';

const editProfileSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
  new_password: z.string().min(8, 'Mínimo 8 caracteres').max(128, 'Máximo 128 caracteres'),
  confirm_password: z.string().min(1, 'Confirma tu nueva contraseña'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type EditProfileData = z.infer<typeof editProfileSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: 'light', label: 'Claro', icon: 'sunny' },
  { key: 'dark', label: 'Oscuro', icon: 'moon' },
  { key: 'system', label: 'Sistema', icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const c = usePalette();
  const styles = makeStyles(c);
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const me = useQuery({ queryKey: ['me'], queryFn: fetchCurrentUser });
  const profile = me.data ?? user;

  const { preference, setPreference } = useThemeStore();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || '?';

  const profileForm = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  });

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    setProfileError(null);
    try {
      await updateUserProfile({ full_name: values.full_name });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowEditProfile(false);
    } catch (e) {
      setProfileError(getErrorMessage(e));
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordError(null);
    try {
      await changePassword({ current_password: values.current_password, new_password: values.new_password });
      passwordForm.reset();
      setShowChangePassword(false);
      Alert.alert('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente.');
    } catch (e) {
      setPasswordError(getErrorMessage(e));
    }
  });

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      'Tendrás que iniciar sesión nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => void logoutUser() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Perfil y ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <LinearGradient colors={c.heroGradientDark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
          <LinearGradient colors={c.primaryGradient} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{profile?.full_name ?? '...'}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{profile?.email ?? ''}</Text>
            {profile?.created_at ? (
              <Text style={styles.profileSince}>Miembro desde {formatIsoDateShort(profile.created_at.slice(0, 10))}</Text>
            ) : null}
          </View>
          <Pressable style={styles.editProfileBtn} onPress={() => { profileForm.reset({ full_name: profile?.full_name ?? '' }); setShowEditProfile(true); }}>
            <Ionicons name="pencil" size={16} color="#FFF" />
          </Pressable>
        </LinearGradient>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>APARIENCIA</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <View style={styles.cardRow}>
              <Ionicons name="color-palette-outline" size={18} color={c.primary} />
              <Text style={[styles.cardLabel, { color: c.text }]}>Tema de la app</Text>
            </View>
            <View style={styles.themeChips}>
              {THEME_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.themeChip, { borderColor: preference === opt.key ? c.primary : c.borderSubtle, backgroundColor: preference === opt.key ? c.primarySoft : c.surface }]}
                  onPress={() => void setPreference(opt.key)}
                >
                  <Ionicons name={opt.icon as any} size={15} color={preference === opt.key ? c.primary : c.textMuted} />
                  <Text style={[styles.themeChipText, { color: preference === opt.key ? c.primary : c.textMuted }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Seguridad */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SEGURIDAD</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <Pressable style={styles.actionRow} onPress={() => { passwordForm.reset(); setPasswordError(null); setShowChangePassword(!showChangePassword); }}>
              <Ionicons name="key-outline" size={18} color={c.primary} />
              <Text style={[styles.actionLabel, { color: c.text }]}>Cambiar contraseña</Text>
              <Ionicons name={showChangePassword ? 'chevron-up' : 'chevron-down'} size={16} color={c.textMuted} />
            </Pressable>

            {showChangePassword ? (
              <View style={[styles.inlineForm, { borderTopColor: c.borderSubtle }]}>
                <Controller control={passwordForm.control} name="current_password" render={({ field: { onChange, value } }) => (
                  <FormInput label="Contraseña actual" value={value} onChangeText={onChange} secureTextEntry leftIcon="lock-closed-outline" error={passwordForm.formState.errors.current_password?.message} />
                )} />
                <Controller control={passwordForm.control} name="new_password" render={({ field: { onChange, value } }) => (
                  <FormInput label="Nueva contraseña" value={value} onChangeText={onChange} secureTextEntry leftIcon="lock-open-outline" error={passwordForm.formState.errors.new_password?.message} />
                )} />
                <Controller control={passwordForm.control} name="confirm_password" render={({ field: { onChange, value } }) => (
                  <FormInput label="Confirmar nueva contraseña" value={value} onChangeText={onChange} secureTextEntry leftIcon="checkmark-circle-outline" error={passwordForm.formState.errors.confirm_password?.message} />
                )} />
                {passwordError ? <Text style={[styles.formError, { color: c.danger }]}>{passwordError}</Text> : null}
                <Pressable style={({ pressed }) => [styles.inlineBtn, { backgroundColor: c.primary, opacity: pressed || passwordForm.formState.isSubmitting ? 0.8 : 1 }]} onPress={() => void onChangePassword()} disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.inlineBtnText}>Actualizar contraseña</Text>}
                </Pressable>
              </View>
            ) : null}

            <View style={[styles.infoRow, { borderTopColor: c.borderSubtle }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={c.textMuted} />
              <Text style={[styles.infoLabel, { color: c.text }]}>Sesión activa</Text>
              <Text style={[styles.infoValue, { color: c.textMuted }]}>Este dispositivo</Text>
            </View>
          </View>
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>CUENTA</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={c.textMuted} />
              <Text style={[styles.infoLabel, { color: c.text }]}>Correo electrónico</Text>
              <Text style={[styles.infoValue, { color: c.textMuted }]} numberOfLines={1}>{profile?.email ?? '—'}</Text>
            </View>
            <View style={[styles.infoRow, { borderTopColor: c.borderSubtle }]}>
              <Ionicons name="cash-outline" size={18} color={c.textMuted} />
              <Text style={[styles.infoLabel, { color: c.text }]}>Moneda</Text>
              <Text style={[styles.infoValue, { color: c.textMuted }]}>COP</Text>
            </View>
          </View>
        </View>

        {/* Acerca de */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ACERCA DE</Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
            <View style={styles.infoRow}>
              <Ionicons name="apps-outline" size={18} color={c.textMuted} />
              <Text style={[styles.infoLabel, { color: c.text }]}>Versión</Text>
              <Text style={[styles.infoValue, { color: c.textMuted }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <Pressable style={({ pressed }) => [styles.logoutBtn, { backgroundColor: c.dangerSoft, borderColor: c.danger + '30', opacity: pressed ? 0.8 : 1 }]} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <Text style={[styles.logoutText, { color: c.danger }]}>Cerrar sesión</Text>
        </Pressable>

        <Text style={[styles.footer, { color: c.textSubtle }]}>PocketPal v1.0.0 · Tus datos están protegidos</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditProfile(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Editar perfil</Text>
            <Pressable onPress={() => setShowEditProfile(false)} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={c.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Controller control={profileForm.control} name="full_name" render={({ field: { onChange, value } }) => (
              <FormInput label="Nombre completo" value={value} onChangeText={onChange} autoCapitalize="words" leftIcon="person-outline" error={profileForm.formState.errors.full_name?.message} />
            )} />
            {profileError ? <Text style={[styles.formError, { color: c.danger }]}>{profileError}</Text> : null}
            <Pressable style={({ pressed }) => [styles.inlineBtn, { backgroundColor: c.primary, opacity: pressed || profileForm.formState.isSubmitting ? 0.8 : 1 }]} onPress={() => void onSaveProfile()} disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.inlineBtnText}>Guardar cambios</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    headerRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    pageTitle: { fontSize: Typography.xxl, fontWeight: FontWeight.black as any, color: c.text },
    container: { paddingHorizontal: Spacing.md, gap: Spacing.lg },
    profileCard: { borderRadius: Radius.cardLg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.xl },
    avatar: { width: 60, height: 60, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, fontWeight: FontWeight.black as any, color: '#FFF' },
    profileName: { fontSize: Typography.md, fontWeight: FontWeight.black as any, color: '#FFF' },
    profileEmail: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    profileSince: { fontSize: Typography.xxs, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
    editProfileBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    section: { gap: 6 },
    sectionLabel: { fontSize: Typography.xxs, fontWeight: FontWeight.extrabold as any, letterSpacing: 1.4, paddingHorizontal: 2 },
    card: { borderRadius: Radius.card, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
    cardLabel: { fontSize: Typography.base, fontWeight: FontWeight.semibold as any, flex: 1 },
    themeChips: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
    themeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: Radius.md, borderWidth: 1.5, paddingVertical: 10 },
    themeChipText: { fontSize: Typography.xs, fontWeight: FontWeight.bold as any },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, minHeight: 52 },
    actionLabel: { flex: 1, fontSize: Typography.base, fontWeight: FontWeight.semibold as any },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth },
    infoLabel: { flex: 1, fontSize: Typography.base },
    infoValue: { fontSize: Typography.sm, maxWidth: '50%', textAlign: 'right' },
    inlineForm: { padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.sm },
    inlineBtn: { borderRadius: Radius.button, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
    inlineBtnText: { color: '#FFF', fontSize: Typography.base, fontWeight: FontWeight.bold as any },
    formError: { fontSize: Typography.sm, textAlign: 'center' },
    logoutBtn: { borderRadius: Radius.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, minHeight: 52, borderWidth: 1 },
    logoutText: { fontSize: Typography.base, fontWeight: FontWeight.bold as any },
    footer: { textAlign: 'center', fontSize: Typography.xs, paddingBottom: Spacing.lg },
    modalSafe: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    modalTitle: { fontSize: Typography.lg, fontWeight: FontWeight.black as any },
    modalClose: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    modalContent: { padding: Spacing.lg, gap: Spacing.md },
  });
