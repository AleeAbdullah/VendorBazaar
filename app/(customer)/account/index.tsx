// app/(customer)/account/index.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { MenuItem } from "@/app/(seller)/account";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { Theme } from "@/src/constants/types.user";

const ThemeToggle = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [slideAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    const position = theme === "light" ? 0 : theme === "dark" ? 1 : 2;
    Animated.spring(slideAnim, {
      toValue: position,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const getIconColor = (themeOption: Theme) => {
    if (theme === themeOption) {
      return effectiveTheme === "dark" ? darkColors.text : lightColors.text;
    }
    return effectiveTheme === "dark" ? "#666" : "#999";
  };

  const toggleWidth = 300;
  const buttonWidth = (toggleWidth - 8) / 3;

  return (
    <View
      className="overflow-hidden rounded-t-2xl border"
      style={{
        borderColor:
          effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      }}
    >
      <View
        className="p-4"
        style={{
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.card : lightColors.card,
        }}
      >
        <Text
          className="text-btn_title font-MuseoModerno_Regular mb-3"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          Appearance
        </Text>

        <View
          className="relative rounded-xl p-1"
          style={{
            backgroundColor: effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
            width: toggleWidth,
            alignSelf: "center",
          }}
        >
          {/* Sliding indicator */}
          <Animated.View
            className="absolute rounded-lg"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? "#374151" : "#ffffff",
              width: buttonWidth,
              height: 33,
              top: 4,
              left: 4,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, buttonWidth, buttonWidth * 2],
                  }),
                },
              ],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
          />

          <View className="flex-row">
            {/* Light Theme Button */}
            <TouchableOpacity
              onPress={() => handleThemeChange("light")}
              className="flex-1 items-center justify-center py-2"
              style={{ width: buttonWidth }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="sunny-outline"
                  size={20}
                  color={getIconColor("light")}
                />
                <Text
                  className="ml-1.5 text-sm font-medium"
                  style={{ color: getIconColor("light") }}
                >
                  Light
                </Text>
              </View>
            </TouchableOpacity>

            {/* Dark Theme Button */}
            <TouchableOpacity
              onPress={() => handleThemeChange("dark")}
              className="flex-1 items-center justify-center py-2"
              style={{ width: buttonWidth }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color={getIconColor("dark")}
                />
                <Text
                  className="ml-1.5 text-sm font-medium"
                  style={{ color: getIconColor("dark") }}
                >
                  Dark
                </Text>
              </View>
            </TouchableOpacity>

            {/* System Theme Button */}
            <TouchableOpacity
              onPress={() => handleThemeChange("system")}
              className="flex-1 items-center justify-center py-2"
              style={{ width: buttonWidth }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={getIconColor("system")}
                />
                <Text
                  className="ml-1.5 text-sm font-medium"
                  style={{ color: getIconColor("system") }}
                >
                  Auto
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, loading, user } = useAuth();
  const { effectiveTheme } = useTheme();

  const isSeller = user?.role === "seller";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView className="flex-1 px-3">
      <ScrollView>
        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          <ThemeToggle />
          {isSeller && (
            <MenuItem
              iconComponent={
                <MaterialCommunityIcons
                  name="account-switch-outline"
                  size={26}
                  color="#0b6649"
                />
              }
              effectiveTheme={effectiveTheme}
              text="Switch to Selling"
              onPress={() => router.replace("/(seller)/home")}
            />
          )}
          <MenuItem
            icon="cube-outline"
            text="My Orders"
            onPress={() => router.push("/(customer)/account/orders")}
            effectiveTheme={effectiveTheme}
          />
        </View>

        {/* Account Section - Updated Paths */}
        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          <MenuItem
            icon="person-outline"
            text="My Details"
            onPress={() => router.push("/(customer)/account/details")}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="home-outline"
            text="Address Book"
            onPress={() => {
              router.push("/(customer)/account/address-book");
            }}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="people-outline"
            text="Following Sellers"
            onPress={() => {
              router.push("/(customer)/account/following-sellers");
            }}
            effectiveTheme={effectiveTheme}
          />
        </View>

        <View
          className="my-4 overflow-hidden rounded-2xl gap-y-0.5 border"
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
          }}
        >
          {/* Support Section */}
          <MenuItem
            icon="help-circle-outline"
            text="FAQs"
            onPress={() => {}}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            icon="headset-outline"
            text="Help Center"
            onPress={() => {}}
            effectiveTheme={effectiveTheme}
          />
        </View>

        <View className="my-4 rounded-[10px] overflow-hidden">
          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center p-6 px-8 rounded-2xl shadow-lg border"
            disabled={loading}
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              elevation: 5,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            )}
            <Text className="text-[17px] text-red-500 ml-4">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
