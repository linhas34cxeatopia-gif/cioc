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
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product { id: string; code?: string; name: string; category: string; base_price: number; image_url?: string; attributes?: any, category_id?: string | null }

export default function ProductsListScreen() {
  const router = useRouter();
  const { toast, hideToast } = useToast();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [top3Ids, setTop3Ids] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: items, error: itemsErr }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('budget_items').select('product_id'),
      supabase.from('categories').select('id, name').order('name')
    ]);
    if (!error) setProducts((data as any) || []);
    setCategories((cats as any) || []);
    // calcular top 3 mais vendidos pelo total de ocorrências em budget_items
    if (!itemsErr) {
      const counts: Record<string, number> = {};
      (items || []).forEach((i: any) => { if (i.product_id) counts[i.product_id] = (counts[i.product_id] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
      setTop3Ids(sorted);
    } else {
      setTop3Ids([]);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    const q = search.toLowerCase();
    const byText = (p: Product) => (p.code || '').toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    const byCats = (p: Product) => selectedCategoryIds.length === 0 || selectedCategoryIds.includes(p.category_id || '');
    setFiltered(products.filter(p => byText(p) && byCats(p)));
  }, [search, products, selectedCategoryIds]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const countByCategory = (id: string) => products.filter(p => (p.category_id || '') === id).length;

  const renderItem = ({ item }: { item: Product }) => {
    const desc = item.attributes?.descricao || '';
    const isTop = top3Ids.includes(item.id);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/(main)/(tabs)/products/${item.id}` as any)}>
        {item.image_url ? (
          <Image source={{ uri: `${item.image_url}?id=${item.id}` }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image" size={28} color={Theme.colors.textSecondary} />
          </View>
        )}
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
            {!!desc && <Text style={styles.desc} numberOfLines={2}>{desc}</Text>}
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.price}>R$ {Number(item.base_price).toFixed(2)}</Text>
            {isTop && (
              <View style={styles.badge}>
                <Ionicons name="flame" size={12} color="#fff" />
                <Text style={styles.badgeText}>Mais vendido</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Produtos" onMenuPress={() => setSideMenuVisible(true)} notificationsCount={3} />
        <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Produtos" onMenuPress={() => setSideMenuVisible(true)} notificationsCount={3} />
      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Theme.colors.textSecondary} />
          <TextInput style={styles.searchInput} placeholder="Pesquisar por código ou nome..." placeholderTextColor={Theme.colors.textSecondary} value={search} onChangeText={setSearch} />
        </View>

        {/* Filtro por categoria (rolagem horizontal) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <TouchableOpacity style={[styles.catChip, selectedCategoryIds.length === 0 && styles.catChipActive]} onPress={() => setSelectedCategoryIds([])}>
            <Text style={[styles.catChipText, selectedCategoryIds.length === 0 && styles.catChipTextActive]}>Todas</Text>
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{products.length}</Text></View>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity key={c.id} style={[styles.catChip, selectedCategoryIds.includes(c.id) && styles.catChipActive]} onPress={() => toggleCategory(c.id)}>
              <Text style={[styles.catChipText, selectedCategoryIds.includes(c.id) && styles.catChipTextActive]}>{c.name}</Text>
              <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{countByCategory(c.id)}</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(main)/(tabs)/products/new' as any)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <SideMenu visible={sideMenuVisible} onClose={() => setSideMenuVisible(false)} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.backgroundSecondary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: Theme.colors.text, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  image: { width: '100%', height: 140 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.backgroundSecondary },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  desc: { marginTop: 4, color: Theme.colors.textSecondary },
  priceBox: { alignItems: 'flex-end', minWidth: 100 },
  price: { fontWeight: '700', color: Theme.colors.text },
  badge: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e65100', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 96, right: 20, width: Theme.layout.fabSize, height: Theme.layout.fabSize, borderRadius: Theme.layout.fabSize / 2, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.shadows.xl },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2, marginBottom: 10, paddingRight: 6 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff' },
  catChipActive: { borderColor: Theme.colors.primary, backgroundColor: '#fff7e6' },
  catChipText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  catChipTextActive: { color: Theme.colors.primary },
  badgeCount: { backgroundColor: Theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  badgeCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});