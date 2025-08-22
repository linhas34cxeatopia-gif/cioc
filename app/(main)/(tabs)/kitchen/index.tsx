import { Theme } from '@/constants/Theme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function KitchenScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3); // Simulado por enquanto
  const { toast, hideToast } = useToast();

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Cozinha" 
        onMenuPress={() => setSideMenuVisible(true)}
        notificationsCount={notificationsCount}
      />
      
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Em breve: fila de produção e status de pedidos.
        </Text>
      </View>

      <SideMenu 
        visible={sideMenuVisible}
        onClose={() => setSideMenuVisible(false)}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});
