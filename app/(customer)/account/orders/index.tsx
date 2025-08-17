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
import { Order } from "@/src/constants/types.order";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { formatTimestamp } from "@/src/helpers/formatDate";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useAuth } from "@/src/context/AuthContext";
import { useOrders } from "@/src/context/OrderContext";
import { ErrorState } from "@/src/helpers/skeletons";

// Memoized Order Card Component
const OrderCard = React.memo(
  ({ order, effectiveTheme }: { order: Order; effectiveTheme: string }) => {
    const router = useRouter();
    const [imageLoading, setImageLoading] = useState(true);
    const colors = effectiveTheme === "dark" ? darkColors : lightColors;
    const { user } = useAuth();

    const isCompleted = useMemo(
      () => order.status === "Completed",
      [order.status]
    );

    const firstItem = order.items[0];
    const formattedDate = useMemo(
      () => formatTimestamp(order.createdAt),
      [order.createdAt]
    );

    const handlePress = useCallback(() => {
      router.push({
        pathname: `/(customer)/account/orders/[orderId]`,
        params: { orderId: order.id },
      });
    }, [router, order.id]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        className="p-4 rounded-lg border mb-3 mx-4 shadow-sm"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.card,
          shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
        }}
        activeOpacity={0.8}
      >
        {/* Header with order date */}
        <View className="flex-row justify-between items-center mb-3">
          <Text
            className="text-xs font-MuseoModerno_Regular"
            style={{ color: colors.secondaryText }}
          >
            Order #{order.id.slice(-6)}
          </Text>
          <Text
            className="text-xs font-MuseoModerno_Regular"
            style={{ color: colors.secondaryText }}
          >
            {formattedDate}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="relative">
            <Image
              source={{
                uri: firstItem.imagesUrl?.[0],
              }}
              className="w-16 h-16 rounded-md mr-4"
              style={{ backgroundColor: colors.border }}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View
                className="absolute inset-0 justify-center items-center rounded-md mr-4"
                style={{ backgroundColor: colors.border }}
              >
                <ActivityIndicator size="small" color={colors.secondaryText} />
              </View>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row justify-start items-center mb-1 gap-2">
              <Text
                className="text-btn_title font-MuseoModerno_SemiBold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {firstItem.name}
              </Text>
              {!isCompleted && (
                <View
                  className={`px-2 py-0.5 border rounded-full`}
                  style={{
                    backgroundColor: isCompleted
                      ? `${colors.accent}20`
                      : `${colors.accent}20`,
                    borderColor:
                      effectiveTheme === "dark"
                        ? colors.border
                        : colors.background,
                  }}
                >
                  <Text
                    className={`text-extra_small font-MuseoModerno_Bold capitalize`}
                    style={{
                      color: isCompleted
                        ? colors.secondaryText
                        : colors.secondaryText,
                    }}
                  >
                    {order.status}
                  </Text>
                </View>
              )}
            </View>

            {order.items.length > 1 && (
              <Text
                className="text-sm font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                and {order.items.length - 1} more item
                {order.items.length > 2 ? "s" : ""}
              </Text>
            )}
            <Text
              className="text-lg font-MuseoModerno_Bold mt-1"
              style={{ color: colors.text }}
            >
              ${order.total.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-end gap-2 h-full">
            {isCompleted ? (
              order.reviewed ? (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Text
                    className={`text-extra_small font-MuseoModerno_Bold capitalize`}
                    style={{
                      color: colors.secondaryText,
                    }}
                  >
                    Reviewed
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: `/(customer)/account/orders/leave-review`,
                      params: { orderId: order.id },
                    });
                  }}
                  className={`px-4 py-1 border rounded-lg`}
                  style={{
                    backgroundColor: isCompleted
                      ? `${colors.accent}`
                      : `${colors.accent}`,
                    borderColor: colors.accent,
                  }}
                >
                  <Text
                    className={`text-medium font-MuseoModerno_Bold capitalize`}
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : darkColors.text,
                    }}
                  >
                    Leave a Review
                  </Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: `/(customer)/account/orders/track`,
                    params: { orderId: order.id },
                  });
                }}
                className={`px-4 py-1 border rounded-lg`}
                style={{
                  backgroundColor: "#557754",
                  borderColor: colors.accent,
                }}
              >
                <Text
                  className={`text-medium font-MuseoModerno_Bold capitalize`}
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : darkColors.text,
                  }}
                >
                  Track Order
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

// Main Component
export default function MyOrdersScreen() {
  const { ongoingOrders, completedOrders, loading, error } = useOrders();
  const [activeTab, setActiveTab] = useState<"Ongoing" | "Completed">(
    "Ongoing"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const translateX = useSharedValue(0);

  const data = activeTab === "Ongoing" ? ongoingOrders : completedOrders;

  const renderEmptyState = useCallback(
    () => (
      <View className="flex-1 justify-center items-center px-6 mt-20">
        <Ionicons
          name={
            activeTab === "Ongoing"
              ? "hourglass-outline"
              : "checkmark-done-circle-outline"
          }
          size={50}
          color={colors.tertiaryText}
        />
        <Text
          className="text-lg font-MuseoModerno_Bold mt-4 text-center"
          style={{ color: colors.secondaryText }}
        >
          No {activeTab} Orders!
        </Text>
        <Text
          className="text-sm font-MuseoModerno_Regular mt-2 text-center"
          style={{ color: colors.tertiaryText }}
        >
          {activeTab === "Ongoing"
            ? "Your active orders and sales will appear here."
            : "Your completed orders and sales will be archived here."}
        </Text>
      </View>
    ),
    [activeTab, colors]
  );

  const renderOrderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard order={item} effectiveTheme={effectiveTheme} />
    ),
    [effectiveTheme]
  );

  const tabWidth = containerWidth ? (containerWidth - 4) / 2 : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withTiming(activeTab === "Ongoing" ? 0 : tabWidth, {
        duration: 250,
      });
    }
  }, [activeTab, tabWidth, translateX]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            className="mt-2 font-MuseoModerno_Regular"
            style={{ color: colors.secondaryText }}
          >
            Loading orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <ErrorState
        effectiveTheme={effectiveTheme}
        error="Failed to load orders. Please try again."
        onRetry={() => {}}
      />
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="flex-row p-1 rounded-full mx-4 my-2"
        style={{ backgroundColor: colors.card + "90" }}
        onLayout={onContainerLayout}
      >
        {containerWidth > 0 && (
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 2,
                top: 2,
                bottom: 2,
                borderRadius: 9999,
                width: tabWidth,
                backgroundColor: colors.accent,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1.41,
                elevation: 2,
              },
              animatedPillStyle,
            ]}
          />
        )}
        <TouchableOpacity
          onPress={() => setActiveTab("Ongoing")}
          className="flex-1 py-2 items-center justify-center"
          activeOpacity={0.7}
        >
          <Text
            className="font-MuseoModerno_SemiBold"
            style={{
              color:
                activeTab === "Ongoing"
                  ? darkColors.text
                  : colors.secondaryText,
            }}
          >
            Ongoing ({ongoingOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Completed")}
          className="flex-1 py-2 items-center justify-center"
          activeOpacity={0.7}
        >
          <Text
            className="font-MuseoModerno_SemiBold"
            style={{
              color:
                activeTab === "Completed"
                  ? darkColors.text
                  : colors.secondaryText,
            }}
          >
            Completed ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

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
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
