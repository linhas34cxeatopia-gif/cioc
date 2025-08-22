import { Theme } from '@/constants/Theme';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function OrdersScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notificationsCount, setNotificationsCount] = useState(3); // Simulado por enquanto
  const { toast, hideToast } = useToast();

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const setToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Encomendas" 
        onMenuPress={() => setSideMenuVisible(true)}
        notificationsCount={notificationsCount}
      />
      
      <View style={styles.content}>
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>Data: {formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.todayButton} onPress={setToday}>
            <Text style={styles.todayButtonText}>HOJE</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.placeholder}>
          Em breve: filtro de data e lista do dia.
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
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginRight: 16,
  },
  todayButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
