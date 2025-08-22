import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Budget { id: string; client_id: string; total_amount: number; delivery_fee?: number | null; status: string; created_at: string }
interface Client { id: string; name: string; whatsapp?: string | null }
interface Item { id: string; product_id: string; quantity: number; unit_price: number; total_price: number; attributes?: any; products?: { name: string } | null }

export default function BudgetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { toast, hideToast, showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [feeInput, setFeeInput] = useState('0');

  const subtotal = useMemo(() => items.reduce((s, it) => s + Number(it.total_price || 0), 0), [items]);
  const deliveryFee = useMemo(() => Number(budget?.delivery_fee || 0), [budget]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [{ data: b }, { data: its }] = await Promise.all([
          supabase.from('budgets').select('*').eq('id', id).single(),
          supabase.from('budget_items').select('id, product_id, quantity, unit_price, total_price, attributes, products:product_id ( name )').eq('budget_id', id)
        ]);
        const bud = b as any;
        setBudget(bud);
        setItems((its as any) || []);
        if (bud?.client_id) {
          const { data: c } = await supabase.from('clients').select('id, name, whatsapp').eq('id', bud.client_id).single();
          if (c) setClient(c as any);
        }
        setFeeInput(String(bud?.delivery_fee ?? 0).replace('.', ','));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const updateItemQuantity = async (target: Item, newQty: number) => {
    if (!budget) return;
    if (newQty < 1) return;
    try {
      const newTotal = Number(target.unit_price) * newQty;
      const { error } = await supabase
        .from('budget_items')
        .update({ quantity: newQty, total_price: newTotal })
        .eq('id', target.id);
      if (error) throw error;
      // atualizar local
      setItems(prev => prev.map(it => it.id === target.id ? { ...it, quantity: newQty, total_price: newTotal } : it));
      const newSubtotal = items.reduce((s, it) => s + (it.id === target.id ? newTotal : Number(it.total_price || 0)), 0);
      const newBudgetTotal = newSubtotal + deliveryFee;
      await supabase.from('budgets').update({ total_amount: newBudgetTotal }).eq('id', budget.id);
      setBudget({ ...budget, total_amount: newBudgetTotal });
    } catch (e: any) {
      showError('Erro ao atualizar quantidade');
    }
  };

  const convertToOrder = async () => {
    if (!budget) return;
    try {
      // evita duplicidade
      const { data: existing } = await supabase.from('orders').select('id').eq('budget_id', budget.id).maybeSingle();
      if (existing?.id) { showError('Este orçamento já possui uma encomenda.'); return; }
      const { error } = await supabase.from('orders').insert([{ budget_id: budget.id, client_id: budget.client_id, total_amount: budget.total_amount, status: 'pendente' }]);
      if (error) throw error;
      showSuccess('Encomenda criada com sucesso!');
    } catch (e: any) {
      showError('Erro ao converter em encomenda');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Orçamento" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
        <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`OS#${String(id).slice(0, 8)}`} showBackButton onBackPress={() => router.back()} notificationsCount={3} />

      <View style={styles.content}>
        {/* Status */}
        <Text style={styles.section}>Status</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {[
            { k: 'pendente', label: 'Pendente' },
            { k: 'aprovado', label: 'Aprovado' },
            { k: 'rejeitado', label: 'Rejeitado' },
            { k: 'concluido', label: 'Concluído' },
          ].map(s => (
            <TouchableOpacity key={s.k} style={[styles.chip, budget?.status === s.k && styles.chipActive]} onPress={async () => {
              if (budget?.status === s.k) return;
              setSaving(true);
              try {
                const { error } = await supabase.from('budgets').update({ status: s.k }).eq('id', id);
                if (error) throw error;
                setBudget(prev => prev ? { ...prev, status: s.k } as any : prev);
              } finally { setSaving(false); }
            }}>
              <Text style={[styles.chipText, budget?.status === s.k && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Cliente</Text>
        <View style={styles.box}>
          <Text style={styles.title}>{client?.name || 'Cliente'}</Text>
          {client?.whatsapp ? <Text style={styles.sub}>{client.whatsapp}</Text> : null}
        </View>

        <Text style={styles.section}>Itens</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.products?.name || 'Produto'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => updateItemQuantity(item, Number(item.quantity) - 1)}>
                    <Ionicons name="remove" size={16} color={Theme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.itemSub}>{Number(item.quantity)} x {formatBRL(Number(item.unit_price))}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => updateItemQuantity(item, Number(item.quantity) + 1)}>
                    <Ionicons name="add" size={16} color={Theme.colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Remover item', 'Deseja remover este item?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: async () => {
                      try {
                        const { error } = await supabase.from('budget_items').delete().eq('id', item.id);
                        if (error) throw error;
                        setItems(prev => prev.filter(it => it.id !== item.id));
                        // Atualizar total no orçamento
                        const newSubtotal = items.filter(it => it.id !== item.id).reduce((s, it) => s + Number(it.total_price || 0), 0);
                        const newTotal = newSubtotal + deliveryFee;
                        await supabase.from('budgets').update({ total_amount: newTotal }).eq('id', id);
                        setBudget(prev => prev ? { ...prev, total_amount: newTotal } as any : prev);
                      } catch {}
                    } }
                  ]);
                }}>
                  <Ionicons name="trash" size={18} color="#d32f2f" />
                </TouchableOpacity>
                <Text style={styles.itemRight}>{formatBRL(Number(item.total_price))}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: Theme.colors.textSecondary }}>Sem itens</Text>}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />

        <View style={styles.summaryRow}><Text style={styles.sumLeft}>Subtotal</Text><Text style={styles.sumRight}>{formatBRL(subtotal)}</Text></View>
        <View style={[styles.summaryRow, { alignItems: 'center' }]}>
          <Text style={styles.sumLeft}>Entrega</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput value={feeInput} onChangeText={setFeeInput} keyboardType="decimal-pad" style={[styles.input, { width: 120 }]} placeholder="0,00" placeholderTextColor={Theme.colors.textSecondary} />
            <TouchableOpacity style={[styles.button, styles.smallPrimary]} disabled={saving} onPress={async () => {
              try {
                setSaving(true);
                const fee = Number(feeInput.replace(',', '.')) || 0;
                const newTotal = subtotal + fee;
                const { error } = await supabase.from('budgets').update({ delivery_fee: fee, total_amount: newTotal }).eq('id', id);
                if (error) throw error;
                setBudget(prev => prev ? { ...prev, delivery_fee: fee, total_amount: newTotal } as any : prev);
              } finally { setSaving(false); }
            }}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.summaryRow}><Text style={[styles.sumLeft, { fontWeight: '800' }]}>Total</Text><Text style={[styles.sumRight, { fontWeight: '800' }]}>{formatBRL(total)}</Text></View>

        {budget?.status === 'aprovado' ? (
          <TouchableOpacity style={[styles.button, styles.primaryCta]} onPress={convertToOrder}>
            <Text style={styles.buttonText}>Converter em Encomenda</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, padding: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { color: Theme.colors.text, fontWeight: '800', marginBottom: 8, marginTop: 8 },
  box: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  title: { color: Theme.colors.text, fontWeight: '700' },
  sub: { color: Theme.colors.textSecondary },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  itemTitle: { color: Theme.colors.text, fontWeight: '700' },
  itemSub: { color: Theme.colors.textSecondary },
  itemRight: { color: Theme.colors.text, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  sumLeft: { color: Theme.colors.text },
  sumRight: { color: Theme.colors.text },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Theme.colors.primary },
  input: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 10, backgroundColor: Theme.colors.backgroundSecondary, color: Theme.colors.text },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  smallPrimary: { backgroundColor: Theme.colors.primary },
  buttonText: { color: '#fff', fontWeight: '700' },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  primaryCta: { marginTop: 12, backgroundColor: Theme.colors.primary, borderRadius: 12 },
});


