import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, SelectedCustomization } from '../types';

export interface CartItem {
  cartId: string; // unique key in cart
  itemId: string;
  name: string;
  category: string;
  canteenId: string;
  basePrice: number;
  quantity: number;
  prepTimeMinutes: number;
  imageUrl?: string;
  selectedCustomizations: SelectedCustomization[];
  unitPrice: number;
  lineTotal: number;
}

interface CartContextType {
  items: CartItem[];
  cartCanteenId: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (
    item: MenuItem,
    quantity: number,
    selectedCustomizations: SelectedCustomization[]
  ) => { success: boolean; requiresReset?: boolean; previousCanteenName?: string };
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('canteeniq_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('canteeniq_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [items]);

  const cartCanteenId = items.length > 0 ? items[0].canteenId : null;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const addItem = (
    item: MenuItem,
    quantity: number,
    selectedCustomizations: SelectedCustomization[]
  ): { success: boolean; requiresReset?: boolean; previousCanteenName?: string } => {
    // Check multi-canteen conflict: a single order can only belong to one canteen counter
    if (cartCanteenId && cartCanteenId !== item.canteenId) {
      return {
        success: false,
        requiresReset: true,
        previousCanteenName: cartCanteenId === 'canteen_a' ? 'Harvest Campus Grill' : 'Banyan Court Canteen',
      };
    }

    const customDeltas = selectedCustomizations.reduce((acc, c) => acc + c.priceDelta, 0);
    const unitPrice = item.basePrice + customDeltas;
    const lineTotal = unitPrice * quantity;

    const cartId = `${item.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newItem: CartItem = {
      cartId,
      itemId: item.id,
      name: item.name,
      category: item.category,
      canteenId: item.canteenId,
      basePrice: item.basePrice,
      quantity,
      prepTimeMinutes: item.prepTimeMinutes,
      imageUrl: item.imageUrl,
      selectedCustomizations,
      unitPrice,
      lineTotal,
    };

    setItems((prev) => [...prev, newItem]);
    return { success: true };
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        cartCanteenId,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
