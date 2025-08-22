import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

type MenuView = 'main' | 'settings' | 'editProfile' | 'notifications' | 'changePassword';

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [currentView, setCurrentView] = useState<MenuView>('main');
  const [notificationsCount, setNotificationsCount] = useState(0);
  
  // Estados para editar perfil
  const [editName, setEditName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Estados para alterar senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Estados para notificações
  const [notificationPrefs, setNotificationPrefs] = useState({
    notify_new_budget: false,
    notify_order_confirmed: false,
    notify_cake_ready: false,
    notify_out_for_delivery: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setNotificationPrefs({
        notify_new_budget: user.notify_new_budget || false,
        notify_order_confirmed: user.notify_order_confirmed || false,
        notify_cake_ready: user.notify_cake_ready || false,
        notify_out_for_delivery: user.notify_out_for_delivery || false,
      });
    }
    // Simular contagem de notificações (depois será integrado com backend)
    setNotificationsCount(3);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
    onClose();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showError('Nome é obrigatório');
      return;
    }

    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from('users')
        .update({ name: editName.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      showSuccess('Perfil atualizado com sucesso!');
      setCurrentView('settings');
    } catch (error: any) {
      showError(error.message || 'Falha ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
      showError('Verifique os campos de senha. A nova senha deve ter pelo menos 6 caracteres e as senhas devem coincidir.');
      return;
    }

    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      showSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentView('settings');
    } catch (error: any) {
      showError(error.message || 'Falha ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setSavingNotifications(true);
      const { error } = await supabase
        .from('users')
        .update(notificationPrefs)
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Preferências de notificação salvas!');
      setCurrentView('settings');
    } catch (error: any) {
      showError(error.message || 'Falha ao salvar notificações');
    } finally {
      setSavingNotifications(false);
    }
  };

  const renderMainMenu = () => (
    <>
      {/* Header com informações do usuário */}
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>

      <View style={styles.divider} />

      {/* Menu principal */}
      <TouchableOpacity style={styles.menuItem} onPress={() => showInfo('Dashboard será implementado em breve')}>
        <Ionicons name="grid" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => showInfo('Tela de notificações global será implementada em breve')}>
        <Ionicons name="notifications" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Notificações</Text>
        {notificationsCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { onClose?.(); router.push('/(main)/(tabs)/products' as any); }} style={styles.menuItem}>
        <Ionicons name="grid" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Produtos</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('settings')}>
        <Ionicons name="settings" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Configurações</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/(main)/(tabs)/settings/builder-templates' as any); }}>
        <Ionicons name="construct" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Produtos Montáveis</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </>
  );

  const renderSettingsMenu = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Configurações</Text>
        <View style={styles.placeholder} />
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('editProfile')}>
        <Ionicons name="person" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Editar Perfil</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('notifications')}>
        <Ionicons name="notifications" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Preferências de Notificação</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('changePassword')}>
        <Ionicons name="lock-closed" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Alterar Senha</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/(main)/(tabs)/settings/categories' as any); }}>
        <Ionicons name="pricetags" size={20} color={Theme.colors.text} />
        <Text style={styles.menuText}>Categorias</Text>
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </>
  );

  const renderEditProfile = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('settings')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Editar Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={editName}
          onChangeText={setEditName}
          placeholder="Digite seu nome"
          placeholderTextColor={Theme.colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, savingProfile && styles.buttonDisabled]}
        onPress={handleSaveProfile}
        disabled={savingProfile}
      >
        <Text style={styles.buttonText}>
          {savingProfile ? 'Salvando...' : 'Salvar'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderNotifications = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('settings')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Preferências de Notificação</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.formSection}>
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
          <TouchableOpacity
            style={[styles.toggle, notificationPrefs.notify_new_budget && styles.toggleActive]}
            onPress={() => setNotificationPrefs(prev => ({ ...prev, notify_new_budget: !prev.notify_new_budget }))}
          >
            <View style={[styles.toggleThumb, notificationPrefs.notify_new_budget && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Pedido Confirmado</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando um orçamento for convertido em pedido
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notificationPrefs.notify_order_confirmed && styles.toggleActive]}
            onPress={() => setNotificationPrefs(prev => ({ ...prev, notify_order_confirmed: !prev.notify_order_confirmed }))}
          >
            <View style={[styles.toggleThumb, notificationPrefs.notify_order_confirmed && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Bolo Pronto</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando o status mudar para "Bolo Pronto"
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notificationPrefs.notify_cake_ready && styles.toggleActive]}
            onPress={() => setNotificationPrefs(prev => ({ ...prev, notify_cake_ready: !prev.notify_cake_ready }))}
          >
            <View style={[styles.toggleThumb, notificationPrefs.notify_cake_ready && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Saiu para Entrega</Text>
            <Text style={styles.notificationDescription}>
              Receber notificação quando o status mudar para "Saiu para Entrega"
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notificationPrefs.notify_out_for_delivery && styles.toggleActive]}
            onPress={() => setNotificationPrefs(prev => ({ ...prev, notify_out_for_delivery: !prev.notify_out_for_delivery }))}
          >
            <View style={[styles.toggleThumb, notificationPrefs.notify_out_for_delivery && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, savingNotifications && styles.buttonDisabled]}
        onPress={handleSaveNotifications}
        disabled={savingNotifications}
      >
        <Text style={styles.buttonText}>
          {savingNotifications ? 'Salvando...' : 'Salvar Preferências'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderChangePassword = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('settings')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Alterar Senha</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Senha Atual</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Digite sua senha atual"
          placeholderTextColor={Theme.colors.textSecondary}
        />

        <Text style={styles.label}>Nova Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={Theme.colors.textSecondary}
        />

        <Text style={styles.label}>Confirmar Nova Senha</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme sua nova senha"
          placeholderTextColor={Theme.colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, savingPassword && styles.buttonDisabled]}
        onPress={handleChangePassword}
        disabled={savingPassword}
      >
        <Text style={styles.buttonText}>
          {savingPassword ? 'Salvando...' : 'Alterar Senha'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'main':
        return renderMainMenu();
      case 'settings':
        return renderSettingsMenu();
      case 'editProfile':
        return renderEditProfile();
      case 'notifications':
        return renderNotifications();
      case 'changePassword':
        return renderChangePassword();
      default:
        return renderMainMenu();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.brand}>cioccoletti</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>

          {/* Botão Sair sempre visível na parte inferior */}
          {currentView === 'main' && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: { 
    flex: 1, 
    width: width * 0.85, 
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  brand: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: Theme.colors.primary 
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userHeader: {
    paddingVertical: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  menuText: {
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  formSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Theme.colors.backgroundSecondary,
    color: Theme.colors.text,
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
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  logoutText: {
    fontSize: 16,
    color: Theme.colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
});
