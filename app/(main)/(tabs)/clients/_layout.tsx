import { Stack } from 'expo-router';

export default function ClientsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="address-new" />
      <Stack.Screen name="address-edit" />
    </Stack>
  );
}
