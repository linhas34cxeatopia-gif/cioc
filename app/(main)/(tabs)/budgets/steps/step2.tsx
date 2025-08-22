import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useQuotation } from '@/contexts/QuotationContext';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  type: 'SIMPLE' | 'COMBO' | 'BUILDER';
  unit_type: 'kg' | 'unit' | 'box';
  category_id: string;
  visible_in_quotation: boolean;
}

export default function QuotationStep2Screen() {
  const router = useRouter();
  const { toast, hideToast, showError, showSuccess } = useToast();
  const { client, selectedAddressId, items, addItem, setStep } = useQuotation();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [builderProducts, setBuilderProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Record<string, Product[]>>({});

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('1.0');
  const [flavors, setFlavors] = useState('');

  // Carregar categorias e produtos
  useEffect(() => {
    loadCatalog();
  }, []);

  // Filtrar produtos quando a busca mudar
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(productsByCategory);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered: Record<string, Product[]> = {};

    Object.keys(productsByCategory).forEach(categoryId => {
      const products = productsByCategory[categoryId].filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );

      if (products.length > 0) {
        filtered[categoryId] = products;
      }
    });

    setFilteredProducts(filtered);
  }, [searchQuery, productsByCategory]);

  // Verificar se o cliente está selecionado
  useEffect(() => {
    if (!client || !selectedAddressId) {
      // Redirecionar para o passo 1 se não houver cliente selecionado
      router.replace('/budgets/steps/step1');
    }
  }, [client, selectedAddressId]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData as Category[]);
      }

      // Carregar produtos
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('visible_in_quotation', true)
        .order('name');

      if (productsData) {
        const productsByCat: Record<string, Product[]> = {};
        const builders: Product[] = [];

        (productsData as Product[]).forEach(product => {
          if (product.type === 'BUILDER') {
            builders.push(product);
          } else {
            if (!productsByCat[product.category_id]) {
              productsByCat[product.category_id] = [];
            }
            productsByCat[product.category_id].push(product);
          }
        });

        setProductsByCategory(productsByCat);
        setFilteredProducts(productsByCat);
        setBuilderProducts(builders);
      }
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      showError('Erro ao carregar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product: Product) => {
    // Adicionar diretamente para produtos simples
    if (product.unit_type !== 'kg') {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        unit_type: product.unit_type,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      });
      showSuccess(`${product.name} adicionado ao orçamento`);
    } else {
      // Abrir modal para produtos que precisam de peso/quantidade
      setSelectedProduct(product);
      setQuantity('1');
      setWeight('1.0');
      setFlavors('');
      setItemModalVisible(true);
    }
  };

  const handleLongPressItem = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setWeight('1.0');
    setFlavors('');
    setItemModalVisible(true);
  };

  const handleAddItemFromModal = () => {
    if (!selectedProduct) return;

    const qty = parseInt(quantity) || 1;
    const wgt = parseFloat(weight.replace(',', '.')) || 1.0;

    let totalPrice = 0;
    if (selectedProduct.unit_type === 'kg') {
      totalPrice = selectedProduct.price * wgt;
    } else {
      totalPrice = selectedProduct.price * qty;
    }

    addItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_type: selectedProduct.type,
      unit_type: selectedProduct.unit_type,
      quantity: selectedProduct.unit_type === 'kg' ? 1 : qty,
      weight: selectedProduct.unit_type === 'kg' ? wgt : undefined,
      flavors: flavors.trim() || undefined,
      unit_price: selectedProduct.price,
      total_price: totalPrice
    });

    setItemModalVisible(false);
    showSuccess(`${selectedProduct.name} adicionado ao orçamento`);
  };

  const getItemCount = (productId: string) => {
    return items.filter(item => item.product_id === productId).reduce(
      (total, item) => total + (item.quantity || 0), 
      0
    );
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const handleNext = () => {
    if (items.length === 0) {
      showError('Adicione pelo menos um produto ao orçamento');
      return;
    }

    setStep(3);
    router.push('/budgets/steps/step3');
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const itemCount = getItemCount(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleAddItem(item)}
        onLongPress={() => handleLongPressItem(item)}
        delayLongPress={500}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={24} color={Theme.colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.productPrice}>
            {item.unit_type === 'kg' 
              ? `R$ ${item.price.toFixed(2)}/kg` 
              : `R$ ${item.price.toFixed(2)}`}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddItem(item)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          {itemCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = ({ item }: { item: Category }) => {
    const products = filteredProducts[item.id] || [];
    if (products.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{item.name}</Text>
        <FlashList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          horizontal={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderBuilderSection = () => {
    const filteredBuilders = searchQuery.trim() 
      ? builderProducts.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : builderProducts;

    if (filteredBuilders.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>Monte o Seu</Text>
        <FlashList
          data={filteredBuilders}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          horizontal={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  if (!client || !selectedAddressId) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
        <Header title="Orçamento - Passo 2/3" showBackButton onBackPress={() => router.back()} />
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
            <View style={[styles.breadcrumbDot, styles.breadcrumbActive]}>
              <Text style={styles.breadcrumbNumber}>2</Text>
            </View>
            <Text style={[styles.breadcrumbText, styles.breadcrumbActiveText]}>Produtos</Text>
          </View>
          <View style={styles.breadcrumbLine} />
          <View style={styles.breadcrumbStep}>
            <View style={[styles.breadcrumbDot, styles.breadcrumbInactive]}>
              <Text style={styles.breadcrumbNumber}>3</Text>
            </View>
            <Text style={styles.breadcrumbText}>Resumo</Text>
          </View>
        </View>

        {/* Cliente selecionado */}
        <View style={styles.clientBox}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientAddress} numberOfLines={1}>
              {/* Aqui precisaríamos buscar o endereço completo pelo ID */}
              Endereço selecionado
            </Text>
          </View>
        </View>

        {/* Busca de produtos */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Theme.colors.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos"
            placeholderTextColor={Theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Carregando produtos...</Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <FlashList
              data={categories}
              renderItem={renderCategorySection}
              keyExtractor={(item) => item.id}
              estimatedItemSize={200}
              ListHeaderComponent={renderBuilderSection}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </View>
        )}

        {/* Botão flutuante do carrinho */}
        {items.length > 0 && (
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={handleNext}
          >
            <Ionicons name="cart" size={24} color="#fff" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Botão de avançar */}
        <View style={styles.footer}>
          <Button
            title="Avançar"
            onPress={handleNext}
            disabled={items.length === 0}
            variant="primary"
            size="large"
            style={styles.nextButton}
          />
        </View>
      </View>

      {/* Modal para adicionar item com quantidade/peso */}
      <Modal
        visible={itemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduct?.name}
              </Text>
              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {selectedProduct?.unit_type === 'kg' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Peso (kg):</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantidade:</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sabores (opcional):</Text>
                <TextInput
                  style={styles.input}
                  value={flavors}
                  onChangeText={setFlavors}
                  placeholder="Ex: Chocolate, Morango"
                  placeholderTextColor={Theme.colors.textSecondary}
                />
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {selectedProduct ? `R$ ${(
                    selectedProduct.price * 
                    (selectedProduct.unit_type === 'kg' 
                      ? parseFloat(weight.replace(',', '.')) || 0 
                      : parseInt(quantity) || 0)
                  ).toFixed(2)}` : 'R$ 0,00'}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setItemModalVisible(false)}
                variant="outline"
                size="medium"
                style={{ flex: 1 }}
              />
              <Button
                title="Adicionar"
                onPress={handleAddItemFromModal}
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
  breadcrumbInactive: {
    backgroundColor: Theme.colors.border,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Theme.colors.backgroundSecondary,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    marginTop: 12,
  },
  productsContainer: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Theme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  productDescription: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Theme.colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cartButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.medium,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Theme.colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
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
    flex: 1,
  },
  modalContent: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  totalLabel: {
    color: Theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  totalValue: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});