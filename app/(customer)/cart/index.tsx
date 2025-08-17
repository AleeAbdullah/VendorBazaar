// app/(customer)/cart/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useCart } from "@/src/context/CartContext";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  CartItem,
  ProductOption,
  ProductOptionValue,
} from "@/src/constants/types.product";
import { ErrorState, ProductCardSkeleton } from "@/src/helpers/skeletons";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useProducts } from "@/src/context/ProductContext";
import { supabase } from "@/src/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import MessagesIcon from "@/src/components/MessagesIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ExtendedCartItem extends CartItem {
  stock_quantity: number;
}

export default function CartScreen() {
  const {
    cartItems,
    loading,
    error,
    cartSubtotal,
    initiatePayment,
    isPaying,
    SHIPPING_FEE,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { top } = useSafeAreaInsets();

  const [products, setProducts] = useState<ExtendedCartItem[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    if (cartItems.length === 0) return;

    const { data, error } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .in(
        "id",
        cartItems.map((item) => item.pid)
      );

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    const updatedProducts = cartItems.map((item) => {
      const product = data?.find((p) => p.id === item.pid);
      return {
        ...item,
        stock_quantity: product?.stock_quantity || 0,
      };
    });

    // Check stock and automatically adjust quantities
    const errors: Record<string, string> = {};
    for (const product of updatedProducts) {
      if (product.stock_quantity === 0) {
        // Remove items with 0 stock
        removeFromCart(product.pid);
      } else if (product.quantity > product.stock_quantity) {
        // Adjust quantity to available stock
        updateQuantity(product.pid, product.stock_quantity);
        errors[
          product.pid
        ] = `Quantity adjusted to available stock (${product.stock_quantity})`;
      }
    }

    // Filter out removed items (0 stock)
    const filteredProducts = updatedProducts.filter(
      (p) => p.stock_quantity > 0
    );
    setProducts(filteredProducts);
    setStockErrors(errors);
  };

  useEffect(() => {
    fetchProducts();
  }, [cartItems]);

  const CartListItem = ({
    item,
    effectiveTheme,
  }: {
    item: ExtendedCartItem;
    effectiveTheme: string;
  }) => {
    const handleUpdateQuantity = async (newQuantity: number) => {
      if (newQuantity > item.stock_quantity) {
        await updateQuantity(item.pid, item.stock_quantity);
        setStockErrors((prev) => ({
          ...prev,
          [item.pid]: `Only ${item.stock_quantity} items available in stock`,
        }));
        return;
      }

      // Clear error when quantity is valid
      setStockErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[item.pid];
        return newErrors;
      });

      await updateQuantity(item.pid, newQuantity);
    };

    return (
      <View
        className="flex-row items-center p-3 rounded-lg border mb-3 mx-4 shadow-md"
        style={{
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.input : lightColors.card,
          borderColor:
            effectiveTheme === "dark" ? darkColors.border : lightColors.border,
          shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
        }}
      >
        <Image
          source={{
            uri: item.imagesUrl?.[0] || "https://placehold.co/100x100",
          }}
          className="w-20 h-20 rounded-md mr-4"
        />
        <View className="flex-1">
          <Text
            className="text-text font-MuseoModerno_SemiBold"
            numberOfLines={1}
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            {item.name}
          </Text>
          {item.selectedOptions && (
            <Text
              className="text-small font-MuseoModerno_Regular mb-1"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.tertiaryText
                    : lightColors.tertiaryText,
              }}
            >
              {Object.values(item.selectedOptions || {})
                .map((option) => option.name)
                .join(", ") || "No options selected"}
            </Text>
          )}
          <Text
            className="text-text font-MuseoModerno_SemiBold"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            ${item.price.toFixed(2)}
          </Text>
        </View>
        <View className="items-center">
          <TouchableOpacity
            onPress={() => removeFromCart(item.pid)}
            className="self-end mb-2"
          >
            <Ionicons name="trash-bin-outline" size={20} color="red" />
          </TouchableOpacity>
          <View className="flex-row items-center bg-gray-100 rounded-full">
            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item.quantity - 1)}
              className="p-2"
            >
              <Ionicons name="remove" size={18} />
            </TouchableOpacity>
            <Text className="px-3 text-base font-semibold">
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item.quantity + 1)}
              className="p-2"
            >
              <Ionicons name="add" size={18} />
            </TouchableOpacity>
          </View>
          {stockErrors[item.pid] && (
            <Text className="text-xs text-red-500 mt-1 text-center max-w-20">
              {stockErrors[item.pid]}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const handleCheckout = async () => {
    // Refresh stock data before checkout
    await fetchProducts();

    // Check if any items have stock issues after refresh
    const hasStockIssues = Object.keys(stockErrors).length > 0;
    if (hasStockIssues) {
      Alert.alert(
        "Stock Issue",
        "Please review your cart. Some items have been adjusted due to stock availability."
      );
      return;
    }

    router.push("/(customer)/cart/checkout");
  };

  const VAT_RATE = 0.0;
  const total = cartSubtotal * (1 + VAT_RATE) + SHIPPING_FEE;

  return (
    <SafeAreaView className="flex-1 ">
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
                  My Cart
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
      {loading ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={Array(6).fill(0)} // Render 6 skeleton items
            numColumns={2}
            keyExtractor={(_, index) => `skeleton-${index}`}
            renderItem={() => (
              <ProductCardSkeleton effectiveTheme={effectiveTheme} />
            )}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        </View>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {}}
          effectiveTheme={effectiveTheme}
        />
      ) : cartItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
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
            <Ionicons name="cart-outline" size={60} color="#557754" />
          </View>
          <Text
            className="text-heading font-MuseoModerno_SemiBold mt-4"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            Your Cart is Empty
          </Text>
          <Text className="text-gray-500 mt-2">
            Looks like you haven't added anything yet.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <CartListItem item={item} effectiveTheme={effectiveTheme} />
            )}
            keyExtractor={(item) => item.pid}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 250 }}
          />
          {/* Summary Section */}
          <View
            className="absolute bottom-0 left-0 right-0 border-t p-4 pt-5 rounded-t-2xl"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Sub-total
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${cartSubtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                VAT (%)
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${(cartSubtotal * VAT_RATE).toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Shipping fee
              </Text>
              <Text
                className="text-medium font-Fredoka_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                ${SHIPPING_FEE.toFixed(2)}
              </Text>
            </View>

            <View
              className="h-px my-2"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.text + "50"
                    : lightColors.text + "50",
              }}
            />

            <View className="flex-row justify-between mt-2 mb-5">
              <Text
                className=" text-large font-Fredoka_SemiBold"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Total
              </Text>
              <Text
                className="text-large font-Fredoka_SemiBold"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                ${total.toFixed(2)}
              </Text>
            </View>

            {/* --- Updated Checkout Button --- */}
            <TouchableOpacity
              className=" rounded-full p-4 flex-row justify-center items-center"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.accent
                    : lightColors.accent,
                opacity: isPaying ? 0.7 : 1, // Dim button when loading
              }}
              onPress={handleCheckout}
              disabled={isPaying} // Disable button when processing
            >
              {isPaying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text
                    className="text-lg font-semibold"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : darkColors.text,
                    }}
                  >
                    Go To Checkout
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    style={{
                      marginLeft: 8,
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : darkColors.text,
                    }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
