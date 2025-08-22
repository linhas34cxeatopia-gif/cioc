import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { supabase } from '@/config/supabase';
import { Theme } from '@/constants/Theme';
import { useToast } from '@/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BuilderTemplate { id: string; name: string; base_price: number; type?: string; image_url?: string | null }

export default function BuilderTemplatesScreen() {
  const router = useRouter();
  const { toast, hideToast, showError, showSuccess } = useToast();
  const [items, setItems] = useState<BuilderTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, type, image_url')
        .eq('product_type', 'BUILDER')
        .order('name');
      if (error) throw error;
      setItems((data as any) || []);
    } catch (e: any) {
      showError(e.message || 'Falha ao carregar');
    } finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const remove = (t: BuilderTemplate) => {
    Alert.alert('Confirmar exclusão', `Excluir '${t.name}'?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('products').delete().eq('id', t.id);
          if (error) throw error;
          showSuccess('Excluído com sucesso');
          load();
        } catch (e: any) {
          showError(e.message || 'Falha ao excluir');
        }
      } }
    ]);
  };

  const renderItem = ({ item }: { item: BuilderTemplate }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>Preço Base: R$ {Number(item.base_price || 0).toFixed(2)}{item.type === 'kg' ? '/kg' : '/unid.'}</Text>
      </View>
      <TouchableOpacity style={[styles.smallBtn, { backgroundColor: Theme.colors.primary }]} onPress={() => router.push(`/ (main)/(tabs)/settings/builder-edit?id=${item.id}`.replace(' ', '') as any)}>
        <Ionicons name="pencil" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => remove(item)}>
        <Ionicons name="trash" size={16} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Produtos Montáveis" showBackButton onBackPress={() => router.back()} />
      <View style={{ padding: 16 }}>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ color: Theme.colors.textSecondary }}>Nenhum template criado</Text>}
          refreshing={loading}
          onRefresh={load}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(main)/(tabs)/settings/builder-edit' as any)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  name: { color: Theme.colors.text, fontWeight: '700' },
  sub: { color: Theme.colors.textSecondary },
  smallBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  deleteBtn: { borderWidth: 1, borderColor: '#d32f2f', backgroundColor: 'transparent' },
  fab: { position: 'absolute', right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
});
