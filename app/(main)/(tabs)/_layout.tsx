import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Platform.select({ ios: '#D4AF37', default: '#D4AF37' }),
        tabBarInactiveTintColor: '#8a8a8a',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Encomendas', tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} /> }} />
      <Tabs.Screen name="budgets/index" options={{ title: 'Orçamentos', tabBarIcon: ({ color }) => <Ionicons name="calculator" size={24} color={color} /> }} />
      <Tabs.Screen name="budgets/new" options={{ href: null }} />
      <Tabs.Screen name="budgets/[id]" options={{ href: null }} />
      <Tabs.Screen name="clients" options={{ title: 'Clientes', tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} /> }} />
      <Tabs.Screen name="kitchen/index" options={{ title: 'Cozinha', tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} /> }} />

      {/* ocultas */}
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />
      <Tabs.Screen name="clients/new" options={{ href: null }} />
      <Tabs.Screen name="clients/edit" options={{ href: null }} />
      <Tabs.Screen name="clients/address-new" options={{ href: null }} />
      <Tabs.Screen name="clients/address-edit" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="products/index" options={{ href: null }} />
      <Tabs.Screen name="products/new" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      <Tabs.Screen name="register/index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="settings/categories" options={{ href: null }} />
    </Tabs>
  );
}
