import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Toggle } from '@/components/ui/Toggle';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product { 
  id: string; 
  code?: string; 
  name: string; 
  category: 'bolo' | 'outro' | string; 
  type?: string; 
  base_price: number; 
  image_url?: string; 
  attributes?: any; 
  category_id?: string | null;
  product_type: 'SIMPLES' | 'COMBO';
  combo_capacity?: number;
  visible_in_budget?: boolean;
}
interface Category { id: string; name: string; measurement_unit: 'KG' | 'UNIDADE' | 'CAIXA' | 'PACOTE' }

export default function ProductEditScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showSuccess, showError, toast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [massa, setMassa] = useState('');
  const [recheio, setRecheio] = useState('');
  const [cobertura, setCobertura] = useState('');
  const [casca, setCasca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [code, setCode] = useState('');
  const [showCatList, setShowCatList] = useState(false);
  const [visibleInBudget, setVisibleInBudget] = useState(true);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productType, setProductType] = useState<'SIMPLES' | 'COMBO'>('SIMPLES');
  const [comboCapacity, setComboCapacity] = useState('');

  // Carregar produto
  useEffect(() => { load(); }, [id]);

  // Carregar categorias
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('id, name, measurement_unit').order('name');
      setCategories((data as any) || []);
    })();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      const p = data as Product;
      setCode(p.code || '');
      setSelectedCategoryId(p.category_id || null);
      setName(p.name || '');
      setCurrentImageUrl(p.image_url || null);
      setPreco(String(p.base_price || ''));
      const a = p.attributes || {};
      setMassa(a.massa || '');
      setRecheio(a.recheio || '');
      setCobertura(a.cobertura || '');
      setCasca(a.casca || '');
      setDescricao(a.descricao || '');
      setVisibleInBudget(p.visible_in_budget ?? true);

      // Se for combo, carregar capacidade e itens selecionados
      setProductType(p.product_type);
      if (p.product_type === 'COMBO') {
        setComboCapacity(String(p.combo_capacity || ''));
        try {
          const { data: allowed } = await supabase
            .from('combo_allowed_products')
            .select('allowed_product_id')
            .eq('combo_product_id', p.id);
          setSelectedProducts((allowed || []).map((r: any) => r.allowed_product_id));
          const { data: simples } = await supabase
            .from('products')
            .select('id, name')
            .eq('product_type', 'SIMPLES')
            .order('name');
          setAvailableProducts((simples as any) || []);
        } catch {}
      } else {
        setAvailableProducts([]);
        setSelectedProducts([]);
      }
    } catch (e: any) {
      showError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permissão para acessar a galeria negada'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setLocalImageUri(res.assets[0].uri);
    }
  };

  const uploadImageToStorage = async () => {
    if (!localImageUri || !code) return currentImageUrl || '';
    const fileExtMatch = localImageUri.split('?')[0].split('.');
    const fileExt = fileExtMatch[fileExtMatch.length - 1] || 'jpg';
    const timestamp = Date.now();
    const path = `products/${code}_${timestamp}.${fileExt}`;
    const resp = await fetch(localImageUri);
    const arrayBuffer = await resp.arrayBuffer();
    const { error } = await supabase.storage.from('products').upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) { showError(`Erro ao enviar imagem: ${error.message}`); throw error; }
    const { data } = supabase.storage.from('products').getPublicUrl(path);
    return data.publicUrl || '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!selectedCategoryId) { showError('Selecione uma categoria'); setSaving(false); return; }
      const image_url = await uploadImageToStorage();
      const selectedCategory = categories.find(c => c.id === selectedCategoryId)!;
      const payload: any = {
        name: name.trim(),
        category: selectedCategory.measurement_unit === 'KG' ? 'bolo' : 'outro',
        type: selectedCategory.measurement_unit === 'KG' ? 'kg' : selectedCategory.measurement_unit === 'UNIDADE' ? 'unidade' : selectedCategory.measurement_unit === 'CAIXA' ? 'caixa' : 'unidade',
        base_price: Number(preco.replace(',', '.')) || 0,
        image_url: image_url || null,
        attributes: selectedCategory.measurement_unit === 'KG' ? { massa, recheio, cobertura, casca, descricao } : { descricao },
        category_id: selectedCategoryId,
        visible_in_budget: visibleInBudget,
      };
      if (productType === 'COMBO') {
        payload.combo_capacity = Number(comboCapacity) || null;
      }

      let { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error && String(error.message || '').includes('visible_in_budget')) {
        // Tenta novamente sem o campo caso a coluna ainda não exista no schema cache
        const { visible_in_budget, ...fallbackPayload } = payload;
        const retry = await supabase.from('products').update(fallbackPayload).eq('id', id);
        error = retry.error || null as any;
      }
      if (error) throw error;

      // Atualizar itens permitidos do combo, se for combo
      if (productType === 'COMBO' && selectedProducts.length >= 0) {
        try {
          // Limpa e recria relações
          await supabase.from('combo_allowed_products').delete().eq('combo_product_id', id as string);
          if (selectedProducts.length > 0) {
            const rows = selectedProducts.map(pid => ({ combo_product_id: id, allowed_product_id: pid }));
            await supabase.from('combo_allowed_products').insert(rows);
          }
        } catch {}
      }
      showSuccess('Produto atualizado com sucesso!');
      setTimeout(() => router.replace('/(main)/(tabs)/products' as any), 800);
    } catch (e: any) {
      showError(e.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Confirmar exclusão', 'Tem certeza que deseja deletar este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            showSuccess('Produto deletado com sucesso!');
            setTimeout(() => router.replace('/(main)/(tabs)/products' as any), 600);
          } catch (e: any) { showError(e.message || 'Erro ao deletar'); }
        } }
    ]);
  };

  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId) || null, [categories, selectedCategoryId]);
  const isBolo = selectedCategory?.measurement_unit === 'KG';
  const hasImage = Boolean(localImageUri || currentImageUrl);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Editar Produto" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
        <View style={styles.center}><Text style={{ color: Theme.colors.text }}>Carregando...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Editar Produto" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      </SafeAreaView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Imagem clicável para trocar */}
          {hasImage ? (
            <TouchableOpacity activeOpacity={0.85} onPress={pickImage} style={styles.imageWrapper}>
              <Image source={{ uri: localImageUri || `${currentImageUrl}?id=${id}` }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.imageOverlayText}>Trocar imagem</Text>
              </View>
            </TouchableOpacity>
          ) : (
            // Botão de selecionar (igual ao do novo produto)
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage}>
              <Text style={styles.secondaryText}>Selecionar Imagem</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowCatList(v => !v)}>
            <Text style={{ color: Theme.colors.text }}>{selectedCategory ? selectedCategory.name : 'Selecione uma categoria'}</Text>
          </TouchableOpacity>
          {showCatList ? (
            <View style={{ marginTop: 6 }}>
              {categories.map(c => (
                <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => { setSelectedCategoryId(c.id); setShowCatList(false); }}>
                  <Text style={{ color: Theme.colors.text }}>{c.name} • {c.measurement_unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Visível no orçamento</Text>
          <Toggle
            label="Exibir este produto na tela de novo orçamento"
            value={visibleInBudget}
            onValueChange={setVisibleInBudget}
          />

          {/* Editor de itens permitidos do combo */}
          {selectedCategory?.measurement_unit !== 'KG' && (
            <></>
          )}

          {productType === 'COMBO' ? (
            <>
              <Text style={styles.label}>Capacidade do Combo</Text>
              <TextInput
                style={styles.input}
                value={comboCapacity}
                onChangeText={setComboCapacity}
                keyboardType="number-pad"
                placeholder="Ex: 9"
                placeholderTextColor={Theme.colors.textSecondary}
              />

              {availableProducts.length > 0 ? (
                <>
                  <Text style={styles.label}>Itens permitidos do combo</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setProductModalOpen(true)}>
                    <Text style={{ color: Theme.colors.text }}>
                      {selectedProducts.length > 0 ? `${selectedProducts.length} selecionado(s)` : 'Selecionar itens'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          ) : null}

          {isBolo ? (
            <>
              <Text style={styles.label}>Massa</Text>
              <TextInput style={styles.input} value={massa} onChangeText={setMassa} />
              <Text style={styles.label}>Recheio</Text>
              <TextInput style={styles.input} value={recheio} onChangeText={setRecheio} />
              <Text style={styles.label}>Cobertura</Text>
              <TextInput style={styles.input} value={cobertura} onChangeText={setCobertura} />
              <Text style={styles.label}>Casca Lateral</Text>
              <TextInput style={styles.input} value={casca} onChangeText={setCasca} />
            </>
          ) : null}

          <Text style={styles.label}>Descrição</Text>
          <TextInput style={[styles.input, styles.textArea]} value={descricao} onChangeText={setDescricao} multiline textAlignVertical="top" />

          <Text style={styles.label}>{isBolo ? 'Valor do Kg' : 'Valor'}</Text>
          <TextInput style={styles.input} value={preco} onChangeText={setPreco} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />

          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}><Text style={styles.deleteText}>Deletar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar Edição'}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Modal de seleção de itens para combo */}
      {productModalOpen ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '80%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="search" size={18} color={Theme.colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder="Buscar produtos"
                placeholderTextColor={Theme.colors.textSecondary}
                style={{ flex: 1, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Theme.colors.text }}
              />
              <TouchableOpacity onPress={() => setProductModalOpen(false)} style={{ marginLeft: 10, padding: 8 }}>
                <Ionicons name="close" size={22} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
              {(availableProducts || [])
                .filter(p => p.name.toLowerCase().includes(productSearch.trim().toLowerCase()))
                .map(p => (
                  <TouchableOpacity key={p.id} style={[styles.dropdownItem, selectedProducts.includes(p.id) && { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' }]} onPress={() => setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                    <Text style={{ color: Theme.colors.text }}>{p.name}</Text>
                    {selectedProducts.includes(p.id) && <Ionicons name="checkmark" size={16} color={Theme.colors.primary} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity style={[styles.button, styles.secondaryButton, { flex: 1 }]} onPress={() => setProductModalOpen(false)}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} onPress={() => setProductModalOpen(false)}>
                <Text style={styles.buttonText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  safeArea: { backgroundColor: '#000' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrapper: { position: 'relative', marginBottom: 10, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180 },
  imageOverlay: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  imageOverlayText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff' },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Theme.colors.primary },
  dropdown: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 14, backgroundColor: '#fff' },
  dropdownItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', marginTop: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 14, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  textArea: { minHeight: 100 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary, flex: 1 },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: 'transparent' },
  secondaryText: { color: Theme.colors.text, fontWeight: '700' },
  deleteButton: { borderWidth: 1, borderColor: '#e53935', backgroundColor: 'transparent', flex: 1, marginRight: 10 },
  deleteText: { color: '#e53935', fontWeight: '700' },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 30 },
});
