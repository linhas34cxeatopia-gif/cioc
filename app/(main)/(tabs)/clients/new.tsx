import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewClientScreen() {
  const router = useRouter();
  const { showSuccess, showError, toast, hideToast } = useToast();
  
  // Estados dos campos
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [observations, setObservations] = useState('');
  
  // Estados de controle
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Refs para navegação entre campos
  const nameRef = useRef<TextInput>(null);
  const whatsappRef = useRef<TextInput>(null);
  const cepRef = useRef<TextInput>(null);
  const streetRef = useRef<TextInput>(null);
  const houseNumberRef = useRef<TextInput>(null);
  const complementRef = useRef<TextInput>(null);
  const neighborhoodRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const observationsRef = useRef<TextInput>(null);

  const fetchAddressByCep = async (cepValue: string) => {
    if (cepValue.length !== 8) return;
    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
        setTimeout(() => {
          houseNumberRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (text: string) => {
    const numericCep = text.replace(/\D/g, '');
    setCep(numericCep);
    if (numericCep.length === 8) fetchAddressByCep(numericCep);
  };

  const handleCepSubmit = () => {
    if (cep.length === 8) houseNumberRef.current?.focus();
  };

  const validateForm = () => {
    if (!name.trim()) { showError('Nome é obrigatório'); return false; }
    if (!whatsapp.trim()) { showError('WhatsApp é obrigatório'); return false; }
    return true;
  };

  const insertClientAndAddress = async () => {
    // Insere cliente e retorna id
    const { data: client, error: insertClientError } = await supabase
      .from('clients')
      .insert([{ name: name.trim(), whatsapp: whatsapp.trim(), cep: cep.trim() || null, observations: observations.trim() || null }])
      .select('id')
      .single();
    if (insertClientError) throw insertClientError;

    // Insere endereço principal
    const { error: addrError } = await supabase
      .from('client_addresses')
      .insert([{ 
        client_id: client.id,
        street: street.trim(),
        house_number: houseNumber.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim(),
        state: state.trim(),
        cep: cep.trim() || null,
        is_primary: true,
      }]);
    if (addrError) throw addrError;

    return client.id as string;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      await insertClientAndAddress();
      showSuccess('Cliente cadastrado com sucesso!');
      setTimeout(() => { router.back(); }, 1500);
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      showError(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBudget = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const clientId = await insertClientAndAddress();
      showSuccess('Cliente cadastrado com sucesso!');
      setTimeout(() => {
        Alert.alert('Funcionalidade em Desenvolvimento','A tela de orçamento será implementada em breve. O cliente foi cadastrado com sucesso!',[{ text: 'OK', onPress: () => router.back() }]);
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      showError(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Novo Cliente" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput ref={nameRef} style={styles.input} value={name} onChangeText={setName} placeholder="Digite o nome completo" placeholderTextColor={Theme.colors.textSecondary} returnKeyType="next" onSubmitEditing={() => whatsappRef.current?.focus()} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp *</Text>
            <TextInput ref={whatsappRef} style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="(11) 99999-9999" placeholderTextColor={Theme.colors.textSecondary} keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => cepRef.current?.focus()} />
          </View>

          <Text style={styles.sectionTitle}>Endereço</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP</Text>
            <View style={styles.cepContainer}>
              <TextInput ref={cepRef} style={[styles.input, styles.cepInput]} value={cep} onChangeText={handleCepChange} placeholder="00000-000" placeholderTextColor={Theme.colors.textSecondary} keyboardType="numeric" maxLength={8} returnKeyType="next" onSubmitEditing={handleCepSubmit} />
              {loadingCep && (<ActivityIndicator size="small" color={Theme.colors.primary} style={styles.cepLoading} />)}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rua</Text>
            <TextInput ref={streetRef} style={styles.input} value={street} onChangeText={setStreet} placeholder="Nome da rua" placeholderTextColor={Theme.colors.textSecondary} returnKeyType="next" onSubmitEditing={() => houseNumberRef.current?.focus()} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Número</Text>
              <TextInput ref={houseNumberRef} style={styles.input} value={houseNumber} onChangeText={setHouseNumber} placeholder="123" placeholderTextColor={Theme.colors.textSecondary} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => complementRef.current?.focus()} />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Complemento</Text>
              <TextInput ref={complementRef} style={styles.input} value={complement} onChangeText={setComplement} placeholder="Apto 15, Bloco B" placeholderTextColor={Theme.colors.textSecondary} returnKeyType="done" onSubmitEditing={handleSave} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro</Text>
            <TextInput ref={neighborhoodRef} style={styles.input} value={neighborhood} onChangeText={setNeighborhood} placeholder="Nome do bairro" placeholderTextColor={Theme.colors.textSecondary} returnKeyType="next" onSubmitEditing={() => cityRef.current?.focus()} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput ref={cityRef} style={styles.input} value={city} onChangeText={setCity} placeholder="Nome da cidade" placeholderTextColor={Theme.colors.textSecondary} returnKeyType="next" onSubmitEditing={() => stateRef.current?.focus()} />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estado</Text>
              <TextInput ref={stateRef} style={styles.input} value={state} onChangeText={setState} placeholder="UF" placeholderTextColor={Theme.colors.textSecondary} maxLength={2} returnKeyType="next" onSubmitEditing={() => observationsRef.current?.focus()} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <TextInput ref={observationsRef} style={[styles.input, styles.textArea]} value={observations} onChangeText={setObservations} placeholder="Observações sobre o cliente..." placeholderTextColor={Theme.colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" returnKeyType="done" onSubmitEditing={handleSave} />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleSave} disabled={saving}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>{saving ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSaveAndBudget} disabled={saving}>
              <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar e Orçamento'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  safeArea: { backgroundColor: '#000' },
  keyboardAvoidingView: { flex: 1 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.text, marginTop: 24, marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: Theme.colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  textArea: { height: 100, paddingTop: 16 },
  cepContainer: { flexDirection: 'row', alignItems: 'center' },
  cepInput: { flex: 1, marginRight: 12 },
  cepLoading: { marginLeft: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  buttonContainer: { marginTop: 32, marginBottom: 40, gap: 16 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Theme.colors.primary },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryButtonText: { color: Theme.colors.primary },
});
