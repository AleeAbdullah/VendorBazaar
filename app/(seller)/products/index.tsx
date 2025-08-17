// app/(seller)/products/index.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSellerProducts } from "@/src/context/seller/SellerProductContext";
import { Product } from "@/src/constants/types.product";
import { StatusBar } from "expo-status-bar";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useTheme } from "@/src/context/ThemeContext";
import MessagesIcon from "@/src/components/MessagesIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ProductListItem = ({
  item,
  effectiveTheme,
}: {
  item: Product;
  effectiveTheme: string;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(seller)/products/${item.pid}`)}
      className="flex-row mx-6 my-2 rounded-lg border items-center p-3 shadow-lg"
      style={{
        elevation: 1,
        shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
        borderColor:
          effectiveTheme === "dark" ? darkColors.accent : lightColors.border,
        backgroundColor:
          effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      }}
    >
      <Image
        source={{ uri: item.imagesUrl?.[0] }}
        className="w-20 h-20 rounded-md mr-4"
      />
      <View className="flex-1 flex flex-row justify-between ">
        <View
          style={{
            flex: 1,
            maxWidth: "70%",
            justifyContent: "space-between",
            paddingRight: 10,
            gap: 2,
          }}
        >
          <Text
            className="text-btn_title font-Fredoka_SemiBold"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            className="text-sm font-Fredoka_Regular"
            style={{
              color:
                effectiveTheme === "dark"
                  ? darkColors.secondaryText
                  : lightColors.secondaryText,
            }}
            numberOfLines={2}
          >
            {item.category || "No category."}
          </Text>

          <Text
            className="text-btn_title font-Fredoka_SemiBold mt-1"
            style={{
              color:
                effectiveTheme === "dark"
                  ? darkColors.text
                  : lightColors.accent,
            }}
          >
            ${item.price.toFixed(2)}
          </Text>
        </View>

        <Text
          className="text-sm h-full self-end mr-4"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          Stock: {item.stockQuantity}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText
        }
      />
    </TouchableOpacity>
  );
};

export default function SellerProductsScreen() {
  const { products, loading, error, fetchProducts } = useSellerProducts();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { top } = useSafeAreaInsets();

  const { effectiveTheme } = useTheme();

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  }, []);

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
                  Manage Orders
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
      {loading && products.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductListItem item={item} effectiveTheme={effectiveTheme} />
          )}
          keyExtractor={(item) => item.pid}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListEmptyComponent={
            <View className="flex-1  justify-center items-center mt-60">
              <Ionicons
                name="cube-outline"
                size={50}
                color={
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText
                }
              />
              <Text
                className="mt-4 font-Fredoka_SemiBold text-text"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                No Products Yet
              </Text>
              <Text
                className="mt-1 font-Fredoka_Regular text-medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.tertiaryText
                      : lightColors.tertiaryText,
                }}
              >
                Tap the '+' to add your first product.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
