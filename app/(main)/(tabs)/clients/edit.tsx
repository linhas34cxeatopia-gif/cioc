import { Theme } from '@/constants/Theme';
import { supabase } from '@/config/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface Client {
  id: string;
  name: string;
  whatsapp?: string;
  cep?: string;
  observations?: string;
  created_at: string;
}

export default function EditClientScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showSuccess, showError, toast, hideToast } = useToast();
  
  // Estados dos campos
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [observations, setObservations] = useState('');
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Refs para navegação entre campos
  const nameRef = useRef<TextInput>(null);
  const whatsappRef = useRef<TextInput>(null);
  const cepRef = useRef<TextInput>(null);
  const observationsRef = useRef<TextInput>(null);

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setName(data.name || '');
      setWhatsapp(data.whatsapp || '');
      setCep(data.cep || '');
      setObservations(data.observations || '');
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error);
      showError('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      showError('Nome é obrigatório');
      return false;
    }
    if (!whatsapp.trim()) {
      showError('WhatsApp é obrigatório');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('clients')
        .update({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          cep: cep.trim() || null,
          observations: observations.trim() || null,
        })
        .eq('id', id);

      if (error) throw error;

      showSuccess('Cliente atualizado com sucesso!');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      showError(error.message || 'Erro ao atualizar cliente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Header
            title="Editar Cliente"
            showBackButton={true}
            onBackPress={() => router.back()}
            notificationsCount={3}
          />
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando cliente...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          title="Editar Cliente"
          showBackButton={true}
          onBackPress={() => router.back()}
          notificationsCount={3}
        />
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite o nome completo"
              placeholderTextColor={Theme.colors.textSecondary}
              returnKeyType="next"
              onSubmitEditing={() => whatsappRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp *</Text>
            <TextInput
              ref={whatsappRef}
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="(11) 99999-9999"
              placeholderTextColor={Theme.colors.textSecondary}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => cepRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP</Text>
            <TextInput
              ref={cepRef}
              style={styles.input}
              value={cep}
              onChangeText={setCep}
              placeholder="00000-000"
              placeholderTextColor={Theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={8}
              returnKeyType="next"
              onSubmitEditing={() => observationsRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <TextInput
              ref={observationsRef}
              style={[styles.input, styles.textArea]}
              value={observations}
              onChangeText={setObservations}
              placeholder="Observações sobre o cliente..."
              placeholderTextColor={Theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={() => {
                observationsRef.current?.blur();
              }}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  safeArea: {
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  buttonContainer: {
    marginTop: 32,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
});
