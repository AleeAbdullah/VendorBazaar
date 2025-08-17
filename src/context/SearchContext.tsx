// src/context/SearchContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAt,
  endAt,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../constants/types.product";
import { supabase } from "../lib/supabase";
import { mapSupabaseToProduct } from "../helpers/helper";

const RECENT_SEARCHES_KEY = "recent_searches";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Product[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
  clearRecentSearches: () => Promise<void>;
  addSearchTerm: (term: string) => void;
  removeSearchTerm: (term: string) => void;
  runSearch: (term: string) => void; // This will now be primarily for suggestions
  clearSearchResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (storedSearches) {
          setRecentSearches(JSON.parse(storedSearches));
        }
      } catch (e) {
        console.error("Failed to load recent searches.", e);
      }
    };
    loadRecentSearches();
  }, []);

  const updateRecentSearches = async (searches: string[]) => {
    setRecentSearches(searches);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (e) {
      console.error("Failed to save recent searches.", e);
    }
  };

  // This function is now only responsible for updating the "Recent Searches" list.
  const addSearchTerm = (term: string) => {
    const trimmedTerm = term.trim().toLowerCase();
    if (!trimmedTerm) return;

    // Add term to the top and remove any duplicates
    const updatedSearches = [
      trimmedTerm,
      ...recentSearches.filter((s) => s.toLowerCase() !== trimmedTerm),
    ].slice(0, 10);
    updateRecentSearches(updatedSearches);
  };

  const removeSearchTerm = (term: string) => {
    const updatedSearches = recentSearches.filter((s) => s !== term);
    updateRecentSearches(updatedSearches);
  };

  const clearRecentSearches = async () => {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  // This function now exclusively fetches search suggestions/results from Firestore.
  const runSearch = useCallback(async (term: string) => {
    const trimmedTerm = term.trim().toLowerCase();
    if (!trimmedTerm) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedQuery = trimmedTerm.split(" ").join(" & ");

      const { data, error: searchError } = await supabase
        .from("products")
        .select()
        .textSearch("product_search_vector", formattedQuery, {
          type: "websearch",
          config: "english",
        })
        .or("deleted.is.null,deleted.eq.false")
        .limit(20);

      if (searchError) throw searchError;

      const results = data.map(mapSupabaseToProduct);
      setSearchResults(results);
    } catch (err: any) {
      console.error("Supabase full-text search error:", err.message);
      setError("Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearchResults = () => {
    setSearchResults([]);
  };

  const value = {
    searchQuery,
    setSearchQuery,
    searchResults,
    recentSearches,
    loading,
    error,
    clearRecentSearches,
    addSearchTerm,
    removeSearchTerm,
    runSearch,
    clearSearchResults,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
