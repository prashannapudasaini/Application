import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import { ENDPOINTS } from "../constants/api";

export interface CartItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  plan?: string;
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
  walletBalance: number;

  // 🔥 NEW: Added function to interface to sync DB balance
  setInitialWalletBalance: (balance: number) => void;

  loadWallet: (amount: number) => void;
  addToCart: (
    item: Omit<CartItem, "cartItemId" | "quantity"> & { quantity?: number },
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  placeOrder: (grandTotal: number, paymentMethod: string) => string;
  cancelOrder: (orderId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // 🔥 NEW: Auto-fetch wallet balance on login globally
  useEffect(() => {
    if (user?.id) {
      const endpoint = `${ENDPOINTS.MOBILE_PROFILE}?user_id=${user.id}&_t=${Date.now()}`;
      api
        .get(endpoint)
        .then((res) => {
          if (res.data?.status === "success" && res.data?.data) {
            const fetchedBalance = Number(
              res.data.data.balance ?? res.data.data.wallet_balance ?? 0,
            );
            setWalletBalance(fetchedBalance);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // 🔥 NEW: Function to sync with Database manually
  const setInitialWalletBalance = (balance: number) => {
    setWalletBalance(balance);
  };

  // 🔥 UPDATED: Only 2% bonus if strictly above 3000
  const loadWallet = (amount: number) => {
    const bonus = amount > 3000 ? amount * 0.02 : 0;
    setWalletBalance((prev) => prev + amount + bonus);
  };

  const addToCart = (
    newItem: Omit<CartItem, "cartItemId" | "quantity"> & { quantity?: number },
  ) => {
    setItems((prev) => {
      const plan = newItem.plan || "One-time";
      const size = newItem.size || "Standard";
      const uniqueId = `${newItem.id}-${size}-${plan}`;
      const exists = prev.findIndex((item) => item.cartItemId === uniqueId);

      if (exists >= 0) {
        const updated = [...prev];
        updated[exists].quantity += newItem.quantity || 1;
        return updated;
      }

      return [
        ...prev,
        { ...newItem, plan, size, cartItemId: uniqueId, quantity: newItem.quantity || 1 },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      return removeFromCart(cartItemId);
    }

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

  // Deducts from wallet if that is the chosen payment method and saves order locally
  const placeOrder = (grandTotal: number, paymentMethod: string) => {
    if (items.length === 0) return "";

    if (paymentMethod === "wallet") {
      if (walletBalance < grandTotal) return "";
      setWalletBalance((prev) => prev - grandTotal); // Deduct money locally (DB deduction happens in verify.php)
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
        setInitialWalletBalance, // <--- Added to provider
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
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
