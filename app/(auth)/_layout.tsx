import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Cadastro',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="waiting-approval"
        options={{
          title: 'Aguardando Aprovação',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
