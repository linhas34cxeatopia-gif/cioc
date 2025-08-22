import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Group { id: string; title: string; selection_limit: number; display_order?: number }
interface Option { id: string; name: string; extra_cost?: number; display_order?: number; group_id: string }

export default function BuilderEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const editingId = (id as string) || null;
  const { toast, hideToast, showError, showSuccess } = useToast();

  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [unit, setUnit] = useState<'kg' | 'unidade'>('kg');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [optionsByGroup, setOptionsByGroup] = useState<Record<string, Option[]>>({});

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupEditing, setGroupEditing] = useState<Group | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupLimit, setGroupLimit] = useState('1');

  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionEditing, setOptionEditing] = useState<Option | null>(null);
  const [optName, setOptName] = useState('');
  const [optCost, setOptCost] = useState('0');
  const [optGroupId, setOptGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const { data: p } = await supabase.from('products').select('id, name, base_price, type, image_url').eq('id', editingId).single();
        if (p) {
          setName((p as any).name || '');
          setBasePrice(String((p as any).base_price || ''));
          setUnit(((p as any).type === 'unidade' ? 'unidade' : 'kg'));
          setCurrentImageUrl((p as any).image_url || null);
        }
        const { data: gs } = await supabase.from('builder_component_groups').select('*').eq('product_id', editingId).order('display_order');
        setGroups((gs as any) || []);
        const { data: opts } = await supabase.from('builder_component_options').select('*').in('group_id', ((gs as any) || []).map((g: any) => g.id));
        const map: Record<string, Option[]> = {};
        (opts as any || []).forEach((o: any) => { if (!map[o.group_id]) map[o.group_id] = []; map[o.group_id].push(o); });
        setOptionsByGroup(map);
      } catch {}
    })();
  }, [editingId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permissão para acessar a galeria negada'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setLocalImageUri(res.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (productId: string) => {
    if (!localImageUri) return currentImageUrl || null;
    const fileExtMatch = localImageUri.split('?')[0].split('.');
    const fileExt = fileExtMatch[fileExtMatch.length - 1] || 'jpg';
    const timestamp = Date.now();
    const path = `products/builder_${productId}_${timestamp}.${fileExt}`;
    const resp = await fetch(localImageUri);
    const arrayBuffer = await resp.arrayBuffer();
    const { error } = await supabase.storage.from('products').upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) { showError(`Erro ao enviar imagem: ${error.message}`); throw error; }
    const { data } = supabase.storage.from('products').getPublicUrl(path);
    return data.publicUrl || null;
  };

  const saveTemplate = async () => {
    try {
      if (!name.trim()) { showError('Informe o nome'); return; }
      const payload: any = {
        name: name.trim(),
        base_price: Number(basePrice.replace(',', '.')) || 0,
        type: unit,
        product_type: 'BUILDER',
        // satisfaz constraint NOT NULL da coluna category
        category: unit === 'kg' ? 'bolo' : 'outro',
      };
      if (editingId) {
        // upload da imagem se necessário
        const image_url = await uploadImageToStorage(editingId);
        const { error } = await supabase.from('products').update({ ...payload, image_url }).eq('id', editingId);
        if (error) throw error;
      } else {
        // cria primeiro para obter o id
        const { data, error } = await supabase.from('products').insert([payload]).select('id').single();
        if (error) throw error;
        const newId = (data as any).id as string;
        if (localImageUri) {
          const image_url = await uploadImageToStorage(newId);
          await supabase.from('products').update({ image_url }).eq('id', newId);
          setCurrentImageUrl(image_url);
        }
      }
      showSuccess('Template salvo');
      if (!editingId) router.replace('/(main)/(tabs)/settings/builder-templates' as any);
    } catch (e: any) { showError(e.message || 'Erro ao salvar'); }
  };

  const openCreateGroup = () => {
    setGroupEditing(null);
    setGroupTitle('');
    setGroupLimit('1');
    setGroupModalOpen(true);
  };

  const editGroup = (g: Group) => {
    setGroupEditing(g);
    setGroupTitle(g.title);
    setGroupLimit(String(g.selection_limit));
    setGroupModalOpen(true);
  };

  const saveGroup = async () => {
    try {
      if (!editingId) { showError('Salve o template primeiro'); return; }
      const payload = { product_id: editingId as string, title: groupTitle.trim(), selection_limit: Number(groupLimit) || 1 };
      if (groupEditing) {
        const { error } = await supabase.from('builder_component_groups').update(payload).eq('id', groupEditing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('builder_component_groups').insert([payload]);
        if (error) throw error;
      }
      setGroupModalOpen(false);
      const { data: gs } = await supabase.from('builder_component_groups').select('*').eq('product_id', editingId);
      setGroups((gs as any) || []);
    } catch (e: any) { showError(e.message || 'Erro ao salvar grupo'); }
  };

  const deleteGroup = (g: Group) => {
    Alert.alert('Excluir grupo', `Excluir "${g.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('builder_component_groups').delete().eq('id', g.id);
          const { data: gs } = await supabase.from('builder_component_groups').select('*').eq('product_id', editingId);
          setGroups((gs as any) || []);
        } catch (e: any) { showError(e.message || 'Erro ao excluir grupo'); }
      }}
    ]);
  };

  const openCreateOption = (groupId: string) => {
    setOptionEditing(null);
    setOptGroupId(groupId);
    setOptName('');
    setOptCost('0');
    setOptionModalOpen(true);
  };

  const editOption = (g: Group, o: Option) => {
    setOptionEditing(o);
    setOptGroupId(g.id);
    setOptName(o.name);
    setOptCost(String(o.extra_cost || '0'));
    setOptionModalOpen(true);
  };

  const saveOption = async () => {
    try {
      if (!optGroupId) return;
      const payload = { group_id: optGroupId, name: optName.trim(), extra_cost: Number(optCost.replace(',', '.')) || 0 } as any;
      if (optionEditing) {
        const { error } = await supabase.from('builder_component_options').update(payload).eq('id', optionEditing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('builder_component_options').insert([payload]);
        if (error) throw error;
      }
      setOptionModalOpen(false);
      const { data: opts } = await supabase.from('builder_component_options').select('*').eq('group_id', optGroupId);
      setOptionsByGroup(prev => ({ ...prev, [optGroupId]: (opts as any) || [] }));
    } catch (e: any) { showError(e.message || 'Erro ao salvar opção'); }
  };

  const deleteOption = (g: Group, o: Option) => {
    Alert.alert('Excluir opção', `Excluir "${o.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('builder_component_options').delete().eq('id', o.id);
          const { data: opts } = await supabase.from('builder_component_options').select('*').eq('group_id', g.id);
          setOptionsByGroup(prev => ({ ...prev, [g.id]: (opts as any) || [] }));
        } catch (e: any) { showError(e.message || 'Erro ao excluir opção'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={editingId ? 'Editar Template' : 'Novo Template'} showBackButton onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Text style={styles.label}>Nome do Template</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Preço Base</Text>
        <TextInput style={styles.input} value={basePrice} onChangeText={setBasePrice} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />
        <Text style={styles.label}>Unidade de Preço</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['kg', 'unidade'] as const).map(v => (
            <TouchableOpacity key={v} style={[styles.chip, unit === v && styles.chipActive]} onPress={() => setUnit(v)}>
              <Text style={[styles.chipText, unit === v && styles.chipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Imagem do template */}
        <Text style={styles.label}>Imagem</Text>
        {localImageUri || currentImageUrl ? (
          <TouchableOpacity activeOpacity={0.85} onPress={pickImage} style={styles.imageWrapper}>
            <Image source={{ uri: localImageUri || `${currentImageUrl}?id=${editingId || 'new'}` }} style={styles.imagePreview} />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.imageOverlayText}>Trocar imagem</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage}>
            <Text style={styles.secondaryText}>Selecionar Imagem</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Grupos de Componentes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreateGroup}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Adicionar Novo Grupo</Text>
        </TouchableOpacity>

        {groups.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>{g.title} (até {g.selection_limit})</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => editGroup(g)}><Ionicons name="pencil" size={16} color={Theme.colors.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => deleteGroup(g)}><Ionicons name="trash" size={16} color="#d32f2f" /></TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              {(optionsByGroup[g.id] || []).map((o) => (
                <View key={o.id} style={styles.optionRow}>
                  <Text style={styles.optionText}>{o.name}</Text>
                  <Text style={styles.optionPrice}>{o.extra_cost ? `+ R$ ${Number(o.extra_cost).toFixed(2)}` : ''}</Text>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => editOption(g, o)}><Ionicons name="pencil" size={16} color={Theme.colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => deleteOption(g, o)}><Ionicons name="trash" size={16} color="#d32f2f" /></TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={[styles.smallAddBtn]} onPress={() => openCreateOption(g.id)}>
                <Ionicons name="add" size={16} color={Theme.colors.primary} />
                <Text style={styles.smallAddText}>Adicionar Opção</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.button, styles.primaryButton, { marginTop: 16 }]} onPress={saveTemplate}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Grupo */}
      {groupModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{groupEditing ? 'Editar Grupo' : 'Novo Grupo'}</Text>
            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} value={groupTitle} onChangeText={setGroupTitle} />
            <Text style={styles.label}>Limite de Seleção</Text>
            <TextInput style={styles.input} value={groupLimit} onChangeText={setGroupLimit} keyboardType="number-pad" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.secondaryButton, { flex: 1 }]} onPress={() => setGroupModalOpen(false)}><Text style={styles.secondaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} onPress={saveGroup}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal Opção */}
      {optionModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{optionEditing ? 'Editar Opção' : 'Nova Opção'}</Text>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={optName} onChangeText={setOptName} />
            <Text style={styles.label}>Custo Extra</Text>
            <TextInput style={styles.input} value={optCost} onChangeText={setOptCost} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.secondaryButton, { flex: 1 }]} onPress={() => setOptionModalOpen(false)}><Text style={styles.secondaryText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} onPress={saveOption}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  sectionTitle: { color: Theme.colors.text, fontWeight: '800' },
  label: { color: Theme.colors.text, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Theme.colors.primary },
  addBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: { marginTop: 10, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  cardTitle: { color: Theme.colors.text, fontWeight: '700' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  optionText: { color: Theme.colors.text, flex: 1 },
  optionPrice: { color: Theme.colors.textSecondary },
  smallAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.primary, backgroundColor: '#fff' },
  smallAddText: { color: Theme.colors.primary, fontWeight: '700' },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: Theme.colors.primary, backgroundColor: 'transparent' },
  secondaryText: { color: Theme.colors.primary, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  imageWrapper: { position: 'relative', marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180 },
  imageOverlay: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  imageOverlayText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '80%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 24 },
  modalTitle: { color: Theme.colors.text, fontWeight: '800', marginBottom: 8 },
});
