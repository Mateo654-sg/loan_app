import { Stack } from 'expo-router';
import { usePalette } from '@/hooks/use-palette';
import { FontWeight, Typography } from '@/constants/tokens';

export default function ClientsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Clientes' }} />
      <Stack.Screen name="new" options={{ title: 'Nuevo cliente' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle del cliente' }} />
    </Stack>
  );
}
