import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMessaging } from "../context/MessagingContext";
import { useTheme } from "../context/ThemeContext";
import { darkColors, lightColors } from "../constants/Colors";

const MessagesIcon = ({ color }: { color?: string }) => {
  const router = useRouter();
  // Use the context to get the live unread count
  const { unreadCount } = useMessaging();
  const { effectiveTheme } = useTheme();

  const navigateToMessages = () => {
    router.push("/(messages)/messages");
  };

  return (
    <TouchableOpacity
      onPress={navigateToMessages}
      className="mr-4 relative"
      style={{
        paddingRight: unreadCount > 0 ? 5 : 0,
        paddingBottom: unreadCount > 0 ? 1 : 0,
      }}
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={28}
        color={
          color || effectiveTheme === "dark"
            ? darkColors.text
            : lightColors.text
        }
      />
      {unreadCount > 0 && (
        <View className="absolute -bottom-0 -right-0 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
          <Text className="text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MessagesIcon;
