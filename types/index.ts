export interface User {
  id: string;
  email: string;
  name: string;
  role: 'vendas' | 'cozinha' | 'administrador';
  approved: boolean;
  notify_new_budget: boolean;
  notify_order_confirmed: boolean;
  notify_cake_ready: boolean;
  notify_out_for_delivery: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'bolo' | 'doce' | 'sazonal';
  type: 'bolo' | 'caixa' | 'unidade';
  
  // Para bolos
  cakeDetails?: {
    massa: string;
    recheio: string;
    cobertura: string;
    cascaLateral: string;
    sizes: string[];
    pricePerKg: number;
  };
  
  // Para doces
  sweetDetails?: {
    sabores: string[];
    pricePerUnit: number;
    quantityPerBox?: number;
  };
  
  // Para produtos sazonais
  seasonalDetails?: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
