import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/config/supabase';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError, toast, hideToast } = useToast();
  const [notifications, setNotifications] = useState({
    notify_new_budget: false,
    notify_order_confirmed: false,
    notify_cake_ready: false,
    notify_out_for_delivery: false,
  });
  const [saving, setSaving] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3); // Simulado por enquanto

  useEffect(() => {
    if (user) {
      setNotifications({
        notify_new_budget: user.notify_new_budget || false,
        notify_order_confirmed: user.notify_order_confirmed || false,
        notify_cake_ready: user.notify_cake_ready || false,
        notify_out_for_delivery: user.notify_out_for_delivery || false,
      });
    }
  }, [user]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveNotifications = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update(notifications)
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Preferências de notificação salvas!');
    } catch (error: any) {
      showError(error.message || 'Falha ao salvar notificações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notificações" 
        showBackButton={true}
        onBackPress={() => router.back()}
        notificationsCount={notificationsCount}
      />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Configure quais notificações você deseja receber:
        </Text>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Novo Orçamento</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando um novo orçamento for criado
            </Text>
          </View>
          <Switch
            value={notifications.notify_new_budget}
            onValueChange={() => toggleNotification('notify_new_budget')}
            trackColor={{ false: '#e0e0e0', true: Theme.colors.primary }}
            thumbColor={notifications.notify_new_budget ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Pedido Confirmado</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando um orçamento for convertido em pedido
            </Text>
          </View>
          <Switch
            value={notifications.notify_order_confirmed}
            onValueChange={() => toggleNotification('notify_order_confirmed')}
            trackColor={{ false: '#e0e0e0', true: Theme.colors.primary }}
            thumbColor={notifications.notify_order_confirmed ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Bolo Pronto</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando o status mudar para "Bolo Pronto"
            </Text>
          </View>
          <Switch
            value={notifications.notify_cake_ready}
            onValueChange={() => toggleNotification('notify_cake_ready')}
            trackColor={{ false: '#e0e0e0', true: Theme.colors.primary }}
            thumbColor={notifications.notify_cake_ready ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Saiu para Entrega</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando o status mudar para "Saiu para Entrega"
            </Text>
          </View>
          <Switch
            value={notifications.notify_out_for_delivery}
            onValueChange={() => toggleNotification('notify_out_for_delivery')}
            trackColor={{ false: '#e0e0e0', true: Theme.colors.primary }}
            thumbColor={notifications.notify_out_for_delivery ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={saveNotifications}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Text>
        </TouchableOpacity>
      </View>

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
    paddingTop: 24,
  },
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
