// app/(seller)/home/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSellerDashboard } from "@/src/context/seller/SellerDashboardContext";
import { useAuth } from "@/src/context/AuthContext";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { formatTimestamp } from "@/src/helpers/formatDate";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Seller } from "@/src/constants/types.seller";
import MessagesIcon from "@/src/components/MessagesIcon";

// Metric Card Component with proper theming
const MetricCard = ({
  title,
  value,
  icon,
  color,
  effectiveTheme,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color?: string;
  effectiveTheme: "light" | "dark";
}) => (
  <View className="flex-1">
    <View
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor:
          effectiveTheme === "dark" ? darkColors.card : lightColors.card,
        borderColor:
          effectiveTheme === "dark" ? darkColors.border : lightColors.border,
        shadowColor: effectiveTheme === "dark" ? "#ffffff10" : "#00000010",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{
            backgroundColor: color
              ? `${color}20`
              : effectiveTheme === "dark"
              ? "#ffffff10"
              : "#00000010",
          }}
        >
          <Ionicons
            name={icon}
            size={20}
            color={
              color ||
              (effectiveTheme === "dark"
                ? darkColors.accent
                : lightColors.accent)
            }
          />
        </View>
      </View>
      <Text
        className="text-2xl font-bold mb-1"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {value}
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
        {title}
      </Text>
    </View>
  </View>
);

// Activity Item Card with improved styling
const ActivityItemCard = ({
  item,
  effectiveTheme,
}: {
  item: any;
  effectiveTheme: "light" | "dark";
}) => {
  const isOrder = item.type === "order";
  const iconColor = isOrder ? "#10b981" : "#f59e0b";

  return (
    <View className="flex-row items-center p-4">
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{
          backgroundColor: `${iconColor}20`,
        }}
      >
        <Ionicons
          name={isOrder ? "cart-outline" : "star"}
          size={24}
          color={iconColor}
        />
      </View>
      <View className="flex-1 ml-4">
        <Text
          className="text-base font-medium"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {item.title}
        </Text>
        <Text
          className="text-sm mt-0.5"
          style={{
            color:
              effectiveTheme === "dark"
                ? darkColors.secondaryText
                : lightColors.secondaryText,
          }}
        >
          {item.subtitle}
        </Text>
      </View>
      <Text
        className="text-xs"
        style={{
          color:
            effectiveTheme === "dark"
              ? darkColors.secondaryText
              : lightColors.secondaryText,
        }}
      >
        {formatTimestamp(item.createdAt)}
      </Text>
    </View>
  );
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const { metrics, activities, loading, error } = useSellerDashboard();
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { top } = useSafeAreaInsets();

  // console.log(metrics);
  // console.log(activities);

  // Fetch seller profile
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!user || user.role !== "seller") {
        setLoadingProfile(false);
        return;
      }

      try {
        const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
        if (sellerDoc.exists()) {
          setSellerProfile({
            sid: sellerDoc.id,
            ...sellerDoc.data(),
          } as Seller);
        }
      } catch (error) {
        console.error("Error fetching seller profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchSellerProfile();
  }, [user]);

  if (loading || loadingProfile) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={
            effectiveTheme === "dark" ? darkColors.accent : lightColors.accent
          }
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center p-5"
        style={{
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        }}
      >
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className="text-red-500 text-center mt-4">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    // <SafeAreaView
    //   className="flex-1"
    //   style={{
    //     backgroundColor:
    //       effectiveTheme === "dark"
    //         ? darkColors.background
    //         : lightColors.background,
    //   }}
    // >
    <>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
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
                  Dashboard
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-5 py-6">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text
                className="text-2xl font-MuseoModerno_Medium"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Welcome back, {user?.fullName?.split(" ")[0] || "Seller"}!
              </Text>
            </View>
            {sellerProfile?.verified && (
              <View
                className="px-3 py-1.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark" ? "#10b98120" : "#10b98115",
                }}
              >
                <MaterialIcons name="verified" size={16} color="#10b981" />
                <Text
                  className="text-xs ml-1 font-medium"
                  style={{ color: "#10b981" }}
                >
                  Verified
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Key Metrics Section */}
        <View className="px-5 mb-6">
          <Text
            className="text-lg font-semibold mb-3"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            Today's Performance
          </Text>
          <View className="flex-row gap-3">
            <MetricCard
              title="Sales Today"
              value={`R${metrics.totalSales.toFixed(2)}`}
              icon="cash-outline"
              color="#10b981"
              effectiveTheme={effectiveTheme}
            />
            <MetricCard
              title="New Orders"
              value={metrics.orderStatusCounts.paid}
              icon="cart-outline"
              color="#3b82f6"
              effectiveTheme={effectiveTheme}
            />
          </View>
        </View>

        {/* Shop Stats */}
        {sellerProfile && (
          <View className="px-5 mb-6">
            <Text
              className="text-lg font-semibold mb-3"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              Shop Statistics
            </Text>
            <View
              className="rounded-2xl p-4 border"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.card
                    : lightColors.card,
                borderColor:
                  effectiveTheme === "dark"
                    ? darkColors.border
                    : lightColors.border,
              }}
            >
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text
                    className="text-2xl font-bold"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : lightColors.text,
                    }}
                  >
                    {sellerProfile.totalProducts}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    Products
                  </Text>
                </View>
                <View className="w-px bg-gray-200 dark:bg-gray-700" />
                <View className="items-center flex-1">
                  <Text
                    className="text-2xl font-bold"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : lightColors.text,
                    }}
                  >
                    {sellerProfile.totalFollowers}
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    Followers
                  </Text>
                </View>
                <View className="w-px bg-gray-200 dark:bg-gray-700" />
                <View className="items-center flex-1">
                  <View className="flex-row items-center">
                    <Text
                      className="text-2xl font-bold"
                      style={{
                        color:
                          effectiveTheme === "dark"
                            ? darkColors.text
                            : lightColors.text,
                      }}
                    >
                      {sellerProfile.avgRating.toFixed(1)}
                    </Text>
                    <Ionicons
                      name="star"
                      size={18}
                      color="#f59e0b"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                  <Text
                    className="text-sm mt-1"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    Rating
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text
            className="text-lg font-semibold mb-3"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            Quick Actions
          </Text>
          <View
            className="rounded-2xl overflow-hidden border"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(seller)/orders")}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor: "#3b82f620",
                  }}
                >
                  <Ionicons name="cube-outline" size={20} color="#3b82f6" />
                </View>
                <Text
                  className="text-base"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  Orders to Process
                </Text>
              </View>
              <View className="flex-row items-center">
                <View
                  className="px-2 py-1 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      metrics.newOrders > 0 ? "#ef444420" : "transparent",
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color:
                        metrics.newOrders > 0
                          ? "#ef4444"
                          : effectiveTheme === "dark"
                          ? darkColors.secondaryText
                          : lightColors.secondaryText,
                    }}
                  >
                    {metrics.newOrders}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText
                  }
                />
              </View>
            </TouchableOpacity>

            <View
              className="h-px mx-4"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.border
                    : lightColors.border,
              }}
            />

            <TouchableOpacity
              onPress={() => router.push("/(seller)/products")}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor: "#10b98120",
                  }}
                >
                  <Ionicons name="pricetag-outline" size={20} color="#10b981" />
                </View>
                <Text
                  className="text-base"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  Manage Products
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-5 mb-6">
          <Text
            className="text-lg font-semibold mb-3"
            style={{
              color:
                effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            }}
          >
            Recent Activity
          </Text>
          <View
            className="rounded-2xl overflow-hidden border"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            {activities.length > 0 ? (
              <FlatList
                data={activities.slice(0, 5)}
                renderItem={({ item }) => (
                  <ActivityItemCard
                    item={item}
                    effectiveTheme={effectiveTheme}
                  />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => (
                  <View
                    className="h-px mx-4"
                    style={{
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? darkColors.border
                          : lightColors.border,
                    }}
                  />
                )}
              />
            ) : (
              <View className="p-8 items-center">
                <MaterialIcons
                  name="inbox"
                  size={48}
                  color={effectiveTheme === "dark" ? "#666" : "#999"}
                />
                <Text
                  className="text-center mt-3"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.secondaryText
                        : lightColors.secondaryText,
                  }}
                >
                  No recent activity
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
    // </SafeAreaView>
  );
}
