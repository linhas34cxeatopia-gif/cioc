import { supabase } from '../config/supabase';
import { Client, Product } from '../types';

export interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SupabaseDataService {
  // ===== CLIENTES =====
  
  // Buscar todos os clientes
  async getClients(): Promise<DataResponse<Client[]>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const clients: Client[] = data.map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        whatsapp: client.whatsapp,
        addresses: client.addresses || [],
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      }));

      return {
        success: true,
        data: clients,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Criar novo cliente
  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          phone: clientData.phone,
          whatsapp: clientData.whatsapp,
          addresses: clientData.addresses || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const client: Client = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        addresses: data.addresses || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: client,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Atualizar cliente
  async updateClient(clientId: string, clientData: Partial<Client>): Promise<DataResponse<Client>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (clientData.name) updateData.name = clientData.name;
      if (clientData.phone) updateData.phone = clientData.phone;
      if (clientData.whatsapp) updateData.whatsapp = clientData.whatsapp;
      if (clientData.addresses) updateData.addresses = clientData.addresses;

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const client: Client = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        addresses: data.addresses || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: client,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Deletar cliente
  async deleteClient(clientId: string): Promise<DataResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // ===== PRODUTOS =====
  
  // Buscar todos os produtos
  async getProducts(): Promise<DataResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const products: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        type: product.type,
        basePrice: product.base_price,
        attributes: product.attributes || {},
        active: product.active,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));

      return {
        success: true,
        data: products,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Criar novo produto
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          category: productData.category,
          type: productData.type,
          base_price: productData.basePrice,
          attributes: productData.attributes || {},
          active: productData.active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const product: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        type: data.type,
        basePrice: data.base_price,
        attributes: data.attributes || {},
        active: data.active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Atualizar produto
  async updateProduct(productId: string, productData: Partial<Product>): Promise<DataResponse<Product>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (productData.name) updateData.name = productData.name;
      if (productData.category) updateData.category = productData.category;
      if (productData.type) updateData.type = productData.type;
      if (productData.basePrice !== undefined) updateData.base_price = productData.basePrice;
      if (productData.attributes) updateData.attributes = productData.attributes;
      if (productData.active !== undefined) updateData.active = productData.active;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const product: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        type: data.type,
        basePrice: data.base_price,
        attributes: data.attributes || {},
        active: data.active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Deletar produto (soft delete)
  async deleteProduct(productId: string): Promise<DataResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }
}

export const supabaseDataService = new SupabaseDataService();
