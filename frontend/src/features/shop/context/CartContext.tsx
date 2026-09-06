import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductType } from '../../../types/api';

export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  destinationConfigured: boolean;
  destinationType: string;
  destinationUrl?: string;
  customizationLogoUrl?: string | null;
  customizationColor?: string | null;
  customizationTemplate?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateDestination: (
    id: string,
    configured: boolean,
    destinationType: string,
    destinationUrl?: string
  ) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'tapnow_shopping_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    const id = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setItems((prev) => [...prev, { ...newItem, id }]);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateDestination = (
    id: string,
    configured: boolean,
    destinationType: string,
    destinationUrl?: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              destinationConfigured: configured,
              destinationType,
              destinationUrl: configured ? destinationUrl : undefined,
            }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateDestination,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
