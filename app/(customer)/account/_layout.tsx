// app/(customer)/account/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";

export default function AccountStackLayout() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.headerBackground
              : lightColors.headerBackground,
        },
        headerTitleStyle: {
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          fontFamily: "MuseoModerno_SemiBold",
          fontSize: 22,
        },
        contentStyle: {
          backgroundColor: "transparent",
        },
        animation: "ios_from_right",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mx-4">
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                effectiveTheme === "dark" ? darkColors.text : lightColors.text
              }
            />
          </TouchableOpacity>
        ),
        // TODO: Notification-btn
        // headerRight: () => (
        //   <TouchableOpacity
        //     className="mr-4"
        //     onPress={() => router.push("/notifications")}
        //   >
        //     <Ionicons
        //       name="notifications-outline"
        //       size={24}
        //       color={
        //         effectiveTheme === "dark" ? darkColors.text : lightColors.text
        //       }
        //     />
        //   </TouchableOpacity>
        // ),
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" options={{ title: "Orders" }} />
      <Stack.Screen name="details" options={{ title: "My Details" }} />
      <Stack.Screen name="address-book" options={{ title: "Address Book" }} />
      <Stack.Screen
        name="following-sellers"
        options={{ title: "Following Sellers" }}
      />
    </Stack>
  );
}
