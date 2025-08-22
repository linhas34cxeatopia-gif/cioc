import Header from '@/components/Header';
import SideMenu from '@/components/SideMenu';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Address {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  house_number?: string;
  complement?: string;
}

interface Client {
  id: string;
  name: string;
  whatsapp?: string;
  created_at: string;
  primaryAddress?: Address | null;
}

export default function ClientsScreen() {
  const router = useRouter();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast, hideToast } = useToast();

  const ITEMS_PER_PAGE = 20;

  // Recarrega ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      setPage(0);
      setHasMore(true);
      setClients([]);
      setFilteredClients([]);
      setLoading(true);
      loadClients(false);
    }, [])
  );

  useEffect(() => {
    filterClients();
  }, [searchQuery, clients]);

  const loadClients = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, whatsapp, created_at')
        .order('name', { ascending: true })
        .range(from, to);

      if (clientsError) throw clientsError;

      const newClients = clientsData || [];

      // Buscar endereços principais dos clientes carregados
      const clientIds = newClients.map(c => c.id);
      let primaryMap: Record<string, Address | null> = {};
      if (clientIds.length > 0) {
        const { data: addressesData, error: addressesError } = await supabase
          .from('client_addresses')
          .select('*')
          .in('client_id', clientIds)
          .eq('is_primary', true);
        if (addressesError) throw addressesError;
        primaryMap = (addressesData || []).reduce((acc: Record<string, Address>, addr: any) => {
          acc[addr.client_id] = {
            street: addr.street,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            cep: addr.cep,
            house_number: addr.house_number,
            complement: addr.complement,
          };
          return acc;
        }, {});
      }

      const merged = newClients.map(c => ({ ...c, primaryAddress: primaryMap[c.id] || null }));

      if (loadMore) {
        setClients(prev => [...prev, ...merged]);
        setPage(currentPage);
      } else {
        setClients(merged);
        setPage(0);
      }

      setHasMore(newClients.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatAddress = (address?: Address | null) => {
    if (!address) return 'Endereço não informado';
    let txt = address.street || '';
    if (address.house_number) txt += `, ${address.house_number}`;
    if (address.complement) txt += `, ${address.complement}`;
    if (address.neighborhood) txt += `, ${address.neighborhood}`;
    if (address.city) txt += `, ${address.city}`;
    if (address.state) txt += ` - ${address.state}`;
    return txt || 'Endereço não informado';
  };

  const filterClients = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      (client.whatsapp && client.whatsapp.toLowerCase().includes(query))
    );
    setFilteredClients(filtered);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadClients(true);
    }
  };

  const handleClientPress = (client: Client) => {
    router.push(`/(main)/(tabs)/clients/${client.id}` as any);
  };

  const handleAddClient = () => {
    router.push('/(main)/(tabs)/clients/new' as any);
  };

  const renderClientCard = ({ item }: { item: Client }) => {
    return (
      <TouchableOpacity 
        style={styles.clientCard} 
        onPress={() => handleClientPress(item)}
      >
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          {item.whatsapp && (
            <Text style={styles.clientWhatsapp}>{item.whatsapp}</Text>
          )}
          <Text style={styles.clientAddress}>{formatAddress(item.primaryAddress)}</Text>
        </View>
        
        <View style={styles.clientActions}>
          <View style={styles.ordersCount}>
            <Ionicons name="receipt" size={16} color={Theme.colors.primary} />
            <Text style={styles.ordersCountText}>0</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addBudgetButton}
            onPress={() => router.push(`/(main)/(tabs)/budgets/new?clientId=${item.id}` as any)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addBudgetText}>Orçamento</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando mais clientes...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Clientes"
          onMenuPress={() => setSideMenuVisible(true)}
          notificationsCount={3}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando clientes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Clientes"
        onMenuPress={() => setSideMenuVisible(true)}
        notificationsCount={3}
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome ou WhatsApp..."
            placeholderTextColor={Theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.clientsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={Theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhum cliente encontrado</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Tente ajustar sua pesquisa' : 'Comece adicionando seu primeiro cliente'}
              </Text>
            </View>
          }
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={handleAddClient}>
        <Ionicons name="add" size={24} color="#fff" />
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
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Theme.colors.text,
  },
  clientsList: {
    paddingBottom: 100,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    ...Theme.shadows.medium,
  },
  clientInfo: { marginBottom: 12 },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  clientWhatsapp: { fontSize: 16, color: Theme.colors.textSecondary, marginBottom: 4 },
  clientAddress: { fontSize: 14, color: Theme.colors.textSecondary },
  clientActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ordersCount: { flexDirection: 'row', alignItems: 'center' },
  ordersCountText: { marginLeft: 4, fontSize: 14, color: Theme.colors.textSecondary },
  addBudgetButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b2b2b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBudgetText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingFooter: { paddingVertical: 20, alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: Theme.colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Theme.colors.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center' },
});
