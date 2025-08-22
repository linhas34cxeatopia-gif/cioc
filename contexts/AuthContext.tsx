import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { supabaseAuthService } from '../services/supabase-auth';
import { AuthState, LoginCredentials, RegisterData, User } from '../types';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await supabaseAuthService.login(credentials);

      if (response.success && response.data) {
        const user = response.data;
        
        if (!user.approved) {
          dispatch({ type: 'SET_ERROR', payload: 'Usuário aguardando aprovação do administrador' });
          return false;
        }

        await AsyncStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'SET_USER', payload: user });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Credenciais inválidas' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao fazer login' });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await supabaseAuthService.register(userData);

      if (response.success) {
        dispatch({ type: 'SET_ERROR', payload: 'Conta criada com sucesso! Aguarde a aprovação do administrador.' });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Erro ao criar conta' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar conta' });
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!state.user) return;

      const updatedUser = { ...state.user, ...updates };
      
      // Atualizar no AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Atualizar no estado
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user: User = JSON.parse(userData);
        if (user.approved) {
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          await AsyncStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
