"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useUser } from "./UserContext";

export interface CartItem {
  image: any;
  id: string;
  shop_id?: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  selected: boolean;
  images?: string[];
}

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: any) => void;
  updateQuantity: (
    id: string,
    delta: number,
  ) => void;
  toggleSelection: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  removeSelectedItems: () => void;
  cartCount: number;
  totalAmount: number;
};

const CartContext =
  createContext<CartContextType>({
    cartItems: [],
    addToCart: () => {},
    updateQuantity: () => {},
    toggleSelection: () => {},
    removeFromCart: () => {},
    clearCart: () => {},
    removeSelectedItems: () => {},
    cartCount: 0,
    totalAmount: 0,
  });

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<
    CartItem[]
  >([]);

  // Clear cart on logout
  useEffect(() => {
    const wasLoggedIn =
      localStorage.getItem("was_logged_in") ===
      "true";
    if (wasLoggedIn && !user) {
      setCartItems([]);
      localStorage.removeItem("cart_items");
    }
    if (user) {
      localStorage.setItem(
        "was_logged_in",
        "true",
      );
    } else {
      localStorage.removeItem("was_logged_in");
    }
  }, [user]);

  // Initialize from local storage
  useEffect(() => {
    const savedCart =
      localStorage.getItem("cart_items");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem(
      "cart_items",
      JSON.stringify(cartItems),
    );
  }, [cartItems]);

  const addToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id,
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          selected: true,
        },
      ];
    });
  };

  const updateQuantity = (
    id: string,
    delta: number,
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(
            1,
            item.quantity + delta,
          );
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const toggleSelection = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== id),
    );
  };
  const clearCart = () => setCartItems([]);
  const removeSelectedItems = () => {
    setCartItems((prev) =>
      prev.filter((item) => !item.selected),
    );
  };

  const cartCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalAmount = cartItems
    .filter((item) => item.selected)
    .reduce(
      (acc, item) =>
        acc + item.price * item.quantity,
      0,
    );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        toggleSelection,
        removeFromCart,
        clearCart,
        removeSelectedItems,
        cartCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
