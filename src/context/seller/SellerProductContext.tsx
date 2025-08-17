// src/context/seller/SellerProductContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  use,
} from "react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "../AuthContext";
import { Product } from "@/src/constants/types.product";
import { Alert } from "react-native";
import { mapSupabaseToProduct } from "@/src/helpers/helper";

interface SellerProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (
    productData: Omit<
      Product,
      | "pid"
      | "createdAt"
      | "sellerId"
      | "ratingAvg"
      | "totalReviews"
      | "sellerName"
      | "sellerImgUrl"
    >
  ) => Promise<boolean>;
  updateProduct: (
    productId: string,
    updatedData: Partial<Product>
  ) => Promise<boolean>;
}

const SellerProductContext = createContext<
  SellerProductContextType | undefined
>(undefined);

export function SellerProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.uid)
        .or("deleted.is.null,deleted.eq.false")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData = data.map(mapSupabaseToProduct);

      setProducts(formattedData);
    } catch (e: any) {
      console.error("Error fetching seller products:", e.message);
      setError("Could not load your products.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (
    productData: Omit<
      Product,
      | "pid"
      | "createdAt"
      | "sellerId"
      | "ratingAvg"
      | "totalReviews"
      | "sellerName"
      | "sellerImgUrl"
    >
  ) => {
    if (!user) return false;

    const { data, error: insertError } = await supabase
      .from("products")
      .insert([
        {
          seller_id: user.uid,
          seller_name: user.displayName || "Seller",
          seller_img_url: user.photoURL || "/assets/images/default-avatar.jpg",
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category.toLowerCase(),
          stock_quantity: productData.stockQuantity,
          images_url: productData.imagesUrl,
          options: productData.options || [],
          condition: productData.condition,
          disabled: productData.disabled || false,
        },
      ])
      .select();

    if (insertError) {
      console.error("Error adding product:", insertError);
      Alert.alert("Error", "Could not add new product.");
      return false;
    }

    await fetchProducts();
    return true;
  };

  const updateProduct = async (
    productId: string,
    updatedData: Partial<Product>
  ) => {
    const supabaseData = {
      name: updatedData.name,
      description: updatedData.description,
      price: updatedData.price,
      category: updatedData.category,
      stock_quantity: updatedData.stockQuantity,
      images_url: updatedData.imagesUrl,
      condition: updatedData.condition,
      options: updatedData.options || [],
      disabled: updatedData.disabled || false,
    };

    Object.keys(supabaseData).forEach((key) => {
      const objKey = key as keyof typeof supabaseData;
      if (supabaseData[objKey] === undefined) {
        delete supabaseData[objKey];
      }
    });

    const { data, error: updateError } = await supabase
      .from("products")
      .update(supabaseData)
      .eq("id", productId)
      .eq("seller_id", user?.uid);
    if (updateError) {
      console.error("Error updating product:", updateError);
      Alert.alert("Error", "Could not update product.");
      return false;
    }

    await fetchProducts();
    return true;
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
  };

  return (
    <SellerProductContext.Provider value={value}>
      {children}
    </SellerProductContext.Provider>
  );
}

export function useSellerProducts(): SellerProductContextType {
  const context = useContext(SellerProductContext);
  if (context === undefined) {
    throw new Error(
      "useSellerProducts must be used within a SellerProductProvider"
    );
  }
  return context;
}
