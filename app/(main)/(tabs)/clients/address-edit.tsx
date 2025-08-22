import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressEditScreen() {
  const { id, addressId } = useLocalSearchParams();
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

  useEffect(() => { load(); }, [addressId]);

  const load = async () => {
    const { data, error } = await supabase.from('client_addresses').select('*').eq('id', addressId).single();
    if (error) return;
    setStreet(data.street || '');
    setHouseNumber(data.house_number || '');
    setComplement(data.complement || '');
    setNeighborhood(data.neighborhood || '');
    setCity(data.city || '');
    setState(data.state || '');
    setCep(data.cep || '');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('client_addresses').update({ street: street.trim(), house_number: houseNumber.trim() || null, complement: complement.trim() || null, neighborhood: neighborhood.trim() || null, city: city.trim(), state: state.trim(), cep: cep.trim() || null }).eq('id', addressId);
      if (error) throw error;
      showSuccess('Endereço atualizado');
      setTimeout(() => router.back(), 1200);
    } catch (e: any) {
      showError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Editar Endereço" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      </SafeAreaView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content}>
          <Text style={styles.label}>Rua</Text>
          <TextInput style={styles.input} value={street} onChangeText={setStreet} />

          <View style={styles.row}>
            <View style={styles.col}><Text style={styles.label}>Número</Text><TextInput style={styles.input} value={houseNumber} onChangeText={setHouseNumber} /></View>
            <View style={styles.col}><Text style={styles.label}>Complemento</Text><TextInput style={styles.input} value={complement} onChangeText={setComplement} /></View>
          </View>

          <Text style={styles.label}>Bairro</Text>
          <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood} />

          <View style={styles.row}>
            <View style={styles.col}><Text style={styles.label}>Cidade</Text><TextInput style={styles.input} value={city} onChangeText={setCity} /></View>
            <View style={styles.col}><Text style={styles.label}>Estado</Text><TextInput style={styles.input} value={state} onChangeText={setState} maxLength={2} /></View>
          </View>

          <Text style={styles.label}>CEP</Text>
          <TextInput style={styles.input} value={cep} onChangeText={setCep} />

          <View style={{ height: 20 }} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar Edição'}</Text>
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
