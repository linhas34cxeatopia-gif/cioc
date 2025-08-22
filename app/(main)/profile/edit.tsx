import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError, toast, hideToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3); // Simulado por enquanto

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      await updateUser({ name: name.trim() });
      showSuccess('Perfil atualizado com sucesso!');
      router.back();
    } catch (error: any) {
      showError(error.message || 'Falha ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Editar Perfil" 
        showBackButton={true}
        onBackPress={() => router.back()}
        notificationsCount={notificationsCount}
      />
      
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Salvando...' : 'Salvar'}
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
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
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
