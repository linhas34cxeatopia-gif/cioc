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
        borderTopWidth: 0,
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 8,
          },
        }),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="orders/index" options={{ title: 'Encomendas', tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: 'Clientes', tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} /> }} />
      <Tabs.Screen name="budgets/index" options={{ title: 'Orçamentos', tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} /> }} />
      <Tabs.Screen name="kitchen/index" options={{ title: 'Cozinha', tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} /> }} />

      {/* Rotas ocultas do budgets */}
      <Tabs.Screen name="budgets/new" options={{ href: null }} />
      <Tabs.Screen name="budgets/[id]" options={{ href: null }} />
      <Tabs.Screen name="budgets/steps" options={{ href: null }} />

      {/* Rotas ocultas do clients */}
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />
      <Tabs.Screen name="clients/new" options={{ href: null }} />
      <Tabs.Screen name="clients/edit" options={{ href: null }} />
      <Tabs.Screen name="clients/address-new" options={{ href: null }} />
      <Tabs.Screen name="clients/address-edit" options={{ href: null }} />
      
      {/* Rotas ocultas do products */}
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="products/index" options={{ href: null }} />
      <Tabs.Screen name="products/new" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      
      {/* Rotas ocultas gerais */}
      <Tabs.Screen name="register/index" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="settings/categories" options={{ href: null }} />
    </Tabs>
  );
}
