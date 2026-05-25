import { createContext, ReactNode, useContext, useState } from "react";

export interface CartItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  plan: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  date: string;
  status: string;
  amount: number;
  items: string;
  image: string;
  timestamp: number;
}

interface CartContextType {
  items: CartItem[];
  orderHistory: OrderItem[];
  walletBalance: number; // 🔥 NEW: Tracks user's digital money
  loadWallet: (amount: number) => void; // 🔥 NEW: Handles adding money
  addToCart: (
    item: Omit<CartItem, "cartItemId" | "quantity"> & { quantity?: number },
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  placeOrder: (grandTotal: number, paymentMethod: string) => string; // 🔥 Updated to accept payment method
  cancelOrder: (orderId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0); // Starts at NPR 0

  // 🔥 NEW: Loads money and applies the 10% bonus if amount is 2000 or more
  const loadWallet = (amount: number) => {
    const bonus = amount >= 2000 ? amount * 0.1 : 0;
    setWalletBalance((prev) => prev + amount + bonus);
  };

  const addToCart = (
    newItem: Omit<CartItem, "cartItemId" | "quantity"> & { quantity?: number },
  ) => {
    setItems((prev) => {
      const uniqueId = `${newItem.id}-${newItem.size}-${newItem.plan}`;
      const exists = prev.findIndex((item) => item.cartItemId === uniqueId);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists].quantity += newItem.quantity || 1;
        return updated;
      }
      return [
        ...prev,
        { ...newItem, cartItemId: uniqueId, quantity: newItem.quantity || 1 },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) =>
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return removeFromCart(cartItemId);
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // 🔥 UPDATED: Deducts from wallet if that is the chosen payment method
  const placeOrder = (grandTotal: number, paymentMethod: string) => {
    if (items.length === 0) return "";

    // Safety check (handled in checkout UI too)
    if (paymentMethod === "wallet") {
      if (walletBalance < grandTotal) return "";
      setWalletBalance((prev) => prev - grandTotal); // Deduct money
    }

    const newOrderId = Math.floor(10000 + Math.random() * 90000).toString();
    const newOrder: OrderItem = {
      id: newOrderId,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Processing",
      amount: grandTotal,
      items: items.map((i) => `${i.name} (${i.quantity})`).join(", "),
      image: items[0].image,
      timestamp: Date.now(),
    };

    setOrderHistory((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrderId;
  };

  const cancelOrder = (orderId: string) => {
    setOrderHistory((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o)),
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        orderHistory,
        walletBalance,
        loadWallet,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        placeOrder,
        cancelOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined)
    throw new Error("useCart must be used within a CartProvider");
  return context;
}