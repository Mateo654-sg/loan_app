import { Stack } from 'expo-router';

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Clientes' }} />
      <Stack.Screen name="new" options={{ title: 'New customer' }} />
      <Stack.Screen name="[id]" options={{ title: 'Customer' }} />
    </Stack>
  );
}
