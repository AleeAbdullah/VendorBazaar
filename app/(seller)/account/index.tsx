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
  Image,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { Theme } from "@/src/constants/types.user";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reusable list item component for the menu
export const MenuItem = ({
  icon,
  iconComponent,
  text,
  onPress,
  isDestructive = false,
  effectiveTheme,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconComponent?: React.ReactNode;
  text: string;
  onPress: () => void;
  isDestructive?: boolean;
  effectiveTheme: "light" | "dark";
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center py-4 px-2"
    activeOpacity={0.7}
    style={{
      backgroundColor:
        effectiveTheme === "dark" ? darkColors.card : lightColors.card,
    }}
  >
    {iconComponent ? (
      iconComponent
    ) : icon ? (
      <Ionicons
        name={icon}
        size={24}
        backgroundColor="#55775450"
        className="p-2 rounded-full"
        color={
          isDestructive
            ? "#ef4444"
            : effectiveTheme === "dark"
            ? darkColors.text
            : lightColors.accent
        }
      />
    ) : null}
    <Text
      className={`text-[17px]  ml-4 font-Fredoka_Regular `}
      style={{
        color: isDestructive
          ? "#ef4444"
          : effectiveTheme === "dark"
          ? darkColors.text
          : lightColors.text,
      }}
    >
      {text}
    </Text>
    {!isDestructive && (
      <Ionicons
        name="chevron-forward-outline"
        size={22}
        color={
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText
        }
        className="ml-auto"
      />
    )}
  </TouchableOpacity>
);

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
  const { signOut, loading } = useAuth();
  const { effectiveTheme } = useTheme();
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView className="flex-1 px-3">
      <Stack.Screen
        options={{
          title: user?.fullName || "Account",
          headerTitleStyle: {
            color: darkColors.text,
            fontFamily: "MuseoModerno_SemiBold",
            fontSize: 22,
          },

          header: () => (
            <View
              className=" relative"
              style={{
                backgroundColor: "#557754",
                height: top + 60,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  paddingTop: top,
                  paddingInline: 16,
                  paddingBottom: 36,
                  zIndex: 20,
                }}
              >
                <View className="flex-row items-center justify-start gap-4">
                  {user?.photoURL ? (
                    <Image
                      source={{ uri: user?.photoURL }}
                      className="w-12 h-12 rounded-full"
                      style={{ resizeMode: "contain" }}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="account-circle-outline"
                      size={48}
                      color="#fff"
                    />
                  )}
                  <View className="flex-col items-start  mb-2">
                    <Text
                      className="text-heading font-MuseoModerno_SemiBold"
                      style={{ color: "#fff" }}
                    >
                      {user?.fullName || "Account"}
                    </Text>

                    <Text
                      className="text-medium font-MuseoModerno_Medium"
                      style={{ color: "#ffffff80" }}
                    >
                      {user?.email}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: -20,
                  height: 40,
                  width: "100%",
                  backgroundColor: "#557754",
                  flexDirection: "row",
                  borderRadius: 1000,
                }}
              />
            </View>
          ),
        }}
      />
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
          <MenuItem
            iconComponent={
              <MaterialCommunityIcons
                name="account-switch-outline"
                size={26}
                color="#0b6649"
              />
            }
            text="Switch to Buying"
            onPress={() => router.replace("/(customer)/home")}
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
          <ThemeToggle />
          <MenuItem
            icon="person-outline"
            text="My Details"
            onPress={() => router.push("/(seller)/account/details")}
            effectiveTheme={effectiveTheme}
          />
          <MenuItem
            iconComponent={
              <AntDesign
                name="notification"
                size={24}
                backgroundColor="#55775450"
                className="p-2 rounded-full"
                color={
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.accent
                }
              />
            }
            text="Send Notifications"
            onPress={() => router.push("/(seller)/account/send-notifications")}
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
