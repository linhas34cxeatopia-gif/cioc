import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useQuotation } from '@/contexts/QuotationContext';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Client { id: string; name: string; whatsapp?: string | null }
interface Address { id: string; street: string; house_number?: string | null; complement?: string | null; city?: string | null; state?: string | null; is_primary?: boolean }

export default function QuotationStep1Screen() {
  const router = useRouter();
  const { toast, hideToast, showError, showSuccess } = useToast();
  const { client, selectedAddressId, setClient, setAddress, setStep } = useQuotation();

  const [clientQuery, setClientQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(client);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIdState, setSelectedAddressIdState] = useState<string | null>(selectedAddressId);

  const [newClientModalVisible, setNewClientModalVisible] = useState(false);
  const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);

  // Debounce para busca de clientes
  useEffect(() => {
    const q = clientQuery.trim();
    if (q.length === 0) { setClients([]); return; }
    
    const timer = setTimeout(() => {
      searchClients(q);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [clientQuery]);

  // Buscar endereços do cliente
  useEffect(() => {
    (async () => {
      if (!selectedClient) { 
        setAddresses([]); 
        setSelectedAddressIdState(null); 
        return; 
      }
      
      const { data } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', selectedClient.id)
        .order('is_primary', { ascending: false });
      
      setAddresses((data as any) || []);
      
      // Selecionar endereço principal ou o primeiro da lista
      const primary = (data || []).find((a: any) => a.is_primary);
      setSelectedAddressIdState(primary?.id || (data && data[0]?.id) || null);
    })();
  }, [selectedClient]);

  // Sincronizar estado local com o contexto
  useEffect(() => {
    if (client) {
      setSelectedClient(client);
    }
  }, [client]);

  const searchClients = useCallback(async (q: string) => {
    setClientLoading(true);
    try {
      const { data } = await supabase
        .from('clients')
        .select('id, name, whatsapp')
        .or(`name.ilike.%${q}%,whatsapp.ilike.%${q}%,email.ilike.%${q}%`)
        .order('name');
      setClients((data as any) || []);
    } finally { 
      setClientLoading(false); 
    }
  }, []);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientQuery(''); // Limpar a busca
    setClients([]); // Limpar resultados
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressIdState(addressId);
  };

  const handleNewClientSuccess = (newClient: Client) => {
    setNewClientModalVisible(false);
    setSelectedClient(newClient);
    setClientQuery(newClient.name); // Preencher campo de busca com o novo cliente
    showSuccess('Cliente cadastrado com sucesso!');
  };

  const handleNewAddressSuccess = () => {
    setNewAddressModalVisible(false);
    // Recarregar endereços
    if (selectedClient) {
      (async () => {
        const { data } = await supabase
          .from('client_addresses')
          .select('*')
          .eq('client_id', selectedClient.id)
          .order('is_primary', { ascending: false });
        
        setAddresses((data as any) || []);
        
        // Selecionar o novo endereço (último cadastrado)
        if (data && data.length > 0) {
          setSelectedAddressIdState(data[0].id);
        }
      })();
    }
    showSuccess('Endereço cadastrado com sucesso!');
  };

  const handleNext = () => {
    if (!selectedClient || !selectedAddressIdState) {
      showError('Selecione um cliente e um endereço para continuar');
      return;
    }

    // Salvar no contexto
    setClient(selectedClient);
    setAddress(selectedAddressIdState);
    setStep(2);
    
    // Navegar para o próximo passo
    router.push('/budgets/steps/step2');
  };

  const AddressDisplay = ({ a }: { a: Address }) => (
    <Text style={styles.addrText}>
      {`${a.street || ''}, ${a.house_number || ''} ${a.complement ? ' - ' + a.complement : ''} - ${a.city || ''}/${a.state || ''}`}
    </Text>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
        <Header title="Orçamento - Passo 1/3" showBackButton onBackPress={() => router.back()} />
      </SafeAreaView>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Selecione o Cliente</Text>
          
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
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={Theme.colors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar cliente por nome/telefone/email"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={clientQuery}
                  onChangeText={setClientQuery}
                />
                <TouchableOpacity 
                  style={styles.addInline} 
                  onPress={() => setNewClientModalVisible(true)}
                >
                  <Ionicons name="person-add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {clients.length > 0 && (
                <FlatList
                  data={clients}
                  keyExtractor={(item) => item.id}
                  style={styles.clientsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.clientRow} 
                      onPress={() => handleClientSelect(item)}
                    >
                      <Text style={styles.clientName}>{item.name}</Text>
                      {item.whatsapp ? <Text style={styles.clientSub}>{item.whatsapp}</Text> : null}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Selecione o Endereço</Text>
          
          {selectedClient ? (
            <View>
              {addresses.length > 0 ? (
                <FlatList
                  data={addresses}
                  keyExtractor={(item) => item.id}
                  style={styles.addressList}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.addrRow, 
                        selectedAddressIdState === item.id && styles.addrRowActive
                      ]} 
                      onPress={() => handleAddressSelect(item.id)}
                    >
                      <View style={styles.radioContainer}>
                        <View style={[
                          styles.radioOuter, 
                          selectedAddressIdState === item.id && styles.radioOuterActive
                        ]}>
                          {selectedAddressIdState === item.id && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                      </View>
                      <View style={styles.addressContent}>
                        <AddressDisplay a={item} />
                        {item.is_primary && (
                          <Text style={styles.primaryBadge}>Principal</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
              )}
              
              <TouchableOpacity 
                style={styles.addAddressBtn} 
                onPress={() => setNewAddressModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addAddressText}>Cadastrar Novo Endereço</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>Selecione um cliente primeiro</Text>
          )}

          <View style={styles.footer}>
            <Button
              title="Avançar"
              onPress={handleNext}
              disabled={!selectedClient || !selectedAddressIdState}
              variant="primary"
              size="large"
              style={styles.nextButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Novo Cliente */}
      <Modal
        visible={newClientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewClientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Cliente</Text>
              <TouchableOpacity onPress={() => setNewClientModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Aqui seria importado o componente de cadastro de cliente */}
            <Text style={styles.modalText}>Componente de cadastro de cliente será integrado aqui</Text>
            
            {/* Botões temporários para simular o cadastro */}
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setNewClientModalVisible(false)}
                variant="outline"
                size="medium"
                style={{ flex: 1 }}
              />
              <Button
                title="Salvar"
                onPress={() => {
                  // Simulação de cadastro bem-sucedido
                  const newClient = {
                    id: `temp-${Date.now()}`,
                    name: 'Novo Cliente',
                    whatsapp: '(11) 99999-9999'
                  };
                  handleNewClientSuccess(newClient);
                }}
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Novo Endereço */}
      <Modal
        visible={newAddressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Endereço</Text>
              <TouchableOpacity onPress={() => setNewAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Aqui seria importado o componente de cadastro de endereço */}
            <Text style={styles.modalText}>Componente de cadastro de endereço será integrado aqui</Text>
            
            {/* Botões temporários para simular o cadastro */}
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => setNewAddressModalVisible(false)}
                variant="outline"
                size="medium"
                style={{ flex: 1 }}
              />
              <Button
                title="Salvar"
                onPress={handleNewAddressSuccess}
                variant="primary"
                size="medium"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background 
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: { 
    color: Theme.colors.text, 
    fontWeight: '700', 
    fontSize: 18,
    marginTop: 16, 
    marginBottom: 12 
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: Theme.colors.border, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: Theme.colors.backgroundSecondary 
  },
  searchInput: { 
    flex: 1, 
    color: Theme.colors.text 
  },
  addInline: { 
    marginLeft: 8, 
    backgroundColor: Theme.colors.primary, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  clientsList: {
    maxHeight: 200,
    marginTop: 8,
  },
  clientRow: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: Theme.colors.border, 
    backgroundColor: '#fff', 
    marginTop: 6 
  },
  clientName: { 
    color: Theme.colors.text, 
    fontWeight: '700' 
  },
  clientSub: { 
    color: Theme.colors.textSecondary 
  },
  selectedBox: { 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  changeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 8 
  },
  changeBtnText: { 
    color: Theme.colors.primary, 
    fontWeight: '700' 
  },
  addressList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  addrRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: Theme.colors.border, 
    backgroundColor: '#fff', 
    marginTop: 6 
  },
  addrRowActive: { 
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight,
  },
  radioContainer: {
    marginRight: 12,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Theme.colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  addressContent: {
    flex: 1,
  },
  addrText: { 
    color: Theme.colors.text 
  },
  primaryBadge: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  addAddressBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: Theme.colors.primary, 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderRadius: 10, 
    alignSelf: 'flex-start' 
  },
  addAddressText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 16,
  },
  nextButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  modalText: {
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});