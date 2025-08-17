// app/(tabs)/home/_layout.tsx
import HeaderRightIcons from "@/src/components/Layout_Components";
import MessagesIcon from "@/src/components/MessagesIcon";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { useTheme } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function HomeStackLayout() {
  const { effectiveTheme } = useTheme();
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
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

        headerTintColor:
          effectiveTheme === "dark" ? darkColors.text : lightColors.text,

        contentStyle: {
          backgroundColor: "transparent",
        },
        headerRight: () => <HeaderRightIcons />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Discover",
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTitleStyle: {
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            fontFamily: "MuseoModerno_SemiBold",
            fontSize: 28,
          },
        }}
      />
      <Stack.Screen
        name="[pid]"
        options={{ headerShown: false, animation: "ios_from_right" }}
      />
      <Stack.Screen
        name="seller/[sellerId]"
        options={{
          animation: "slide_from_right",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
