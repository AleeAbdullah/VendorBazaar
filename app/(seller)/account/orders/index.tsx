// app/(customer)/account/orders/index.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  LayoutChangeEvent,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";
import { useOrders } from "@/src/context/OrderContext";
import { Order } from "@/src/constants/types.order";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Utility function to format timestamp
const formatOrderDate = (createdAt: any) => {
  if (!createdAt) {
    return "Date not available";
  }

  let date: Date;

  // Handle Firestore Timestamp
  if (createdAt instanceof Timestamp) {
    date = createdAt.toDate();
  }
  // Handle timestamp number (milliseconds)
  else if (typeof createdAt === "number") {
    date = new Date(createdAt);
  }
  // Handle timestamp object with seconds
  else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  }
  // Handle regular Date object or date string
  else {
    date = new Date(createdAt);
  }

  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return "Date not available";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // If order is from today, show time
  if (orderDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // If order is from previous days, show date
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

// Memoized Order Card Component
const OrderCard = React.memo(({ order }: { order: Order }) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);

  const isCompleted = useMemo(
    () => order.status === "Completed" || order.status === "Cancelled",
    [order.status]
  );

  const firstItem = order.items[0];
  const formattedDate = useMemo(
    () => formatOrderDate(order.createdAt),
    [order.createdAt]
  );

  const handleTrackOrder = useCallback(() => {
    router.push({
      pathname: "/(customer)/account/orders/track",
      params: { orderId: order.id },
    });
  }, [router, order.id]);

  const handleLeaveReview = useCallback(() => {
    router.push({
      pathname: "/(customer)/account/orders/leave-review",
      params: {
        orderId: order.id,
        productId: firstItem.pid,
        sellerId: firstItem.sellerId,
      },
    });
  }, [router, order.id, firstItem.pid, firstItem.sellerId]);

  return (
    <View className="bg-white p-4 rounded-lg border border-gray-200 mb-3 mx-4">
      {/* Header with order date */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs text-gray-500">
          Order #{order.id.slice(-6)}
        </Text>
        <Text className="text-xs text-gray-500">{formattedDate}</Text>
      </View>

      <View className="flex-row items-center">
        <View className="relative">
          <Image
            source={{ uri: firstItem.imagesUrl?.[0] }}
            className="w-16 h-16 rounded-md mr-4"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View className="absolute inset-0 justify-center items-center bg-gray-100 rounded-md mr-4">
              <ActivityIndicator size="small" color="#666" />
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {firstItem.name}
          </Text>
          {order.items.length > 1 && (
            <Text className="text-sm text-gray-500">
              and {order.items.length - 1} more item
              {order.items.length > 2 ? "s" : ""}
            </Text>
          )}
          <Text className="text-lg font-bold mt-1">
            ${order.total.toFixed(2)}
          </Text>
        </View>

        <View
          className={`px-2 py-1 rounded-full ${
            isCompleted ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isCompleted ? "text-green-800" : "text-blue-800"
            }`}
          >
            {order.status}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-end mt-3">
        {isCompleted ? (
          <TouchableOpacity
            onPress={handleLeaveReview}
            className="bg-black rounded-lg px-4 py-2"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Leave Review</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleTrackOrder}
            className="bg-primary rounded-lg px-4 py-2"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Track Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// Custom Hook for filtering and sorting orders
const useFilteredOrders = (
  ongoingOrders: Order[],
  completedOrders: Order[],
  activeTab: string
) => {
  return useMemo(() => {
    const orders = activeTab === "Ongoing" ? ongoingOrders : completedOrders;
    // Sort by creation date (newest first)
    return orders.sort((a, b) => {
      const getTimestamp = (createdAt: any) => {
        if (!createdAt) return 0;

        if (createdAt instanceof Timestamp) {
          return createdAt.toMillis();
        }
        if (typeof createdAt === "number") {
          return createdAt;
        }
        if (createdAt.seconds) {
          return createdAt.seconds * 1000;
        }
        return new Date(createdAt).getTime() || 0;
      };

      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });
  }, [ongoingOrders, completedOrders, activeTab]);
};

// Main Component
export default function MyOrdersScreen() {
  const { ongoingOrders, completedOrders, loading, error, refetch } =
    useOrders();
  const [activeTab, setActiveTab] = useState<"Ongoing" | "Completed">(
    "Ongoing"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const translateX = useSharedValue(0);

  const data = useFilteredOrders(ongoingOrders, completedOrders, activeTab);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch?.();
    } catch (err) {
      console.error("Failed to refresh orders:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderEmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons
          name={
            activeTab === "Ongoing"
              ? "time-outline"
              : "checkmark-circle-outline"
          }
          size={50}
          color="gray"
        />
        <Text className="text-lg font-bold mt-4 text-center">
          No {activeTab} Orders!
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center">
          {activeTab === "Ongoing"
            ? "Your active orders will appear here"
            : "Your completed orders will appear here"}
        </Text>
      </View>
    ),
    [activeTab]
  );

  const renderOrderItem = useCallback(
    ({ item }: { item: Order }) => <OrderCard order={item} />,
    []
  );

  const tabWidth = containerWidth ? (containerWidth - 4) / 2 : 0; // Subtract padding from container

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withTiming(activeTab === "Ongoing" ? 0 : tabWidth, {
        duration: 250,
      });
    }
  }, [activeTab, tabWidth, translateX]);

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-500">Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-5">
          <Ionicons name="alert-circle-outline" size={50} color="#ef4444" />
          <Text className="text-red-500 text-center mt-2">{error}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="mt-4 bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Tab Switcher - keeping original design */}
      <View
        className="flex-row p-1 bg-gray-200 rounded-full mx-4 my-2"
        onLayout={onContainerLayout}
      >
        {containerWidth > 0 && (
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 2,
                alignSelf: "center",
                height: "100%",
                backgroundColor: "white",
                borderRadius: 9999,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,
                elevation: 2,
              },
              { width: tabWidth },
              animatedPillStyle,
            ]}
          />
        )}
        <TouchableOpacity
          onPress={() => setActiveTab("Ongoing")}
          style={{
            flex: 1,
            paddingVertical: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              { textAlign: "center", fontWeight: "600", color: "#6B7280" },
              activeTab === "Ongoing" && { color: "black" },
            ]}
          >
            Ongoing ({ongoingOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Completed")}
          style={{
            flex: 1,
            paddingVertical: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              { textAlign: "center", fontWeight: "600", color: "#6B7280" },
              activeTab === "Completed" && { color: "black" },
            ]}
          >
            Completed ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {data.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={data}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}
