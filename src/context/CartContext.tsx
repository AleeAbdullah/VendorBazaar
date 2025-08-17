// src/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  CartItem,
  Product,
  ProductOptionValue,
} from "../constants/types.product";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";
import { Address } from "../constants/types.user";

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  SHIPPING_FEE: number;
  error: string | null;
  isPaying: boolean;
  addToCart: (
    product: Product,
    quantity: number,
    selectedOptions: { [key: string]: ProductOptionValue }
  ) => Promise<void>;
  updateQuantity: (productId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  cartSubtotal: number;
  totalItems: number;
  initiatePayment: ({ address }: { address: Address }) => Promise<string>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const SHIPPING_FEE = 0.0;
  const { firebaseUser } = useAuth();

  const initiatePayment = async ({
    address,
  }: {
    address: Address;
  }): Promise<string> => {
    if (!firebaseUser) {
      throw new Error("You must be logged in to make a payment.");
    }
    if (cartItems.length === 0) {
      throw new Error("Your cart is empty and you cannot proceed.");
    }

    setIsPaying(true);
    try {
      const token = await firebaseUser.getIdToken();
      if (!token) {
        throw new Error("User is not authenticated.");
      }
      const CLOUD_FUNCTION_URL =
        "https://us-central1-safebuyafrica-a4d6f.cloudfunctions.net/initializeMultiSellerTransaction";

      if (!CLOUD_FUNCTION_URL) {
        throw new Error(
          "Please configure your Cloud Function URL in CartContext.tsx"
        );
      }

      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // For 'onCall' functions, the payload must be wrapped in a 'data' object.
        // cloud functions break the image url to invalid format by converting %2f to /
        body: JSON.stringify({
          data: { cartItems, address },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Extracts error message from Firebase Functions response
        const errorMessage =
          result.error?.message ||
          "An unknown error occurred during payment initiation.";
        throw new Error(errorMessage);
      }

      // The actual data is nested in result.result for onCall functions
      const authorization_url = result.result?.authorization_url;
      if (!authorization_url) {
        throw new Error("Failed to get payment link from the server.");
      }

      return authorization_url;
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      // Re-throw the error so it can be caught and displayed in the UI component
      throw error;
    } finally {
      setIsPaying(false);
    }
  };

  // fetch cart items when user changes or mounts
  useEffect(() => {
    if (!firebaseUser) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cartCollectionRef = collection(db, "users", firebaseUser.uid, "cart");
    const q = query(cartCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as CartItem[];
        setCartItems(items);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch cart items:", err);
        setError("Could not load your cart.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  const addToCart = async (
    product: Product,
    quantity: number,
    selectedOptions: { [key: string]: ProductOptionValue }
  ) => {
    if (!firebaseUser) {
      setError("You must be logged in to add items to the cart.");
      return;
    }

    const cartItemRef = doc(db, "users", firebaseUser.uid, "cart", product.pid);
    try {
      const newItem: CartItem = {
        pid: product.pid,
        name: product.name,
        price: product.price,
        imagesUrl: product.imagesUrl,
        sellerId: product.sellerId,
        selectedOptions: selectedOptions,
        quantity: quantity,
      };
      await setDoc(cartItemRef, newItem, { merge: true });
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Could not add item to cart.");
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!firebaseUser) return;
    const cartItemRef = doc(db, "users", firebaseUser.uid, "cart", productId);
    try {
      if (newQuantity > 0) {
        await updateDoc(cartItemRef, { quantity: newQuantity });
      } else {
        // If quantity is 0 or less, remove the item
        await removeFromCart(productId);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Could not update item quantity.");
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!firebaseUser) return;
    const cartItemRef = doc(db, "users", firebaseUser.uid, "cart", productId);
    try {
      await deleteDoc(cartItemRef);
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError("Could not remove item from cart.");
    }
  };

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const value: CartContextType = {
    cartItems,
    loading,
    SHIPPING_FEE,
    isPaying,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    totalItems,
    initiatePayment,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
