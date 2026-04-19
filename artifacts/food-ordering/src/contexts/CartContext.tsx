import { createContext, useContext, useEffect, useState } from "react";

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  category_en: string;
  category_ar: string;
  description_en: string;
  description_ar: string;
  popular?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  restaurantId: string;
  branchId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, restaurantId: string, branchId: string) => "added" | "confirm_clear";
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  selectedRestaurantId: string | null;
  selectedBranchId: string | null;
  pendingAdd: { item: MenuItem; restaurantId: string; branchId: string } | null;
  confirmClearAndAdd: () => void;
  cancelPendingAdd: () => void;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => "added",
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
  selectedRestaurantId: null,
  selectedBranchId: null,
  pendingAdd: null,
  confirmClearAndAdd: () => {},
  cancelPendingAdd: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });
  const [pendingAdd, setPendingAdd] = useState<{ item: MenuItem; restaurantId: string; branchId: string } | null>(null);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const selectedRestaurantId = cartItems.length > 0 ? cartItems[0].restaurantId : null;
  const selectedBranchId = cartItems.length > 0 ? cartItems[0].branchId : null;

  const addToCart = (item: MenuItem, restaurantId: string, branchId: string): "added" | "confirm_clear" => {
    if (cartItems.length > 0 && (cartItems[0].restaurantId !== restaurantId || cartItems[0].branchId !== branchId)) {
      setPendingAdd({ item, restaurantId, branchId });
      return "confirm_clear";
    }
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) => ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { item, quantity: 1, restaurantId, branchId }];
    });
    return "added";
  };

  const confirmClearAndAdd = () => {
    if (!pendingAdd) return;
    const { item, restaurantId, branchId } = pendingAdd;
    setCartItems([{ item, quantity: 1, restaurantId, branchId }]);
    setPendingAdd(null);
  };

  const cancelPendingAdd = () => setPendingAdd(null);

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) => prev.map((ci) => ci.item.id === itemId ? { ...ci, quantity } : ci));
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotal = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartTotal, selectedRestaurantId, selectedBranchId,
      pendingAdd, confirmClearAndAdd, cancelPendingAdd
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
