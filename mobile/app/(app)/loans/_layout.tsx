import { Stack } from 'expo-router';
import { usePalette } from '@/hooks/use-palette';
import { FontWeight, Typography } from '@/constants/tokens';

export default function LoansLayout() {
  const c = usePalette();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: c.surface },
        headerShadowVisible: false,
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: FontWeight.bold as any, fontSize: Typography.md, color: c.text },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Préstamos' }} />
      <Stack.Screen name="new" options={{ title: 'Nuevo préstamo' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle del préstamo' }} />
      <Stack.Screen name="collections" options={{ title: 'Cobros de hoy' }} />
    </Stack>
  );
}
