import { createClient } from '@supabase/supabase-js';


// Configurações do Supabase
const supabaseUrl = 'https://wvpjlcnrffhsikhwvtfr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGpsY25yZmZoc2lraHd2dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDg4MzUsImV4cCI6MjA3MDUyNDgzNX0.LDL0iGWAvmL3jKG6pYwcIyGKBNoQfEaRQ9vQLnvI-xw';

// Cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações de ambiente
export const SUPABASE_CONFIG = {
  URL: supabaseUrl,
  ANON_KEY: supabaseAnonKey,
  TABLES: {
    USERS: 'users',
    CLIENTS: 'clients',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    BUDGETS: 'budgets',
  },
  AUTH: {
    // Configurações de autenticação
    AUTO_REFRESH_TOKEN: true,
    PERSIST_SESSION: true,
    DETECT_SESSION_IN_URL: false,
  },
};

// Tipos de dados para o Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'vendas' | 'cozinha';
          approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'vendas' | 'cozinha';
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'vendas' | 'cozinha';
          approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string;
          whatsapp: string;
          addresses: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          whatsapp: string;
          addresses?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          whatsapp?: string;
          addresses?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: 'bolo' | 'doce' | 'outro';
          type: 'kg' | 'unidade' | 'caixa';
          base_price: number;
          attributes: any;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'bolo' | 'doce' | 'outro';
          type: 'kg' | 'unidade' | 'caixa';
          base_price: number;
          attributes?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'bolo' | 'doce' | 'outro';
          type?: 'kg' | 'unidade' | 'caixa';
          base_price?: number;
          attributes?: any;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
