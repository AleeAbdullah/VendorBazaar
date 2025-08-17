// src/context/ProductContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product } from "../constants/types.product";
import { supabase } from "../lib/supabase";
import { mapSupabaseToProduct } from "../helpers/helper";

interface Category {
  id: string;
  name: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loadMoreProducts: () => void;
  fetchProducts: () => void;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

// --- Context Definition ---
const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCTS_PER_PAGE = 10;

// --- Provider Component ---
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; id: string }[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // State for loading indicators
  const [loading, setLoading] = useState(true); // For initial load or category change
  const [loadingMore, setLoadingMore] = useState(false); // For pagination
  const [error, setError] = useState<string | null>(null);

  // State for pagination logic
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Effect to fetch categories from Firestore
  useEffect(() => {
    // Point directly to the MetaData document
    const docRef = doc(db, "App", "MetaData");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          if (Array.isArray(data.Categories)) {
            const categoryList = data.Categories.map(
              (categoryName: string) => ({
                id: categoryName.toLowerCase(),
                name: categoryName,
              })
            );

            // Sort alphabetically and add "All"
            categoryList.sort((a, b) => a.name.localeCompare(b.name));
            setCategories([{ id: "all", name: "All" }, ...categoryList]);
          } else {
            console.error("categories is not an array in MetaData!");
          }
        } else {
          console.error("MetaData document not found!");
        }
      },
      (err: any) => {
        console.error("Failed to fetch categories:", err);
        setCategories([
          { name: "electronics", id: "electronics" },
          { name: "clothing", id: "clothing" },
        ]);
      }
    );

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Effect to fetch products when the selected category changes
  const fetchProducts = useCallback(
    async (isInitialLoad = true) => {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      setHasMore(true);
      setCurrentPage(0);

      try {
        let queryBuilder = supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .or("deleted.is.null,deleted.eq.false")
          .range(0, PRODUCTS_PER_PAGE - 1);

        if (selectedCategory !== "All" && selectedCategory !== "") {
          queryBuilder = queryBuilder.eq("category", selectedCategory);
        }

        const { data, error: fetchError } = await queryBuilder;
        // console.log("query", queryBuilder, "\ndata =>", data);

        if (fetchError) throw fetchError;

        const productList = data.map(mapSupabaseToProduct);
        setProducts(productList);

        if (data.length < PRODUCTS_PER_PAGE) {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch products from Supabase:", err.message);
        setError("Could not load products. Please check your connection.");
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [selectedCategory]
  );

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  // Function to load more products for infinite scroll
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const from = nextPage * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;

    try {
      let queryBuilder = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (selectedCategory !== "All") {
        queryBuilder = queryBuilder.eq("category", selectedCategory);
      }

      const { data, error: fetchError } = await queryBuilder;

      if (fetchError) throw fetchError;

      const newProductList = data.map(mapSupabaseToProduct);
      setProducts((prevProducts) => [...prevProducts, ...newProductList]);
      setCurrentPage(nextPage);

      if (data.length < PRODUCTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Failed to load more products from Supabase:", err.message);
      setError("Could not load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

  const contextValue = {
    products,
    categories,
    selectedCategory,
    fetchProducts,
    setSelectedCategory,
    loadMoreProducts,
    loading,
    loadingMore,
    error,
    hasMore,
    filteredProducts: products,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts(): ProductContextType {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
