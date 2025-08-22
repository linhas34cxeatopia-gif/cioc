import { useAuth } from '@/contexts/AuthContext';
import { QuotationProvider } from '@/contexts/QuotationContext';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <QuotationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/notifications" />
      </Stack>
    </QuotationProvider>
  );
}
