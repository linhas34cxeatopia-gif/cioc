import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Toggle } from '@/components/ui/Toggle';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Category { id: string; name: string; measurement_unit: 'KG' | 'UNIDADE' | 'CAIXA' | 'PACOTE' }
interface Product { id: string; name: string; product_type: 'SIMPLES' | 'COMBO' }

export default function NewProductScreen() {
  const router = useRouter();
  const { showSuccess, showError, toast, hideToast } = useToast();

  const [name, setName] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [massa, setMassa] = useState('');
  const [recheio, setRecheio] = useState('');
  const [cobertura, setCobertura] = useState('');
  const [casca, setCasca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCatList, setShowCatList] = useState(false);
  const [productType, setProductType] = useState<'SIMPLES' | 'COMBO'>('SIMPLES');
  const [comboCapacity, setComboCapacity] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [visibleInBudget, setVisibleInBudget] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('id, name, measurement_unit').order('name');
      setCategories((data as any) || []);
    })();
  }, []);

  // Carregar produtos simples para combos
  useEffect(() => {
    if (productType === 'COMBO') {
      (async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, product_type')
          .eq('product_type', 'SIMPLES')
          .order('name');
        if (!error) setAvailableProducts((data as any) || []);
        else setAvailableProducts([]);
      })();
    }
  }, [productType]);

  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId) || null, [categories, selectedCategoryId]);
  const isBolo = selectedCategory?.measurement_unit === 'KG';
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return availableProducts;
    return availableProducts.filter(p => p.name.toLowerCase().includes(term));
  }, [availableProducts, productSearch]);

  const generateNextCode = async () => {
    const prefix = isBolo ? 'B' : 'O';
    const { data } = await supabase.from('products').select('code').ilike('code', `${prefix}%`);
    const nums = (data || []).map((r: any) => Number(String(r.code || '').replace(/\D/g, ''))).filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${next}`;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permissão para acessar a galeria negada'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setLocalImageUri(res.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (code: string) => {
    if (!localImageUri) return '';
    const fileExtMatch = localImageUri.split('?')[0].split('.');
    const fileExt = fileExtMatch[fileExtMatch.length - 1] || 'jpg';
    const timestamp = Date.now();
    const path = `products/${code}_${timestamp}.${fileExt}`;
    const resp = await fetch(localImageUri);
    const arrayBuffer = await resp.arrayBuffer();
    const { error } = await supabase.storage.from('products').upload(path, arrayBuffer, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
    if (error) {
      showError(`Erro ao enviar imagem: ${error.message}`);
      throw error;
    }
    const { data } = supabase.storage.from('products').getPublicUrl(path);
    return data.publicUrl || '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!selectedCategory) { showError('Selecione uma categoria'); setSaving(false); return; }
      if (productType === 'COMBO' && (!comboCapacity || selectedProducts.length === 0)) {
        showError('Para combos, informe a capacidade e selecione os produtos permitidos');
        setSaving(false);
        return;
      }
      
      const code = await generateNextCode();
      const base_price = Number(preco.replace(',', '.')) || 0;
      const image_url = await uploadImageToStorage(code);
       const typeFromCategory = selectedCategory.measurement_unit === 'KG' ? 'kg' : selectedCategory.measurement_unit === 'UNIDADE' ? 'unidade' : selectedCategory.measurement_unit === 'CAIXA' ? 'caixa' : 'unidade';
      
             const payload: any = {
         code,
         name: name.trim(),
         category: isBolo ? 'bolo' : 'outro',
         type: typeFromCategory,
         base_price,
         image_url: image_url || null,
         category_id: selectedCategoryId,
       };
      
      // Campos de combo conforme schema
      payload.product_type = productType;
      if (productType === 'COMBO') {
        payload.combo_capacity = Number(comboCapacity);
      }
        payload.visible_in_budget = visibleInBudget;
      
      if (isBolo) payload.attributes = { massa, recheio, cobertura, casca, descricao }; 
      else payload.attributes = { descricao };
      
      const { data: newProduct, error } = await supabase.from('products').insert([payload]).select('id').single();
      if (error) throw error;
      
             // Se for combo, criar as ligações com produtos permitidos
       if (productType === 'COMBO' && newProduct) {
         try {
           const comboLinks = selectedProducts.map(productId => ({
             combo_product_id: newProduct.id,
             allowed_product_id: productId
           }));
           
           const { error: linksError } = await supabase.from('combo_allowed_products').insert(comboLinks);
           if (linksError) {
             console.log('Erro ao criar ligações de combo:', linksError);
             // Não falha o salvamento se a tabela não existir
           }
         } catch (error) {
           console.log('Tabela combo_allowed_products não disponível:', error);
         }
       }
      
      showSuccess('Produto cadastrado com sucesso!');
      setName(''); 
      setLocalImageUri(null); 
      setMassa(''); 
      setRecheio(''); 
      setCobertura(''); 
      setCasca(''); 
      setDescricao(''); 
      setPreco('');
      setProductType('SIMPLES');
      setComboCapacity('');
      setSelectedProducts([]);
      setVisibleInBudget(true);
    } catch (e: any) {
      console.error(e);
      if (!e?.message?.includes('imagem')) showError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Novo Produto" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      </SafeAreaView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
                     <Text style={styles.label}>Tipo de Produto</Text>
           <View style={styles.typeRow}>
             <TouchableOpacity 
               style={[styles.typeChip, productType === 'SIMPLES' && styles.typeChipActive]} 
               onPress={() => setProductType('SIMPLES')}
             >
               <Text style={[styles.typeChipText, productType === 'SIMPLES' && styles.typeChipTextActive]}>Produto Simples</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.typeChip, productType === 'COMBO' && styles.typeChipActive]} 
               onPress={() => setProductType('COMBO')}
             >
               <Text style={[styles.typeChipText, productType === 'COMBO' && styles.typeChipTextActive]}>Combo</Text>
             </TouchableOpacity>
           </View>

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

          <Text style={styles.label}>Imagem</Text>
          {localImageUri ? <Image source={{ uri: localImageUri }} style={styles.imagePreview} /> : null}
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={pickImage}><Text style={styles.secondaryText}>{localImageUri ? 'Trocar Imagem' : 'Selecionar Imagem'}</Text></TouchableOpacity>

          <Text style={styles.label}>{isBolo ? 'Nome do Bolo' : 'Nome'}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Visível no orçamento</Text>
          <Toggle
            label="Exibir este produto na tela de novo orçamento"
            value={visibleInBudget}
            onValueChange={setVisibleInBudget}
          />

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

                     {productType === 'COMBO' && (
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
               
               <Text style={styles.label}>Produtos Permitidos</Text>
               <TouchableOpacity style={styles.dropdown} onPress={() => { setShowProductSelector(false); setShowProductModal(true); }}>
                 <Text style={{ color: Theme.colors.text }}>
                   {selectedProducts.length > 0 
                     ? `${selectedProducts.length} produto(s) selecionado(s)` 
                     : 'Selecione os produtos que podem compor este combo'}
                 </Text>
               </TouchableOpacity>
               
             </>
           )}

           <Text style={styles.label}>{isBolo ? 'Valor do Kg' : 'Valor'}</Text>
           <TextInput style={styles.input} value={preco} onChangeText={setPreco} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />

          <View style={{ height: 20 }} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave} disabled={saving}><Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar Produto'}</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={showProductModal} transparent animationType="slide" onRequestClose={() => setShowProductModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                <TouchableOpacity onPress={() => setShowProductModal(false)} style={{ marginLeft: 10, padding: 8 }}>
                  <Ionicons name="close" size={22} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" style={{}}
                contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredProducts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.dropdownItem, selectedProducts.includes(p.id) && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                    }}
                  >
                    <Text style={{ color: Theme.colors.text }}>{p.name}</Text>
                    {selectedProducts.includes(p.id) && (
                      <Ionicons name="checkmark" size={16} color={Theme.colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
                {filteredProducts.length === 0 && (
                  <Text style={{ color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 12 }}>Nenhum produto encontrado</Text>
                )}
              </ScrollView>
              <TouchableOpacity onPress={() => setShowProductModal(false)} style={[styles.button, styles.primaryButton, { marginTop: 8 }]}>
                <Text style={styles.buttonText}>Concluir seleção</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  safeArea: { backgroundColor: '#000' },
  content: { flex: 1 },
  section: { fontWeight: '700', color: Theme.colors.text, marginBottom: 8, marginTop: 12 },
  
  label: { fontSize: 14, fontWeight: '600', color: Theme.colors.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 14, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  textArea: { minHeight: 100 },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: Theme.colors.primary, backgroundColor: 'transparent', marginBottom: 6 },
  secondaryText: { color: Theme.colors.primary, fontWeight: '700' },
     typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
   typeChip: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', alignItems: 'center' },
   typeChipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
   typeChipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
   typeChipTextActive: { color: Theme.colors.primary, fontWeight: '700' },
   dropdown: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 14, backgroundColor: '#fff' },
   dropdownItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', marginTop: 6, flexDirection: 'row', alignItems: 'center' },
   dropdownItemActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
});
