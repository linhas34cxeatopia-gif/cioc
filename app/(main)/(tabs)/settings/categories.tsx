import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Unit = 'KG' | 'UNIDADE' | 'CAIXA' | 'PACOTE';
interface Category { id: string; name: string; measurement_unit: Unit }

export default function CategoriesScreen() {
  const router = useRouter();
  const { toast, hideToast, showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('KG');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('id, name, measurement_unit').order('name');
    setCategories((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) { showError('Informe o nome'); return; }
    try {
      setSaving(true);
      const { error } = await supabase.from('categories').insert([{ name: name.trim(), measurement_unit: unit }]);
      if (error) throw error;
      setName('');
      setUnit('KG');
      await load();
      showSuccess('Categoria criada');
    } catch (e: any) { showError(e.message || 'Erro'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      // checar produtos vinculados
      const { data } = await supabase.from('products').select('id').eq('category_id', id).limit(1);
      if (data && data.length > 0) { showError('Não é possível excluir. Existem produtos vinculados.'); return; }
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await load();
      showSuccess('Categoria excluída');
    } catch (e: any) { showError(e.message || 'Erro'); }
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{item.measurement_unit}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Categorias" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      <View style={styles.content}>
        <Text style={styles.section}>Nova categoria</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={Theme.colors.textSecondary} value={name} onChangeText={setName} />
        <View style={styles.unitRow}>
          {(['KG','UNIDADE','CAIXA','PACOTE'] as Unit[]).map(u => (
            <TouchableOpacity key={u} style={[styles.chip, unit === u && styles.chipActive]} onPress={() => setUnit(u)}>
              <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleAdd} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Adicionar'}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Categorias</Text>
        <FlatList data={categories} keyExtractor={(i) => i.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={{ height: 8 }} />} contentContainerStyle={{ paddingBottom: 40 }} />
      </View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, padding: 16 },
  section: { color: Theme.colors.text, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  unitRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Theme.colors.primary },
  button: { backgroundColor: Theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  name: { color: Theme.colors.text, fontWeight: '700' },
  sub: { color: Theme.colors.textSecondary },
});


