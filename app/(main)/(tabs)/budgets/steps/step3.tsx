import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useQuotation } from '@/contexts/QuotationContext';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuotationStep3Screen() {
  const router = useRouter();
  const { toast, hideToast, showError, showSuccess } = useToast();
  const { 
    client, 
    selectedAddressId, 
    items, 
    getSubtotal, 
    getTotal, 
    clearQuotation, 
    setStep 
  } = useQuotation();

  const [loading, setLoading] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [address, setAddress] = useState<any>(null);

  // Verificar se o cliente e itens estão selecionados
  useEffect(() => {
    if (!client || !selectedAddressId) {
      // Redirecionar para o passo 1 se não houver cliente selecionado
      router.replace('/budgets/steps/step1');
    } else if (items.length === 0) {
      // Redirecionar para o passo 2 se não houver itens
      router.replace('/budgets/steps/step2');
    }
  }, [client, selectedAddressId, items]);

  // Buscar endereço selecionado
  useEffect(() => {
    if (client && selectedAddressId) {
      fetchAddress();
    }
  }, [client, selectedAddressId]);

  const fetchAddress = async () => {
    try {
      const { data } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('id', selectedAddressId)
        .single();

      setAddress(data);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    }
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const getDiscountValue = () => {
    return parseFloat(discount.replace(',', '.')) || 0;
  };

  const getDeliveryFeeValue = () => {
    return parseFloat(deliveryFee.replace(',', '.')) || 0;
  };

  const getFinalTotal = () => {
    return getSubtotal() - getDiscountValue() + getDeliveryFeeValue();
  };

  const handleSaveQuotation = async () => {
    if (!client || !selectedAddressId || items.length === 0) {
      showError('Dados incompletos para salvar o orçamento');
      return;
    }

    setLoading(true);
    try {
      // Inserir orçamento
      const { data: quotation, error } = await supabase
        .from('quotations')
        .insert({
          client_id: client.id,
          address_id: selectedAddressId,
          subtotal: getSubtotal(),
          discount: getDiscountValue(),
          delivery_fee: getDeliveryFeeValue(),
          total: getFinalTotal(),
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      // Inserir itens do orçamento
      const quotationItems = items.map(item => ({
        quotation_id: quotation.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_type: item.product_type,
        unit_type: item.unit_type,
        quantity: item.quantity,
        weight: item.weight,
        flavors: item.flavors,
        unit_price: item.unit_price,
        total_price: item.total_price,
        combo_selection: item.combo_selection ? JSON.stringify(item.combo_selection) : null,
        builder_options: item.builder_options ? JSON.stringify(item.builder_options) : null
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItems);

      if (itemsError) throw itemsError;

      showSuccess('Orçamento salvo com sucesso!');
      
      // Limpar o orçamento e voltar para a lista
      clearQuotation();
      router.replace('/budgets');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      showError('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQuotation = async () => {
    if (!client || !address || items.length === 0) {
      showError('Dados incompletos para compartilhar o orçamento');
      return;
    }

    setSharingLoading(true);
    try {
      // Gerar HTML para o PDF
      const html = generateQuotationHTML();
      
      // Criar PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showError('Compartilhamento não disponível neste dispositivo');
        return;
      }

      // Compartilhar o arquivo
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Orçamento - ${client.name}`,
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Erro ao compartilhar orçamento:', error);
      showError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setSharingLoading(false);
    }
  };

  const generateQuotationHTML = () => {
    // Formatar data atual
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    // Gerar linhas de itens
    const itemsHTML = items.map(item => {
      const itemTotal = item.total_price;
      const description = item.flavors ? `Sabores: ${item.flavors}` : '';
      
      return `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.unit_type === 'kg' ? `${item.weight} kg` : `${item.quantity} ${item.unit_type === 'unit' ? 'un' : 'cx'}`}</td>
          <td>R$ ${item.unit_price.toFixed(2)}</td>
          <td>R$ ${itemTotal.toFixed(2)}</td>
        </tr>
        ${description ? `<tr><td colspan="4" class="description">${description}</td></tr>` : ''}
      `;
    }).join('');

    // Gerar HTML completo
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Orçamento</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #8B5CF6;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            margin: 5px 0;
          }
          .client-info {
            margin-bottom: 20px;
          }
          .client-info h2 {
            color: #8B5CF6;
            font-size: 18px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #8B5CF6;
            color: white;
            text-align: left;
            padding: 10px;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          td.description {
            font-style: italic;
            color: #666;
            font-size: 12px;
            padding-top: 0;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .totals p {
            margin: 5px 0;
          }
          .total {
            font-weight: bold;
            font-size: 18px;
            color: #8B5CF6;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Orçamento</h1>
          <p>Data: ${formattedDate}</p>
        </div>
        
        <div class="client-info">
          <h2>Informações do Cliente</h2>
          <p><strong>Nome:</strong> ${client.name}</p>
          <p><strong>Telefone:</strong> ${client.whatsapp || 'Não informado'}</p>
          <p><strong>Endereço:</strong> ${address.street}, ${address.house_number} ${address.complement ? ` - ${address.complement}` : ''} - ${address.city}/${address.state}</p>
        </div>
        
        <h2>Itens do Orçamento</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd/Peso</th>
              <th>Valor Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Subtotal:</strong> R$ ${getSubtotal().toFixed(2)}</p>
          <p><strong>Desconto:</strong> R$ ${getDiscountValue().toFixed(2)}</p>
          <p><strong>Taxa de Entrega:</strong> R$ ${getDeliveryFeeValue().toFixed(2)}</p>
          <p class="total"><strong>Total:</strong> R$ ${getFinalTotal().toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>Este orçamento é válido por 7 dias.</p>
          <p>Obrigado pela preferência!</p>
        </div>
      </body>
      </html>
    `;
  };

  if (!client || !selectedAddressId || items.length === 0) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
        <Header title="Orçamento - Passo 3/3" showBackButton onBackPress={() => router.back()} />
      </SafeAreaView>
      
      <View style={styles.content}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <View style={styles.breadcrumbStep}>
            <View style={styles.breadcrumbDot}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.breadcrumbText}>Cliente</Text>
          </View>
          <View style={styles.breadcrumbLine} />
          <View style={styles.breadcrumbStep}>
            <View style={styles.breadcrumbDot}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.breadcrumbText}>Produtos</Text>
          </View>
          <View style={styles.breadcrumbLine} />
          <View style={styles.breadcrumbStep}>
            <View style={[styles.breadcrumbDot, styles.breadcrumbActive]}>
              <Text style={styles.breadcrumbNumber}>3</Text>
            </View>
            <Text style={[styles.breadcrumbText, styles.breadcrumbActiveText]}>Resumo</Text>
          </View>
        </View>

        {/* Cliente selecionado */}
        <View style={styles.clientBox}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            {address && (
              <Text style={styles.clientAddress} numberOfLines={1}>
                {`${address.street}, ${address.house_number} ${address.complement ? ` - ${address.complement}` : ''} - ${address.city}/${address.state}`}
              </Text>
            )}
          </View>
        </View>

        {/* Lista de itens */}
        <Text style={styles.sectionTitle}>Itens do Orçamento</Text>
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.product_id}-${index}`}
          style={styles.itemsList}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.itemCard}
              onPress={() => toggleItemExpand(`${item.product_id}-${index}`)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQuantity}>
                    {item.unit_type === 'kg' 
                      ? `${item.weight} kg` 
                      : `${item.quantity} ${item.unit_type === 'unit' ? 'un' : 'cx'}`}
                  </Text>
                </View>
                <View style={styles.itemPrices}>
                  <Text style={styles.itemUnitPrice}>
                    {formatCurrency(item.unit_price)}
                  </Text>
                  <Text style={styles.itemTotalPrice}>
                    {formatCurrency(item.total_price)}
                  </Text>
                </View>
              </View>
              
              {expandedItems[`${item.product_id}-${index}`] && item.flavors && (
                <View style={styles.itemDetails}>
                  <Text style={styles.itemFlavors}>Sabores: {item.flavors}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum item adicionado</Text>
          }
        />

        {/* Campos de entrada */}
        <View style={styles.inputsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Desconto (R$):</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={discount}
              onChangeText={setDiscount}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Taxa de Entrega (R$):</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
            />
          </View>
        </View>

        {/* Totais */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(getSubtotal())}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Desconto:</Text>
            <Text style={styles.totalValue}>- {formatCurrency(getDiscountValue())}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxa de Entrega:</Text>
            <Text style={styles.totalValue}>+ {formatCurrency(getDeliveryFeeValue())}</Text>
          </View>
          
          <View style={[styles.totalRow, styles.finalTotalRow]}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalValue}>{formatCurrency(getFinalTotal())}</Text>
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          <Button
            title="Salvar Orçamento"
            onPress={handleSaveQuotation}
            disabled={loading}
            loading={loading}
            variant="primary"
            size="large"
            style={styles.saveButton}
          />
          
          <Button
            title="Compartilhar"
            onPress={handleShareQuotation}
            disabled={sharingLoading}
            loading={sharingLoading}
            variant="secondary"
            size="large"
            style={styles.shareButton}
            icon={<Ionicons name="share-outline" size={20} color="#fff" />}
          />
        </View>
      </View>

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
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  breadcrumbStep: {
    alignItems: 'center',
  },
  breadcrumbDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  breadcrumbActive: {
    backgroundColor: Theme.colors.primary,
  },
  breadcrumbNumber: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  breadcrumbText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  breadcrumbActiveText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  breadcrumbLine: {
    flex: 1,
    height: 2,
    backgroundColor: Theme.colors.border,
    marginHorizontal: 4,
  },
  clientBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  clientAddress: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: { 
    color: Theme.colors.text, 
    fontWeight: '700', 
    fontSize: 18,
    marginTop: 8, 
    marginBottom: 12 
  },
  itemsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  itemQuantity: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  itemPrices: {
    alignItems: 'flex-end',
  },
  itemUnitPrice: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  itemTotalPrice: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  itemDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  itemFlavors: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  inputsContainer: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: Theme.colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Theme.colors.text,
    backgroundColor: '#fff',
  },
  totalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: Theme.colors.text,
    fontSize: 16,
  },
  totalValue: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  finalTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  finalTotalLabel: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  finalTotalValue: {
    color: Theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  actionsContainer: {
    marginTop: 'auto',
    gap: 12,
  },
  saveButton: {
    width: '100%',
  },
  shareButton: {
    width: '100%',
  },
});