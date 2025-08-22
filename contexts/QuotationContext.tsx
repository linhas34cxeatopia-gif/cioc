import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Client, Address } from '../types';

interface Product { 
  id: string; 
  name: string; 
  image_url?: string | null; 
  attributes?: any; 
  base_price: number; 
  type: 'kg' | 'unidade' | 'caixa'; 
  category_id?: string | null;
  product_type: 'SIMPLES' | 'COMBO' | 'BUILDER';
  combo_capacity?: number;
}

interface QuotationItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes?: any;
}

interface QuotationState {
  client: Client | null;
  selectedAddressId: string | null;
  items: QuotationItem[];
  deliveryFee: string;
  discount: string;
  currentStep: number;
  isLoading: boolean;
  error: string | null;
}

type QuotationAction =
  | { type: 'SET_CLIENT'; payload: Client }
  | { type: 'SET_ADDRESS'; payload: string }
  | { type: 'ADD_ITEM'; payload: QuotationItem }
  | { type: 'UPDATE_ITEM'; payload: { index: number; item: QuotationItem } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'SET_DELIVERY_FEE'; payload: string }
  | { type: 'SET_DISCOUNT'; payload: string }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET_QUOTATION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: QuotationState = {
  client: null,
  selectedAddressId: null,
  items: [],
  deliveryFee: '0',
  discount: '0',
  currentStep: 1,
  isLoading: false,
  error: null,
};

const quotationReducer = (state: QuotationState, action: QuotationAction): QuotationState => {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, client: action.payload };
    case 'SET_ADDRESS':
      return { ...state, selectedAddressId: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item, index) =>
          index === action.payload.index ? action.payload.item : item
        ),
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((_, index) => index !== action.payload),
      };
    case 'SET_DELIVERY_FEE':
      return { ...state, deliveryFee: action.payload };
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET_QUOTATION':
      return initialState;
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface QuotationContextType extends QuotationState {
  setClient: (client: Client) => void;
  setAddress: (addressId: string) => void;
  addItem: (item: QuotationItem) => void;
  updateItem: (index: number, item: QuotationItem) => void;
  removeItem: (index: number) => void;
  setDeliveryFee: (fee: string) => void;
  setDiscount: (discount: string) => void;
  setStep: (step: number) => void;
  resetQuotation: () => void;
  clearError: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const useQuotation = () => {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotation must be used within a QuotationProvider');
  }
  return context;
};

export const QuotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quotationReducer, initialState);

  // Persistir estado no AsyncStorage
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('quotation_state', JSON.stringify(state));
      } catch (error) {
        console.error('Erro ao salvar estado do orçamento:', error);
      }
    };

    saveState();
  }, [state]);

  // Carregar estado do AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('quotation_state');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Restaurar cada propriedade individualmente para evitar problemas com o tipo
          if (parsedState.client) dispatch({ type: 'SET_CLIENT', payload: parsedState.client });
          if (parsedState.selectedAddressId) dispatch({ type: 'SET_ADDRESS', payload: parsedState.selectedAddressId });
          if (parsedState.items && Array.isArray(parsedState.items)) {
            parsedState.items.forEach(item => dispatch({ type: 'ADD_ITEM', payload: item }));
          }
          if (parsedState.deliveryFee) dispatch({ type: 'SET_DELIVERY_FEE', payload: parsedState.deliveryFee });
          if (parsedState.discount) dispatch({ type: 'SET_DISCOUNT', payload: parsedState.discount });
          if (parsedState.currentStep) dispatch({ type: 'SET_STEP', payload: parsedState.currentStep });
        }
      } catch (error) {
        console.error('Erro ao carregar estado do orçamento:', error);
      }
    };

    loadState();
  }, []);

  const setClient = (client: Client) => {
    dispatch({ type: 'SET_CLIENT', payload: client });
  };

  const setAddress = (addressId: string) => {
    dispatch({ type: 'SET_ADDRESS', payload: addressId });
  };

  const addItem = (item: QuotationItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const updateItem = (index: number, item: QuotationItem) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { index, item } });
  };

  const removeItem = (index: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: index });
  };

  const setDeliveryFee = (fee: string) => {
    dispatch({ type: 'SET_DELIVERY_FEE', payload: fee });
  };

  const setDiscount = (discount: string) => {
    dispatch({ type: 'SET_DISCOUNT', payload: discount });
  };

  const setStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const resetQuotation = () => {
    dispatch({ type: 'RESET_QUOTATION' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getSubtotal = () => {
    return state.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const deliveryFee = Number(state.deliveryFee.replace(',', '.')) || 0;
    const discount = Number(state.discount.replace(',', '.')) || 0;
    return subtotal + deliveryFee - discount;
  };

  const value: QuotationContextType = {
    ...state,
    setClient,
    setAddress,
    addItem,
    updateItem,
    removeItem,
    setDeliveryFee,
    setDiscount,
    setStep,
    resetQuotation,
    clearError,
    getSubtotal,
    getTotal,
  };

  return <QuotationContext.Provider value={value}>{children}</QuotationContext.Provider>;
};