import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Client { id: string; name: string; whatsapp?: string | null }
interface Address { id: string; street: string; house_number?: string | null; complement?: string | null; city?: string | null; state?: string | null }
interface Category { id: string; name: string; measurement_unit: 'KG' | 'UNIDADE' | 'CAIXA' | 'PACOTE' }
interface Product { 
  id: string; 
  name: string; 
  image_url?: string | null; 
  attributes?: any; 
  base_price: number; 
  type: 'kg' | 'unidade' | 'caixa'; 
  category_id?: string | null;
  product_type: 'SIMPLES' | 'COMBO' | 'BUILDER';
  combo_capacity?: number;
}
interface BudgetItemDraft { product: Product; quantity: number; unitPrice: number; totalPrice: number; attributes?: any }

export default function BudgetNewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast, hideToast, showError } = useToast();

  const [clientQuery, setClientQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState('1'); // kg, unidade ou caixas
  const [itemWeight, setItemWeight] = useState('1'); // para kg com opções rápidas
  const [itemFlavorsText, setItemFlavorsText] = useState('');
  
  // Estados para combo
  const [comboModalVisible, setComboModalVisible] = useState(false);
  const [comboBoxes, setComboBoxes] = useState('1');
  const [comboSelections, setComboSelections] = useState<Record<string, number>>({});
  const [availableComboProducts, setAvailableComboProducts] = useState<Product[]>([]);

  const [items, setItems] = useState<BudgetItemDraft[]>([]);

  // Builder states
  const [builderModalVisible, setBuilderModalVisible] = useState(false);
  const [builderGroups, setBuilderGroups] = useState<Array<{ id: string; title: string; selection_limit: number }>>([]);
  const [builderOptions, setBuilderOptions] = useState<Record<string, Array<{ id: string; name: string; extra_cost?: number }>>>({});
  const [builderSelections, setBuilderSelections] = useState<Record<string, string[]>>({});
  const [builderProducts, setBuilderProducts] = useState<Product[]>([]);

  const [deliveryFee, setDeliveryFee] = useState('0');
  const subtotal = useMemo(() => items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0), [items]);
  const total = useMemo(() => subtotal + (Number(deliveryFee.replace(',', '.')) || 0), [subtotal, deliveryFee]);

  const openAddItem = (p: Product) => {
    setSelectedProduct(p);
    setItemQuantity('1');
    setItemWeight('1');
    
    if (p.product_type === 'COMBO') {
      // Carregar produtos permitidos para este combo
      (async () => {
        try {
          const { data } = await supabase
            .from('combo_allowed_products')
            .select(`
              allowed_product_id,
              products!combo_allowed_products_allowed_product_id_fkey (
                id, name, base_price
              )
            `)
            .eq('combo_product_id', p.id);
          
          if (data) {
            const products = data.map(item => item.products).filter(Boolean);
            setAvailableComboProducts(products as any);
          }
        } catch (error) {
          console.log('Erro ao carregar produtos do combo:', error);
          setAvailableComboProducts([]);
        }
      })();
      
      setComboModalVisible(true);
    } else {
      if (p.product_type === 'BUILDER') {
        // carregar grupos e opções
        (async () => {
          try {
            const { data: gs } = await supabase
              .from('builder_component_groups')
              .select('id, title, selection_limit')
              .eq('product_id', p.id)
              .order('display_order');
            const groups = (gs as any) || [];
            setBuilderGroups(groups);
            const groupIds = groups.map((g: any) => g.id);
            if (groupIds.length > 0) {
              const { data: os } = await supabase
                .from('builder_component_options')
                .select('id, name, extra_cost, group_id')
                .in('group_id', groupIds)
                .order('display_order');
              const map: Record<string, any[]> = {};
              (os as any || []).forEach((o: any) => {
                if (!map[o.group_id]) map[o.group_id] = [];
                map[o.group_id].push(o);
              });
              setBuilderOptions(map);
              // inicializa seleções vazias
              const sel: Record<string, string[]> = {};
              groupIds.forEach((id: string) => sel[id] = []);
              setBuilderSelections(sel);
            } else {
              setBuilderOptions({});
              setBuilderSelections({});
            }
            setBuilderModalVisible(true);
          } catch (e) {
            setBuilderGroups([]);
            setBuilderOptions({});
            setBuilderSelections({});
            setBuilderModalVisible(true);
          }
        })();
      } else {
        setItemModalVisible(true);
      }
    }
  };

  // carregar cliente vindo por parâmetro
  useEffect(() => {
    const cid = (params as any)?.clientId as string | undefined;
    if (cid) {
      (async () => {
        const { data } = await supabase.from('clients').select('id, name, whatsapp').eq('id', cid).single();
        if (data) setSelectedClient({ id: data.id, name: data.name, whatsapp: data.whatsapp });
      })();
    }
  }, [params]);

  // buscar endereços do cliente
  useEffect(() => {
    (async () => {
      if (!selectedClient) { setAddresses([]); setSelectedAddressId(null); return; }
      const { data } = await supabase.from('client_addresses').select('*').eq('client_id', selectedClient.id).order('is_primary', { ascending: false });
      setAddresses((data as any) || []);
      const primary = (data || []).find((a: any) => a.is_primary);
      setSelectedAddressId(primary?.id || (data && data[0]?.id) || null);
    })();
  }, [selectedClient]);

  // carregar categorias e produtos no foco da tela
  const loadCatalog = useCallback(async () => {
    try {
      const { data: cats } = await supabase.from('categories').select('id, name, measurement_unit').order('name');
      setCategories((cats as any) || []);

      let prodsRes: any = await supabase
        .from('products')
        .select('id, name, image_url, attributes, base_price, type, category_id, product_type, combo_capacity, visible_in_budget')
        .eq('visible_in_budget', true)
        .order('name');

      if (prodsRes.error) {
        prodsRes = await (supabase as any)
          .from('products')
          .select('id, name, image_url, attributes, base_price, type, category_id, product_type, combo_capacity')
          .order('name');
      }

      const pList = ((prodsRes.data as any) || []) as Product[];
      // separa builders para seção própria
      const builders = pList.filter(p => p.product_type === 'BUILDER');
      setBuilderProducts(builders);
      const regular = pList.filter(p => p.product_type !== 'BUILDER');

      const map: Record<string, Product[]> = {};
      regular.forEach((p: Product) => {
        const key = p.category_id || 'uncategorized';
        if (!map[key]) map[key] = [];
        map[key].push(p);
      });
      setProductsByCategory(map);
    } catch {
      setProductsByCategory({});
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog])
  );

  const searchClients = useCallback(async (q: string) => {
    setClientLoading(true);
    try {
      const { data } = await supabase
        .from('clients')
        .select('id, name, whatsapp')
        .or(`name.ilike.%${q}%,whatsapp.ilike.%${q}%`)
        .order('name');
      setClients((data as any) || []);
    } finally { setClientLoading(false); }
  }, []);

  useEffect(() => {
    const q = clientQuery.trim();
    if (q.length === 0) { setClients([]); return; }
    searchClients(q);
  }, [clientQuery]);

  const AddressDisplay = ({ a }: { a: any }) => (
    <Text style={styles.addrText}>{`${a.street || ''}, ${a.house_number || ''} ${a.complement ? ' - ' + a.complement : ''} - ${a.city || ''}/${a.state || ''}`}</Text>
  );

  const addItemToBudget = () => {
    if (!selectedProduct) return;
    const unit = Number(selectedProduct.base_price) || 0;
    let qty = 1;
    let total = unit;
    let attrs: any = {};
    if (selectedProduct.type === 'kg') {
      qty = Number(itemWeight.replace(',', '.')) || 1;
      total = unit * qty;
      attrs.weight = qty;
      attrs.measure = 'kg';
    } else if (selectedProduct.type === 'unidade') {
      qty = Number(itemQuantity) || 1;
      total = unit * qty;
      attrs.measure = 'unidade';
    } else {
      qty = Number(itemQuantity) || 1; // caixa
      total = unit * qty;
      attrs.measure = 'caixa';
      const size = Number(selectedProduct.attributes?.box_size) || 0;
      const flavors = itemFlavorsText.split(',').map(s => s.trim()).filter(Boolean);
      if (size > 0 && flavors.length > size * qty) {
        showError(`Máximo de ${size * qty} itens/sabores para ${qty} caixa(s).`);
        return;
      }
      if (flavors.length > 0) attrs.flavors = flavors;
    }
    setItems(prev => [...prev, { product: selectedProduct, quantity: qty, unitPrice: unit, totalPrice: total, attributes: attrs }]);
    setItemModalVisible(false);
  };

  const addComboToBudget = () => {
    if (!selectedProduct) return;
    
    const boxes = Number(comboBoxes) || 1;
    // Capacidade padrão se não estiver definida
    const capacity = selectedProduct.combo_capacity || 9;
    const totalSelected = Object.values(comboSelections).reduce((sum, qty) => sum + qty, 0);
    
    if (totalSelected !== capacity) {
      showError(`A caixa deve ter exatamente ${capacity} itens. Atual: ${totalSelected}`);
      return;
    }
    
    const unit = Number(selectedProduct.base_price) || 0;
    const total = unit * boxes;
    
    const comboSelection = Object.entries(comboSelections).map(([productId, quantity]) => ({
      product_id: productId,
      quantity
    }));
    
    setItems(prev => [...prev, { 
      product: selectedProduct, 
      quantity: boxes, 
      unitPrice: unit, 
      totalPrice: total, 
      attributes: { 
        measure: 'combo',
        combo_selection: comboSelection
      } 
    }]);
    
    setComboModalVisible(false);
    setComboSelections({});
    setComboBoxes('1');
  };

  const updateComboSelection = (productId: string, increment: boolean) => {
    const currentQty = comboSelections[productId] || 0;
    const capacity = selectedProduct?.combo_capacity || 9;
    const totalSelected = Object.values(comboSelections).reduce((sum, qty) => sum + qty, 0) - currentQty;
    
    if (increment && totalSelected + currentQty + 1 > capacity) {
      showError(`Máximo de ${capacity} itens por caixa`);
      return;
    }
    
    if (!increment && currentQty <= 0) return;
    
    setComboSelections(prev => ({
      ...prev,
      [productId]: increment ? currentQty + 1 : currentQty - 1
    }));
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const toggleBuilderOption = (groupId: string, optionId: string) => {
    const group = builderGroups.find(g => g.id === groupId);
    const limit = group?.selection_limit ?? 1;
    setBuilderSelections(prev => {
      const current = prev[groupId] || [];
      const exists = current.includes(optionId);
      let next = current;
      if (exists) {
        next = current.filter(id => id !== optionId);
      } else {
        if (current.length >= limit) {
          showError(`Selecione no máximo ${limit} opção(ões) para ${group?.title || 'o grupo'}`);
          return prev;
        }
        next = [...current, optionId];
      }
      return { ...prev, [groupId]: next };
    });
  };

  const builderExtrasTotal = () => {
    let sum = 0;
    Object.entries(builderSelections).forEach(([gid, optionIds]) => {
      const opts = builderOptions[gid] || [];
      optionIds.forEach(id => {
        const found = opts.find(o => o.id === id);
        sum += Number(found?.extra_cost || 0);
      });
    });
    return sum;
  };

  const builderRulesSatisfied = () => {
    if (builderGroups.length === 0) return true;
    return builderGroups.every(g => (builderSelections[g.id] || []).length >= Math.min(1, g.selection_limit));
  };

  const addBuilderToBudget = () => {
    if (!selectedProduct) return;
    // quantidade/peso conforme tipo
    let qty = 1;
    if (selectedProduct.type === 'kg') {
      qty = Number(itemWeight.replace(',', '.')) || 1;
    } else if (selectedProduct.type === 'unidade') {
      qty = Number(itemQuantity) || 1;
    }
    const extras = builderExtrasTotal();
    const unit = Number(selectedProduct.base_price) + extras;
    const total = unit * qty;
    const selectionDetailed = builderGroups.map(g => ({
      group_id: g.id,
      title: g.title,
      options: (builderSelections[g.id] || []).map(oid => {
        const found = (builderOptions[g.id] || []).find(o => o.id === oid);
        return { id: oid, name: found?.name, extra_cost: found?.extra_cost || 0 };
      })
    }));
    const attrs: any = {
      measure: selectedProduct.type,
      builder_selection: selectionDetailed,
      builder_extras_total: extras,
    };
    if (selectedProduct.type === 'kg') attrs.weight = qty;
    setItems(prev => [...prev, { product: selectedProduct, quantity: qty, unitPrice: unit, totalPrice: total, attributes: attrs }]);
    setBuilderModalVisible(false);
    setBuilderSelections({});
  };

  const handleSaveBudget = async () => {
    if (!selectedClient || !selectedAddressId || items.length === 0) return;
    try {
      const { data: budget, error } = await supabase
        .from('budgets')
        .insert([{ client_id: selectedClient.id, total_amount: total, delivery_fee: Number(deliveryFee.replace(',', '.')) || 0, status: 'pendente' }])
        .select('*')
        .single();
      if (error) throw error;
             const rows = items.map(it => ({
         budget_id: budget.id,
         product_id: it.product.id,
         quantity: it.quantity,
         unit_price: it.unitPrice,
         total_price: it.totalPrice,
         attributes: it.attributes || {},
         combo_selection: it.attributes?.combo_selection || null,
       }));
      const { error: itemsErr } = await supabase.from('budget_items').insert(rows);
      if (itemsErr) throw itemsErr;
      // sucesso
      router.back();
    } catch (e) {
      // ignore por enquanto
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
        <Header title="Novo Orçamento" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
      </SafeAreaView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={{ padding: 16 }}>
              <Text style={styles.sectionTitle}>Cliente</Text>
              {selectedClient ? (
                <View style={styles.selectedBox}>
                  <Text style={styles.clientName}>{selectedClient.name}</Text>
                  {selectedClient.whatsapp ? <Text style={styles.clientSub}>{selectedClient.whatsapp}</Text> : null}
                  <TouchableOpacity style={styles.changeBtn} onPress={() => setSelectedClient(null)}>
                    <Ionicons name="swap-horizontal" size={18} color={Theme.colors.primary} />
                    <Text style={styles.changeBtnText}>Trocar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.searchRow}>
                  <Ionicons name="search" size={18} color={Theme.colors.textSecondary} style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cliente por nome ou WhatsApp"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={clientQuery}
                    onChangeText={setClientQuery}
                  />
                  <TouchableOpacity style={styles.addInline} onPress={() => router.push('/(main)/(tabs)/clients/new' as any)}>
                    <Ionicons name="person-add" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {!selectedClient && clients.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  {clients.map((c) => (
                    <TouchableOpacity key={c.id} style={styles.clientRow} onPress={() => setSelectedClient(c)}>
                      <Text style={styles.clientName}>{c.name}</Text>
                      {c.whatsapp ? <Text style={styles.clientSub}>{c.whatsapp}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Endereço</Text>
              {selectedClient ? (
                <View>
                  <TouchableOpacity style={styles.dropdown}>
                    <Text style={{ color: Theme.colors.text }}>{addresses.find(a => a.id === selectedAddressId) ? <AddressDisplay a={addresses.find(a => a.id === selectedAddressId)} /> : 'Selecione um endereço'}</Text>
                  </TouchableOpacity>
                  <View style={{ marginTop: 6 }}>
                    {addresses.map(a => (
                      <TouchableOpacity key={a.id} style={[styles.addrRow, selectedAddressId === a.id && styles.addrRowActive]} onPress={() => setSelectedAddressId(a.id)}>
                        <AddressDisplay a={a} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.addAddressBtn} onPress={() => router.push(`/(main)/(tabs)/clients/address-new?client_id=${selectedClient.id}` as any)}>
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addAddressText}>Adicionar Endereço</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ color: Theme.colors.textSecondary }}>Selecione um cliente primeiro</Text>
              )}

              <Text style={styles.sectionTitle}>Produtos</Text>
            {/* Listas por categoria */}
            {categories.map(cat => {
              const list = productsByCategory[cat.id] || [];
              if (list.length === 0) return null;
              return (
                <View key={cat.id} style={{ marginBottom: 16 }}>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <FlatList
                    horizontal
                    data={list}
                    keyExtractor={(p) => p.id}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                    renderItem={({ item }) => (
                      <View style={styles.productCard}>
                        <View style={styles.productImagePlaceholder}>
                                      {item.image_url ? (
              <Image source={{ uri: `${item.image_url}?id=${item.id}` }} style={styles.productImage} resizeMode="cover" />
            ) : (
                            <Ionicons name="image" size={24} color={Theme.colors.textSecondary} />
                          )}
                        </View>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        {!!item.attributes?.descricao && <Text style={styles.productDesc} numberOfLines={2}>{item.attributes.descricao}</Text>}
                                                 <Text style={styles.productPrice}>{formatBRL(Number(item.base_price || 0))}{item.type === 'kg' ? '/kg' : item.type === 'unidade' ? '/unid.' : '/caixa'}</Text>
                          <TouchableOpacity style={styles.cartBtn} onPress={() => openAddItem(item)}>
                            <Ionicons name={item.product_type === 'BUILDER' ? 'construct' : 'cart'} size={32} color={Theme.colors.primary} />
                          </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              );
            })}

              {/* Seção: Monte o Seu (BUILDER) */}
              {builderProducts.length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.categoryTitle}>Monte o Seu</Text>
                  <FlatList
                    horizontal
                    data={builderProducts}
                    keyExtractor={(p) => p.id}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                    renderItem={({ item }) => (
                      <View style={styles.productCard}>
                        <View style={styles.productImagePlaceholder}>
                          {item.image_url ? (
                            <Image source={{ uri: `${item.image_url}?id=${item.id}` }} style={styles.productImage} resizeMode="cover" />
                          ) : (
                            <Ionicons name="construct" size={24} color={Theme.colors.textSecondary} />
                          )}
                        </View>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.productDesc} numberOfLines={2}>A partir de {formatBRL(Number(item.base_price || 0))}{item.type === 'kg' ? '/kg' : '/unid.'}</Text>
                        <TouchableOpacity style={styles.cartBtn} onPress={() => openAddItem(item)}>
                          <Ionicons name="construct" size={32} color={Theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              ) : null}

            {/* Resumo */}
            <Text style={styles.sectionTitle}>Resumo</Text>
            {items.map((it, idx) => (
              <View key={idx} style={styles.summaryRow}>
                <Text style={styles.summaryLeft} numberOfLines={1}>{it.product.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity onPress={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="trash" size={18} color="#d32f2f" />
                  </TouchableOpacity>
                  <Text style={styles.summaryRight}>{formatBRL(it.totalPrice)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLeft, { fontWeight: '800' }]}>Subtotal</Text>
              <Text style={[styles.summaryRight, { fontWeight: '800' }]}>{formatBRL(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLeft}>Taxa de Entrega</Text>
              <TextInput value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="decimal-pad" style={[styles.input, { width: 120 }]} placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLeft, { fontWeight: '800' }]}>Total</Text>
              <Text style={[styles.summaryRight, { fontWeight: '800' }]}>{formatBRL(total)}</Text>
            </View>

            <View style={{ height: 12 }} />
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSaveBudget} disabled={!selectedClient || !selectedAddressId || items.length === 0}>
              <Text style={styles.buttonText}>Salvar Orçamento</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      {/* Modal simples de item */}
      {itemModalVisible && selectedProduct ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar {selectedProduct.name}</Text>
            {selectedProduct.type === 'kg' ? (
              <>
                <Text style={styles.modalLabel}>Peso (kg)</Text>
                <View style={styles.chipsRow}>
                  {['1','1.5','2','2.5','3'].map(w => (
                    <TouchableOpacity key={w} style={[styles.chip, itemWeight === w && styles.chipActive]} onPress={() => setItemWeight(w)}>
                      <Text style={[styles.chipText, itemWeight === w && styles.chipTextActive]}>{w} kg</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} value={itemWeight} onChangeText={setItemWeight} keyboardType="decimal-pad" placeholder="Peso" placeholderTextColor={Theme.colors.textSecondary} />
                <Text style={styles.modalTotal}>Total: {formatBRL((Number(selectedProduct.base_price)||0) * (Number(itemWeight)||1))}</Text>
              </>
            ) : selectedProduct.type === 'unidade' ? (
              <>
                <Text style={styles.modalLabel}>{selectedProduct.type === 'unidade' ? 'Quantidade (unidades)' : 'Quantidade (caixas)'}</Text>
                <TextInput style={styles.input} value={itemQuantity} onChangeText={setItemQuantity} keyboardType="number-pad" placeholder="Quantidade" placeholderTextColor={Theme.colors.textSecondary} />
                <Text style={styles.modalTotal}>Total: {formatBRL((Number(selectedProduct.base_price)||0) * (Number(itemQuantity)||1))}</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>Quantidade (caixas)</Text>
                <TextInput style={styles.input} value={itemQuantity} onChangeText={setItemQuantity} keyboardType="number-pad" placeholder="Quantidade" placeholderTextColor={Theme.colors.textSecondary} />
                {(() => {
                  const size = Number(selectedProduct.attributes?.box_size) || 0;
                  return size > 0 ? <Text style={{ color: Theme.colors.textSecondary, marginTop: 6 }}>Limite: {size} itens por caixa (informe sabores separando por vírgula abaixo)</Text> : null;
                })()}
                <Text style={styles.modalLabel}>Sabores (opcional)</Text>
                <TextInput style={[styles.input, { minHeight: 80 }]} value={itemFlavorsText} onChangeText={setItemFlavorsText} multiline textAlignVertical="top" placeholder="Ex.: ao leite, meio amargo, branco" placeholderTextColor={Theme.colors.textSecondary} />
                <Text style={styles.modalTotal}>Total: {formatBRL((Number(selectedProduct.base_price)||0) * (Number(itemQuantity)||1))}</Text>
              </>
            )}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.secondaryButton, { flex: 1 }]} onPress={() => setItemModalVisible(false)}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} onPress={addItemToBudget}>
                <Text style={styles.buttonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
                 </View>
       ) : null}

       {/* Modal de Combo */}
       {comboModalVisible && selectedProduct ? (
         <View style={styles.modalOverlay}>
           <View style={styles.modalCard}>
             <Text style={styles.modalTitle}>Monte sua {selectedProduct.name}</Text>
             
             <Text style={styles.modalLabel}>Quantidade de Caixas</Text>
             <View style={styles.quantityRow}>
               <TouchableOpacity 
                 style={styles.quantityBtn} 
                 onPress={() => setComboBoxes(prev => String(Math.max(1, Number(prev) - 1)))}
               >
                 <Ionicons name="remove" size={20} color={Theme.colors.primary} />
               </TouchableOpacity>
               <Text style={styles.quantityText}>{comboBoxes}</Text>
               <TouchableOpacity 
                 style={styles.quantityBtn} 
                 onPress={() => setComboBoxes(prev => String(Number(prev) + 1))}
               >
                 <Ionicons name="add" size={20} color={Theme.colors.primary} />
               </TouchableOpacity>
             </View>

             <Text style={styles.modalLabel}>Selecione os Sabores</Text>
             <Text style={styles.modalSubtitle}>
               Sabores selecionados: {Object.values(comboSelections).reduce((sum, qty) => sum + qty, 0)} / {selectedProduct.combo_capacity}
             </Text>
             
             <ScrollView style={{ maxHeight: 300 }}>
               {availableComboProducts.map(product => (
                 <View key={product.id} style={styles.comboItemRow}>
                   <View style={{ flex: 1 }}>
                     <Text style={styles.comboItemName}>{product.name}</Text>
                   </View>
                   <View style={styles.quantityRow}>
                     <TouchableOpacity 
                       style={styles.quantityBtn} 
                       onPress={() => updateComboSelection(product.id, false)}
                     >
                       <Ionicons name="remove" size={16} color={Theme.colors.primary} />
                     </TouchableOpacity>
                     <Text style={styles.quantityText}>{comboSelections[product.id] || 0}</Text>
                     <TouchableOpacity 
                       style={styles.quantityBtn} 
                       onPress={() => updateComboSelection(product.id, true)}
                     >
                       <Ionicons name="add" size={16} color={Theme.colors.primary} />
                     </TouchableOpacity>
                   </View>
                 </View>
               ))}
             </ScrollView>

             <Text style={styles.modalTotal}>
               Total: {formatBRL((Number(selectedProduct.base_price) || 0) * Number(comboBoxes))}
             </Text>

              <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={[styles.button, styles.secondaryButton, { flex: 1 }]} 
                 onPress={() => {
                   setComboModalVisible(false);
                   setComboSelections({});
                   setComboBoxes('1');
                 }}
               >
                 <Text style={styles.secondaryText}>Cancelar</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.button, styles.primaryButton, { flex: 1 }]} 
                 onPress={addComboToBudget}
               >
                 <Text style={styles.buttonText}>Adicionar</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       ) : null}
      {/* Modal Builder */}
      {builderModalVisible && selectedProduct ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Montar {selectedProduct.name}</Text>
            {selectedProduct.type === 'kg' ? (
              <>
                <Text style={styles.modalLabel}>Peso (kg)</Text>
                <View style={styles.chipsRow}>
                  {['1','1.5','2','2.5','3'].map(w => (
                    <TouchableOpacity key={w} style={[styles.chip, itemWeight === w && styles.chipActive]} onPress={() => setItemWeight(w)}>
                      <Text style={[styles.chipText, itemWeight === w && styles.chipTextActive]}>{w} kg</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} value={itemWeight} onChangeText={setItemWeight} keyboardType="decimal-pad" placeholder="Peso" placeholderTextColor={Theme.colors.textSecondary} />
              </>
            ) : selectedProduct.type === 'unidade' ? (
              <>
                <Text style={styles.modalLabel}>Quantidade</Text>
                <TextInput style={styles.input} value={itemQuantity} onChangeText={setItemQuantity} keyboardType="number-pad" placeholder="Quantidade" placeholderTextColor={Theme.colors.textSecondary} />
              </>
            ) : null}

            <ScrollView style={{ maxHeight: 340 }}>
              {builderGroups.map(g => (
                <View key={g.id} style={{ marginTop: 10 }}>
                  <Text style={styles.modalLabel}>{g.title} (até {g.selection_limit})</Text>
                  {(builderOptions[g.id] || []).map(o => {
                    const selected = (builderSelections[g.id] || []).includes(o.id);
                    return (
                      <TouchableOpacity key={o.id} style={[styles.optionRow, { paddingVertical: 10 }]} onPress={() => toggleBuilderOption(g.id, o.id)}>
                        <Text style={styles.optionText}>{o.name}</Text>
                        <Text style={styles.optionPrice}>{o.extra_cost ? `+ ${formatBRL(Number(o.extra_cost))}` : ''}</Text>
                        {selected ? <Ionicons name="checkmark" size={18} color={Theme.colors.primary} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            <Text style={styles.modalTotal}>
              Total: {formatBRL((Number(selectedProduct.base_price) + builderExtrasTotal()) * (selectedProduct.type === 'kg' ? (Number(itemWeight)||1) : (Number(itemQuantity)||1)))}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.secondaryButton, { flex: 1 }]} onPress={() => setBuilderModalVisible(false)}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} disabled={!builderRulesSatisfied()} onPress={addBuilderToBudget}>
                <Text style={styles.buttonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  sectionTitle: { color: Theme.colors.text, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Theme.colors.backgroundSecondary },
  searchInput: { flex: 1, color: Theme.colors.text },
  addInline: { marginLeft: 8, backgroundColor: Theme.colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  clientRow: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', marginTop: 6 },
  clientName: { color: Theme.colors.text, fontWeight: '700' },
  clientSub: { color: Theme.colors.textSecondary },
  selectedBox: { padding: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Theme.colors.border },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  changeBtnText: { color: Theme.colors.primary, fontWeight: '700' },
  dropdown: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  addrRow: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', marginTop: 6 },
  addrRowActive: { borderColor: Theme.colors.primary },
  addrText: { color: Theme.colors.text },
  addAddressBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start' },
  addAddressText: { color: '#fff', fontWeight: '700' },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: Theme.colors.primary },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: Theme.colors.primary, backgroundColor: 'transparent' },
  secondaryText: { color: Theme.colors.primary, fontWeight: '700' },
  categoryTitle: { color: Theme.colors.text, fontWeight: '700', marginBottom: 6 },
     productCard: { width: 180, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', borderRadius: 12, padding: 10, position: 'relative' },
  productImagePlaceholder: { width: '100%', height: 90, borderRadius: 8, backgroundColor: Theme.colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  productImage: { width: '100%', height: '100%', borderRadius: 8 },
  productName: { color: Theme.colors.text, fontWeight: '700', marginTop: 8 },
  productDesc: { color: Theme.colors.textSecondary, marginTop: 4 },
  productPrice: { color: Theme.colors.text, fontWeight: '700', marginTop: 8 },
     cartBtn: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLeft: { color: Theme.colors.text, flex: 1, paddingRight: 8 },
  summaryRight: { color: Theme.colors.text },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'flex-end' },
  modalCard: { width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { color: Theme.colors.text, fontWeight: '800', marginBottom: 8 },
  modalLabel: { color: Theme.colors.text, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  modalTotal: { color: Theme.colors.text, fontWeight: '800', marginTop: 10 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
     chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
   chipTextActive: { color: Theme.colors.primary },
   quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
   quantityBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
   quantityText: { fontSize: 16, fontWeight: '700', color: Theme.colors.text, minWidth: 30, textAlign: 'center' },
   modalSubtitle: { color: Theme.colors.textSecondary, fontSize: 12, marginBottom: 8 },
   comboItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
   comboItemName: { color: Theme.colors.text, fontWeight: '600' },
   modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  optionText: { color: Theme.colors.text, flex: 1 },
  optionPrice: { color: Theme.colors.textSecondary, marginRight: 8 },
});



