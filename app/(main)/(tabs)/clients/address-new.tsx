import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressNewScreen() {
  const params = useLocalSearchParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const router = useRouter();
  const { showSuccess, showError, toast, hideToast } = useToast();

  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cep, setCep] = useState('');
  const [saving, setSaving] = useState(false);

  const cepRef = useRef<TextInput>(null);
  const streetRef = useRef<TextInput>(null);
  const houseRef = useRef<TextInput>(null);
  const compRef = useRef<TextInput>(null);
  const neighRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);

  const fetchAddressByCep = async (cepValue: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
        setTimeout(() => houseRef.current?.focus(), 100);
      }
    } catch (e) {}
  };

  const onCepChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, '');
    setCep(onlyNumbers);
    if (onlyNumbers.length === 8) fetchAddressByCep(onlyNumbers);
  };

  const onCepSubmit = () => {
    if (cep.length === 8) houseRef.current?.focus();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Verificar se já existe algum endereço para definir o primeiro como principal
      const { count } = await supabase
        .from('client_addresses')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);
      const isFirst = !count || count === 0;

      const { error } = await supabase
        .from('client_addresses')
        .insert([
          {
            client_id: clientId,
            street: street.trim(),
            house_number: houseNumber.trim() || null,
            complement: complement.trim() || null,
            neighborhood: neighborhood.trim() || null,
            city: city.trim(),
            state: state.trim(),
            cep: cep.trim() || null,
            is_primary: isFirst,
          },
        ]);
      if (error) throw error;
      showSuccess('Endereço salvo');
      setTimeout(() => router.replace(`/(main)/(tabs)/clients/${clientId}?tab=enderecos` as any), 1000);
    } catch (e: any) {
      console.error(e);
      showError(e.message || 'Erro ao salvar endereço');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Novo Endereço" showBackButton onBackPress={() => router.replace(`/(main)/(tabs)/clients/${clientId}?tab=enderecos` as any)} notificationsCount={3} />
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>CEP</Text>
          <TextInput
            ref={cepRef}
            style={styles.input}
            value={cep}
            onChangeText={onCepChange}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={8}
            returnKeyType="next"
            onSubmitEditing={onCepSubmit}
          />

          <Text style={styles.label}>Rua</Text>
          <TextInput ref={streetRef} style={styles.input} value={street} onChangeText={setStreet} returnKeyType="next" onSubmitEditing={() => houseRef.current?.focus()} />

          <View style={styles.row}>
            <View style={[styles.col]}>
              <Text style={styles.label}>Número</Text>
              <TextInput ref={houseRef} style={styles.input} value={houseNumber} onChangeText={setHouseNumber} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => compRef.current?.focus()} />
            </View>
            <View style={[styles.col]}>
              <Text style={styles.label}>Complemento</Text>
              <TextInput ref={compRef} style={styles.input} value={complement} onChangeText={setComplement} returnKeyType="next" onSubmitEditing={() => neighRef.current?.focus()} />
            </View>
          </View>

          <Text style={styles.label}>Bairro</Text>
          <TextInput ref={neighRef} style={styles.input} value={neighborhood} onChangeText={setNeighborhood} returnKeyType="next" onSubmitEditing={() => cityRef.current?.focus()} />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput ref={cityRef} style={styles.input} value={city} onChangeText={setCity} returnKeyType="next" onSubmitEditing={() => stateRef.current?.focus()} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Estado</Text>
              <TextInput ref={stateRef} style={styles.input} value={state} onChangeText={setState} maxLength={2} returnKeyType="done" />
            </View>
          </View>

          <View style={{ height: 20 }} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar Endereço'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  safeArea: { backgroundColor: '#000' },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 14, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary },
  buttonText: { color: '#fff', fontWeight: '700' },
});
