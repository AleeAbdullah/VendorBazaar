import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  GestureResponderEvent,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, writeBatch, increment } from "firebase/firestore";

import { Order, OrderStatus } from "@/src/constants/types.order";
import { useSellerOrders } from "@/src/context/seller/SellerOrderContext";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/lib/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessagesIcon from "@/src/components/MessagesIcon";

const TABS = ["New", "Shipped", "Completed"];

const OrderCard = ({
  order,
  activeTab,
  isUpdating,
  effectiveTheme,
}: {
  order: Order;
  activeTab: string;

  isUpdating: boolean;
  effectiveTheme: "light" | "dark";
}) => {
  const router = useRouter();
  const firstItem = order.items[0];
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const { top } = useSafeAreaInsets();

  const renderActionButton = () => {
    const buttonStyles = "py-2 px-4 rounded-lg";
    const textStyles = "text-white font-bold text-sm";

    switch (activeTab) {
      case "New":

      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(seller)/orders/${order.id}`)}
      className="p-4 rounded-lg border mb-3 mx-4"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
    >
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
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-bold text-base" style={{ color: colors.text }}>
          Order #{order.id.substring(0, 6)}
        </Text>
        <Text className="text-sm" style={{ color: colors.secondaryText }}>
          {order.createdAt.toDate().toLocaleDateString()}
        </Text>
      </View>
      <View className="h-px my-2" style={{ backgroundColor: colors.border }} />
      <View className="flex-row items-center">
        <Image
          source={{
            uri: firstItem.imagesUrl?.[0] || "https://placehold.co/100x100",
          }}
          className="w-16 h-16 rounded-md mr-4"
          style={{ backgroundColor: colors.border }}
        />
        <View className="flex-1">
          <Text className="text-sm" style={{ color: colors.secondaryText }}>
            {order.items.length} item{order.items.length > 1 ? "s" : ""}
          </Text>
          <Text
            className="text-lg font-bold mt-1"
            style={{ color: colors.text }}
          >
            ${order.total.toFixed(2)}
          </Text>
        </View>
        {!renderActionButton() && (
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.tertiaryText}
          />
        )}
      </View>
      {renderActionButton() && (
        <View
          className="mt-4 pt-4 border-t flex-row justify-end"
          style={{ borderColor: colors.border }}
        >
          {renderActionButton()}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SellerOrdersScreen() {
  const { newOrders, shippedOrders, completedOrders, loading, error } =
    useSellerOrders();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isUpdating, setIsUpdating] = useState(false);

  const dataMap = {
    New: newOrders,
    Shipped: shippedOrders,
    Completed: completedOrders,
  };

  const currentData = dataMap[activeTab as keyof typeof dataMap];

  return (
    <SafeAreaView className="flex-1">
      {/* Custom Tab Switcher */}
      <View className=" py-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`py-2 px-4 rounded-full mr-2 border`}
              style={{
                backgroundColor:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.placeholder
                      : lightColors.placeholder
                    : effectiveTheme === "dark"
                    ? darkColors.placeholder + "50"
                    : lightColors.placeholder + "50",
                borderColor:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.accent
                      : lightColors.accent
                    : "transparent",
              }}
            >
              <Text
                className={`font-bold`}
                style={{
                  color:
                    activeTab === tab
                      ? effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text
                      : effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : currentData.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-10">
          <Ionicons
            name="receipt-outline"
            size={50}
            color={
              effectiveTheme === "dark" ? darkColors.text : lightColors.text
            }
          />
          <Text
            className="text-lg font-bold mt-4"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            No {activeTab} Orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              activeTab={activeTab}
              isUpdating={isUpdating}
              effectiveTheme={effectiveTheme}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
