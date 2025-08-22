import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'todos' | 'aprovados' | 'aberto' | 'expirados';

interface ClientInfo { id: string; name: string; whatsapp?: string | null }
interface BudgetListItem {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  clients?: ClientInfo | null;
}

const PAGE_SIZE = 10;

export default function BudgetsScreen() {
  const router = useRouter();
  const { toast, hideToast } = useToast();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [notificationsCount] = useState(3);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<BudgetListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const periodLabel = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR');
    return `${fmt(startDate)} — ${fmt(endDate)}`;
  }, [startDate, endDate]);

  const buildFilters = useCallback(async () => {
    const filters: any = {
      gte: ['created_at', startDate.toISOString()],
      lte: ['created_at', endDate.toISOString()],
    };

    if (statusFilter === 'aprovados') {
      filters.eq = ['status', 'aprovado'];
    }

    // Busca por cliente
    let clientIds: string[] | null = null;
    const term = search.trim();
    if (term.length > 0) {
      const { data: foundClients } = await supabase
        .from('clients')
        .select('id')
        .or(`name.ilike.%${term}%,whatsapp.ilike.%${term}%`);
      clientIds = (foundClients || []).map((c: any) => c.id);

      // fallback: busca por trecho do id do orçamento
      if (clientIds.length === 0 && term.length >= 4) {
        filters.like = ['id', `%${term}%`];
      }
    }

    return { filters, clientIds };
  }, [search, statusFilter, startDate, endDate]);

  const loadPage = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const { filters, clientIds } = await buildFilters();

      let from = reset ? 0 : page * PAGE_SIZE;
      let to = from + PAGE_SIZE - 1;

      let countQuery = supabase
        .from('budgets')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', filters.gte[1])
        .lte('created_at', filters.lte[1]);

      let dataQuery = supabase
        .from('budgets')
        .select('id, client_id, total_amount, status, created_at, clients:client_id ( id, name, whatsapp )')
        .order('created_at', { ascending: false })
        .range(from, to)
        .gte('created_at', filters.gte[1])
        .lte('created_at', filters.lte[1]);

      if (filters.eq) {
        countQuery = countQuery.eq(filters.eq[0], filters.eq[1]);
        dataQuery = dataQuery.eq(filters.eq[0], filters.eq[1]);
      }

      if (statusFilter === 'aberto') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        countQuery = countQuery.gte('created_at', cutoff.toISOString());
        dataQuery = dataQuery.gte('created_at', cutoff.toISOString());
      } else if (statusFilter === 'expirados') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        countQuery = countQuery.lt('created_at', cutoff.toISOString());
        dataQuery = dataQuery.lt('created_at', cutoff.toISOString());
      }

      if (clientIds && clientIds.length > 0) {
        countQuery = countQuery.in('client_id', clientIds);
        dataQuery = dataQuery.in('client_id', clientIds);
      }

      if (filters.like) {
        dataQuery = dataQuery.like(filters.like[0], filters.like[1]);
      }

      const [{ count, error: countErr }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!countErr && typeof count === 'number') setTotalCount(count);
      if (error) throw error;
      const pageData: BudgetListItem[] = (data as any) || [];

      setItems((prev) => (reset ? pageData : [...prev, ...pageData]));
      const received = (reset ? 0 : page * PAGE_SIZE) + pageData.length;
      setHasMore(received < (count || 0));
      if (reset) setPage(1); else setPage((p) => p + 1);
    } catch (e) {
      // silencioso por enquanto
    } finally {
      setLoading(false);
    }
  }, [buildFilters, loading, page]);

  useFocusEffect(useCallback(() => { setItems([]); setPage(0); setHasMore(true); loadPage(true); }, [search, statusFilter, startDate, endDate]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(true);
    setRefreshing(false);
  }, [loadPage]);

  const renderItem = ({ item }: { item: BudgetListItem }) => {
    const os = `OS#${item.id.slice(0, 8)}`;
    const clientName = (item as any).clients?.name || 'Cliente';
    const whatsapp = (item as any).clients?.whatsapp || '';
    const date = new Date(item.created_at).toLocaleDateString('pt-BR');
    const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.total_amount || 0));
    const statusColor = item.status === 'aprovado' ? '#2e7d32' : '#555';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/(main)/(tabs)/budgets/${item.id}` as any)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.osText}>{os}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{item.status === 'aprovado' ? 'Aprovado' : 'Pendente'}</Text>
        </View>
        <Text style={styles.clientText}>{clientName}</Text>
        {whatsapp ? <Text style={styles.subText}>{whatsapp}</Text> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={styles.subText}>{date}</Text>
          <Text style={styles.valueText}>{value}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Theme.colors.textSecondary} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por Nº, cliente ou WhatsApp"
          placeholderTextColor={Theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersRow}>
        {(
          [
            { k: 'todos', label: 'Todos' },
            { k: 'aprovados', label: 'Aprovados' },
            { k: 'aberto', label: 'Em Aberto' },
            { k: 'expirados', label: 'Expirados' },
          ] as { k: StatusFilter; label: string }[]
        ).map((f) => (
          <TouchableOpacity key={f.k} style={[styles.chip, statusFilter === f.k && styles.chipActive]} onPress={() => setStatusFilter(f.k)}>
            <Text style={[styles.chipText, statusFilter === f.k && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.periodRow}>
        <Ionicons name="calendar" size={18} color={Theme.colors.textSecondary} />
        <Text style={styles.periodText}>{periodLabel}</Text>
        <View style={{ flexDirection: 'row', marginLeft: 'auto', gap: 8 }}>
          <TouchableOpacity style={styles.smallChip} onPress={() => { const d = new Date(); d.setHours(0,0,0,0); const e = new Date(); e.setHours(23,59,59,999); setStartDate(d); setEndDate(e); }}><Text style={styles.smallChipText}>Hoje</Text></TouchableOpacity>
          <TouchableOpacity style={styles.smallChip} onPress={() => { const e = new Date(); e.setHours(23,59,59,999); const d = new Date(); d.setDate(d.getDate()-7); d.setHours(0,0,0,0); setStartDate(d); setEndDate(e); }}><Text style={styles.smallChipText}>7d</Text></TouchableOpacity>
          <TouchableOpacity style={styles.smallChip} onPress={() => { const e = new Date(); e.setHours(23,59,59,999); const d = new Date(); d.setDate(d.getDate()-30); d.setHours(0,0,0,0); setStartDate(d); setEndDate(e); }}><Text style={styles.smallChipText}>30d</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={styles.counterText}>Exibindo {Math.min(items.length, totalCount)} de {totalCount} orçamentos</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Orçamentos" 
        onMenuPress={() => setSideMenuVisible(true)}
        notificationsCount={notificationsCount}
      />

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        onEndReachedThreshold={0.2}
        onEndReached={() => { if (hasMore && !loading) loadPage(false); }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 16 }} color={Theme.colors.primary} /> : null}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/(main)/(tabs)/budgets/steps/step1' as any)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <SideMenu 
        visible={sideMenuVisible}
        onClose={() => setSideMenuVisible(false)}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Theme.colors.backgroundSecondary, marginBottom: 10 },
  searchInput: { flex: 1, color: Theme.colors.text },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  chipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
  chipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Theme.colors.primary },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  periodText: { color: Theme.colors.textSecondary },
  smallChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border },
  smallChipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  counterText: { color: Theme.colors.textSecondary, marginVertical: 8 },
  card: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: '#fff', marginBottom: 10 },
  osText: { fontWeight: '700', color: Theme.colors.text },
  clientText: { marginTop: 6, fontWeight: '600', color: Theme.colors.text },
  subText: { color: Theme.colors.textSecondary },
  valueText: { fontWeight: '800', color: Theme.colors.text },
  fab: { position: 'absolute', right: 20, bottom: 90, backgroundColor: Theme.colors.primary, width: Theme.layout.fabSize, height: Theme.layout.fabSize, borderRadius: Theme.layout.fabSize / 2, alignItems: 'center', justifyContent: 'center', ...Theme.shadows.xl },
});