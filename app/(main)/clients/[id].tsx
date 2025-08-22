import { Theme } from '@/constants/Theme';
import { supabase } from '@/config/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

interface Client {
  id: string;
  name: string;
  whatsapp?: string;
  addresses: any[];
  cep?: string;
  observations?: string;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  delivery_date: string;
  created_at: string;
  budget_id: string;
}

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { toast, hideToast } = useToast();

  useEffect(() => {
    if (id) {
      loadClient();
      loadClientOrders();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async (updatedData: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;

      setClient(prev => prev ? { ...prev, ...updatedData } : null);
      setEditing(false);
      // showSuccess('Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      // showError('Erro ao atualizar cliente');
    }
  };

  const handleAddBudget = () => {
    router.push(`/(main)/budgets/new?clientId=${id}` as any);
  };

  const calculateTotalSpent = () => {
    return orders.reduce((total, order) => total + Number(order.total_amount), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#FFA500';
      case 'em_producao': return '#2196F3';
      case 'pronto': return '#4CAF50';
      case 'entregue': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_producao': return 'Em Produção';
      case 'pronto': return 'Pronto';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Header
            title="Detalhes do Cliente"
            showBackButton={true}
            onBackPress={() => router.back()}
            notificationsCount={3}
          />
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando cliente...</Text>
        </View>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Header
            title="Detalhes do Cliente"
            showBackButton={true}
            onBackPress={() => router.back()}
            notificationsCount={3}
          />
        </SafeAreaView>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cliente não encontrado</Text>
        </View>
      </View>
    );
  }

  const address = client.addresses && client.addresses.length > 0 ? client.addresses[0] : null;
  const totalSpent = calculateTotalSpent();

  const formatAddress = (address: any) => {
    if (!address) return 'Endereço não informado';
    
    let addressText = address.street || '';
    if (address.house_number) addressText += `, ${address.house_number}`;
    if (address.complement) addressText += `, ${address.complement}`;
    if (address.neighborhood) addressText += `, ${address.neighborhood}`;
    if (address.city) addressText += `, ${address.city}`;
    if (address.state) addressText += ` - ${address.state}`;
    
    return addressText;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header
          title="Detalhes do Cliente"
          showBackButton={true}
          onBackPress={() => router.back()}
          notificationsCount={3}
        />
      </SafeAreaView>

      <View style={styles.content}>
        {/* Card principal do cliente */}
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.whatsapp && (
                <Text style={styles.clientWhatsapp}>WhatsApp: {client.whatsapp}</Text>
              )}
              {address && (
                <Text style={styles.clientAddress}>
                  {formatAddress(address)}
                </Text>
              )}
              {client.cep && (
                <Text style={styles.clientCep}>CEP: {client.cep}</Text>
              )}
              {client.observations && (
                <Text style={styles.clientObservations}>{client.observations}</Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.clientStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Gasto</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addBudgetButton} onPress={handleAddBudget}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addBudgetText}>Novo Orçamento</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico de pedidos */}
        <View style={styles.ordersSection}>
          <Text style={styles.sectionTitle}>Histórico de Pedidos</Text>
          
          {ordersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando pedidos...</Text>
            </View>
          ) : orders.length > 0 ? (
            <FlatList
              data={orders}
              renderItem={({ item }) => (
                <View style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>OS #{item.id.slice(0, 8)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderDate}>Data: {formatDate(item.created_at)}</Text>
                    <Text style={styles.orderAmount}>Valor: {formatCurrency(item.total_amount)}</Text>
                    {item.delivery_date && (
                      <Text style={styles.deliveryDate}>
                        Entrega: {formatDate(item.delivery_date)}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={48} color={Theme.colors.textSecondary} />
              <Text style={styles.emptyOrdersText}>Nenhum pedido encontrado</Text>
              <Text style={styles.emptyOrdersSubtext}>Este cliente ainda não fez nenhum pedido</Text>
            </View>
          )}
        </View>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  safeArea: {
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  clientWhatsapp: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  clientAddress: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  clientCep: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  clientObservations: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  editButton: {
    padding: 8,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  addBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addBudgetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ordersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 4,
  },
  orderDate: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  orderAmount: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  deliveryDate: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.error,
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});
