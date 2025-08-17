// app/(customer)/search.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useSearch } from "@/src/context/SearchContext";
import { Product } from "@/src/constants/types.product";
import { Link, Stack, useRouter } from "expo-router";
import { useDebounce } from "use-debounce";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import MessagesIcon from "@/src/components/MessagesIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SearchResultItem = ({
  item,
  effectiveTheme,
}: {
  item: Product;
  effectiveTheme: string;
}) => (
  <Link href={`/(customer)/home/${item.pid}`} asChild>
    <TouchableOpacity
      className="flex-row items-center p-3 border-b"
      style={{
        borderColor:
          effectiveTheme === "dark" ? darkColors.border : lightColors.border,
        backgroundColor:
          effectiveTheme === "dark"
            ? darkColors.card + "20"
            : lightColors.card + "20",
      }}
    >
      <Image
        source={{
          uri: item.imagesUrl[0],
        }}
        className="w-14 h-14 rounded-lg mr-4"
      />
      <View className="flex-1 gap-2">
        <Text
          className="text-medium font-MuseoModerno_Medium"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          className="text-sm"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          ${item.price.toFixed(2)}
        </Text>
      </View>

      <View className=" items-center justify-end h-full gap-2 mr-6">
        {item.stockQuantity == 0 && (
          <Text
            className="text-sm"
            style={{
              color:
                effectiveTheme === "dark"
                  ? darkColors.secondaryText
                  : lightColors.secondaryText,
            }}
          >
            (Out of Stock)
          </Text>
        )}

        {item.stockQuantity &&
          item.stockQuantity > 0 &&
          item.stockQuantity < 10 && (
            <Text
              className="text-sm"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              (about to be sold out)
            </Text>
          )}
      </View>

      <Ionicons name="arrow-forward" size={20} color="gray" />
    </TouchableOpacity>
  </Link>
);

const RecentSearchItem = ({
  term,
  onSearch,
  onRemove,
  effectiveTheme,
}: {
  term: string;
  onSearch: (t: string) => void;
  onRemove: (t: string) => void;
  effectiveTheme: string;
}) => (
  <View
    className="flex-row justify-between items-center p-3 border-b "
    style={{
      borderColor:
        effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      backgroundColor:
        effectiveTheme === "dark"
          ? darkColors.card + "20"
          : lightColors.card + "20",
    }}
  >
    <TouchableOpacity
      onPress={() => onSearch(term)}
      className="flex-1 flex-row items-center"
    >
      <Ionicons name="time-outline" size={22} color="gray" className="mr-4" />
      <Text
        className="text-medium font-MuseoModerno_Regular"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {term}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onRemove(term)} className="p-2">
      <Ionicons name="close" size={22} color="gray" />
    </TouchableOpacity>
  </View>
);

export default function SearchScreen() {
  const {
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
  } = useSearch();
  const router = useRouter();

  const { effectiveTheme } = useTheme();
  const { top } = useSafeAreaInsets();

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 0) {
      runSearch(debouncedSearchQuery);
    } else {
      clearSearchResults();
    }
  }, [debouncedSearchQuery]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addSearchTerm(searchQuery);
      runSearch(searchQuery);
    }
  };

  const handleRecentSearchSelect = (term: string) => {
    setSearchQuery(term);
    runSearch(term);
  };

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen
        options={{
          title: "Dashboard",

          header: () => (
            <View
              className=" relative"
              style={{
                backgroundColor: "#557754",
                height: top + 40,
                marginBottom: 20,
                zIndex: 10,
              }}
            >
              <View
                className="flex-row items-center justify-between"
                style={{
                  paddingTop: top,
                  paddingInline: 16,
                  paddingBottom: 36,
                  zIndex: 1000,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontFamily: "MuseoModerno_SemiBold",
                    fontSize: 28,
                    height: 36,
                    zIndex: 100,
                  }}
                >
                  Search Products
                </Text>
                <MessagesIcon color="white" />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: -20,
                  height: 30,
                  width: "100%",
                  backgroundColor: "#557754",
                  flexDirection: "row",
                  borderRadius: 1000,
                  zIndex: -10,
                }}
              />
            </View>
          ),
        }}
      />

      {/* Search Input */}
      <View className="flex-row items-center p-4 pt-2 gap-x-3">
        <View
          className="flex-1 flex-row items-center border rounded-lg px-3"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.card + "50"
                : lightColors.card + "50",
          }}
        >
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Search for products..."
            className="flex-1 h-14 ml-2 text-base"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={true}
          />
          <TouchableOpacity onPress={() => setSearchQuery("")} className="p-2">
            {searchQuery.length > 0 && (
              <Ionicons name="close-circle" size={20} color="gray" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : searchQuery.length > 0 && searchResults.length > 0 ? (
        // Display Search Results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.pid}
          renderItem={({ item }) => (
            <SearchResultItem item={item} effectiveTheme={effectiveTheme} />
          )}
        />
      ) : searchQuery.length > 0 && searchResults.length === 0 ? (
        <View className="flex-1 justify-center items-center p-5">
          <View
            className="m-3  "
            style={{
              backgroundColor:
                effectiveTheme === "dark"
                  ? darkColors.accent + "30"
                  : lightColors.accent + "30",
              padding: 20,
              borderRadius: 50,
            }}
          >
            <MaterialCommunityIcons name="cart-off" size={60} color="#557754" />
          </View>
          <Text
            className=" font-MuseoModerno_SemiBold text-text"
            style={{
              color:
                effectiveTheme === "dark"
                  ? darkColors.tertiaryText
                  : lightColors.tertiaryText,
            }}
          >
            No results found for "{searchQuery}"
          </Text>
        </View>
      ) : (
        // Display Recent Searches
        <View>
          <View className="flex-row justify-between items-center px-4 py-2">
            <Text
              className="text-text font-MuseoModerno_SemiBold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              Recent Searches
            </Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text className="text-blue-500">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <RecentSearchItem
                  term={item}
                  onSearch={handleRecentSearchSelect}
                  onRemove={removeSearchTerm}
                  effectiveTheme={effectiveTheme}
                />
              )}
            />
          ) : (
            <View className="p-10 items-center">
              <View
                className="m-3  "
                style={{
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? darkColors.accent + "30"
                      : lightColors.accent + "30",
                  padding: 20,
                  borderRadius: 50,
                }}
              >
                <MaterialIcons name="search-off" size={60} color="#557754" />
              </View>
              <Text className="text-gray-500">No recent searches</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
