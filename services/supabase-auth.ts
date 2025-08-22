import { supabase } from '../config/supabase';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'vendas' | 'cozinha';
}

export class SupabaseAuthService {
  // Login do usuário
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
        };
      }

      // Buscar dados adicionais do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          error: 'Erro ao buscar dados do usuário',
        };
      }

      // Verificar se o usuário foi aprovado
      if (!userData.approved) {
        return {
          success: false,
          error: 'Conta aguardando aprovação do administrador',
        };
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        approved: userData.approved,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      };

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Registro de novo usuário
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Erro ao criar usuário',
        };
      }

      // Inserir dados adicionais na tabela users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          approved: false, // Usuário precisa ser aprovado pelo admin
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        return {
          success: false,
          error: 'Erro ao salvar dados do usuário',
        };
      }

      return {
        success: true,
        data: {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          approved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Logout do usuário
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Verificar status da autenticação
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      // Buscar dados adicionais do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          error: 'Erro ao buscar dados do usuário',
        };
      }

      const userInfo: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        approved: userData.approved,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      };

      return {
        success: true,
        data: userInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  // Atualizar aprovação do usuário (apenas admin)
  async updateUserApproval(userId: string, approved: boolean): Promise<AuthResponse> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          approved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
