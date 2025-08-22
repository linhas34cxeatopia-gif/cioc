import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Client { id: string; name: string; whatsapp?: string; cep?: string; observations?: string; created_at: string; }
interface Order { id: string; status: string; total_amount: number; delivery_date: string; created_at: string; budget_id: string; }
interface ClientAddress { id: string; street: string; house_number?: string; complement?: string; neighborhood?: string; city: string; state: string; cep?: string; is_primary: boolean; }

type TabKey = 'dados' | 'enderecos' | 'historico';

export default function ClientDetailsScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const { toast, hideToast, showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>((tab as string) === 'enderecos' ? 'enderecos' : 'dados');
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addrLoading, setAddrLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
          if (error) throw error;
          setClient(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
        try {
          setOrdersLoading(true);
          const { data, error } = await supabase.from('orders').select('*').eq('client_id', id).order('created_at', { ascending: false });
          if (error) throw error;
          setOrders(data || []);
        } catch (e) { console.error(e); } finally { setOrdersLoading(false); }
        try {
          setAddrLoading(true);
          const { data, error } = await supabase.from('client_addresses').select('*').eq('client_id', id).order('is_primary', { ascending: false }).order('created_at', { ascending: false });
          if (error) throw error;
          setAddresses(data || []);
        } catch (e) { console.error(e); } finally { setAddrLoading(false); }
      };
      load();
      return () => {};
    }, [id])
  );

  const handleEditClient = () => router.push(`/(main)/(tabs)/clients/edit?id=${id}` as any);

  const setPrimary = async (addressId: string) => {
    try {
      const { error } = await supabase.from('client_addresses').update({ is_primary: true }).eq('id', addressId);
      if (error) throw error;
      showSuccess('Endereço definido como principal');
      // refresh
      const { data } = await supabase.from('client_addresses').select('*').eq('client_id', id).order('is_primary', { ascending: false }).order('created_at', { ascending: false });
      setAddresses(data || []);
    } catch (e: any) { console.error(e); showError('Não foi possível definir como principal'); }
  };

  const confirmDelete = (addressId: string) => {
    Alert.alert('Confirmar exclusão', 'Tem certeza que deseja deletar este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deletar', style: 'destructive', onPress: () => deleteAddress(addressId) },
    ]);
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase.from('client_addresses').delete().eq('id', addressId);
      if (error) throw error;
      showSuccess('Endereço removido');
      const { data } = await supabase.from('client_addresses').select('*').eq('client_id', id).order('is_primary', { ascending: false }).order('created_at', { ascending: false });
      setAddresses(data || []);
    } catch (e: any) { console.error(e); showError('Não foi possível excluir o endereço'); }
  };

  const formatAddress = (a: ClientAddress) => {
    let t = a.street || '';
    if (a.house_number) t += `, ${a.house_number}`;
    if (a.complement) t += `, ${a.complement}`;
    if (a.neighborhood) t += `, ${a.neighborhood}`;
    if (a.city) t += `, ${a.city}`;
    if (a.state) t += ` - ${a.state}`;
    return t || 'Endereço';
  };

  const totalSpent = useMemo(() => orders.reduce((acc, o) => acc + Number(o.total_amount), 0), [orders]);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  if (loading || !client) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Detalhes do Cliente" showBackButton onBackPress={() => router.back()} notificationsCount={3} />
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Theme.colors.primary} /><Text style={styles.loadingText}>Carregando...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Detalhes do Cliente" showBackButton onBackPress={() => router.back()} notificationsCount={3} />

      <View style={styles.tabsRow}>
        {[
          { key: 'dados', label: 'Dados do Cliente' },
          { key: 'enderecos', label: 'Endereços' },
          { key: 'historico', label: 'Histórico' },
        ].map((t) => (
          <Pressable key={t.key} style={[styles.tabItem, activeTab === (t.key as TabKey) && styles.tabItemActive]} onPress={() => setActiveTab(t.key as TabKey)}>
            <Text style={[styles.tabText, activeTab === (t.key as TabKey) && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'enderecos' && (
        <View style={styles.content}>
          {addrLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator color={Theme.colors.primary} /></View>
          ) : addresses.length > 0 ? (
            <FlatList
              data={addresses}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.addressCard}>
                  <Text style={styles.addressTitle}>{formatAddress(item)}</Text>
                  {item.cep ? <Text style={styles.addressSub}>{item.cep}</Text> : null}
                  {item.is_primary ? <Text style={styles.primaryTag}>Principal</Text> : null}
                  <View style={styles.addressActionsRowBottom}>
                    {!item.is_primary && (
                      <TouchableOpacity style={[styles.chipBtn]} onPress={() => setPrimary(item.id)}>
                        <Ionicons name="star" size={14} color={Theme.colors.primary} />
                        <Text style={styles.chipText}>Tornar Principal</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.chipBtnDanger]} onPress={() => confirmDelete(item.id)}>
                      <Ionicons name="trash" size={14} color="#e53935" />
                      <Text style={styles.chipTextDanger}>Deletar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyBox}><Ionicons name="home-outline" size={48} color={Theme.colors.textSecondary} /><Text style={styles.emptyText}>Nenhum endereço cadastrado</Text></View>
          )}
          <TouchableOpacity style={styles.fab} onPress={() => router.push(`/(main)/(tabs)/clients/address-new?id=${id}` as any)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'dados' && (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={handleEditClient} style={styles.iconEditBtn} accessibilityLabel="Editar cliente">
                <Ionicons name="pencil" size={18} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{client.name}</Text>
            {client.whatsapp ? (<><Text style={[styles.label, { marginTop: 16 }]}>WhatsApp</Text><Text style={styles.value}>{client.whatsapp}</Text></>) : null}
            {client.observations ? (<><Text style={[styles.label, { marginTop: 16 }]}>Observações</Text><Text style={styles.value}>{client.observations}</Text></>) : null}
          </View>
        </View>
      )}

      {activeTab === 'historico' && (
        <View style={styles.content}>
          {/* histórico como antes */}
          <View style={styles.emptyBox}><Text style={styles.emptyText}>Em breve</Text></View>
        </View>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: Theme.colors.textSecondary },
  tabsRow: { flexDirection: 'row', backgroundColor: Theme.colors.backgroundSecondary, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 4 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabItemActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  tabText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Theme.colors.text },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { fontSize: 14, color: Theme.colors.textSecondary },
  value: { fontSize: 16, color: Theme.colors.text, fontWeight: '600' },
  addressCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  addressTitle: { fontSize: 16, color: Theme.colors.text, fontWeight: '600' },
  addressSub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4 },
  primaryTag: { marginTop: 6, color: Theme.colors.primary, fontWeight: '700' },
  addressActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressActionsRowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  chipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: Theme.colors.primary, borderRadius: 999 },
  chipText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 12 },
  chipBtnDanger: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#e53935', borderRadius: 999 },
  chipTextDanger: { color: '#e53935', fontWeight: '700', fontSize: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 10, color: Theme.colors.textSecondary },
  fab: { position: 'absolute', bottom: 96, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
