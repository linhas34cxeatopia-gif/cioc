import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <TouchableOpacity onPress={() => setMenuOpen((m) => !m)} style={styles.burger}>
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
          <View style={styles.burgerLine} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/(tabs)/profile/edit')}>
            <Text style={styles.menuText}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/(tabs)/profile/notifications')}>
            <Text style={styles.menuText}>Notificações</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, { color: Theme.colors.error }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.name}</Text>

        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Função</Text>
        <Text style={styles.value}>{user?.role}</Text>

        <Text style={styles.label}>Acesso</Text>
        <Text style={styles.value}>{user?.approved ? 'Aprovado' : 'Pendente'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: Theme.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Theme.spacing.lg },
  title: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.text },
  burger: { padding: 8 },
  burgerLine: { width: 24, height: 2, backgroundColor: Theme.colors.text, marginVertical: 2, borderRadius: 2 },
  menu: { position: 'absolute', top: 64, right: 16, backgroundColor: '#fff', borderRadius: 12, ...Theme.shadows.medium, zIndex: 10 },
  menuItem: { paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { fontSize: 16, color: Theme.colors.text },
  menuDivider: { height: 1, backgroundColor: Theme.colors.border },
  card: { backgroundColor: Theme.colors.backgroundSecondary, borderRadius: 16, padding: 16, ...Theme.shadows.small },
  label: { marginTop: 12, color: Theme.colors.textSecondary, fontSize: 14 },
  value: { fontSize: 16, fontWeight: '600', color: Theme.colors.text },
});
