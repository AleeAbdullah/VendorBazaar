// app/_layout.tsx

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useNavigation, useRouter, useSegments } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

import "@/global.css";

import LoadingScreen from "@/src/screens/LoadingScreen";

import { NotificationProvider } from "@/src/context/NotificationContext";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchProvider } from "@/src/context/SearchContext";
import { OrderProvider } from "@/src/context/OrderContext";
import { MessagingProvider } from "@/src/context/MessagingContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { setStatusBarStyle, StatusBar } from "expo-status-bar";
import { darkColors, lightColors } from "@/src/constants/Colors";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ToastProvider } from "@/src/context/ToastContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(login)",
};

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AppFonts = {
  SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),

  MuseoModerno_BoldItalic: require("../assets/fonts/MuseoModerno-BoldItalic.ttf"),
  MuseoModerno_Bold: require("../assets/fonts/MuseoModerno-Bold.ttf"),
  MuseoModerno_SemiBoldItalic: require("../assets/fonts/MuseoModerno-SemiBoldItalic.ttf"),
  MuseoModerno_SemiBold: require("../assets/fonts/MuseoModerno-SemiBold.ttf"),
  MuseoModerno_Regular: require("../assets/fonts/MuseoModerno-Regular.ttf"),
  MuseoModerno_italic: require("../assets/fonts/MuseoModerno-Italic.ttf"),
  MuseoModerno_MediumItalic: require("../assets/fonts/MuseoModerno-MediumItalic.ttf"),
  MuseoModerno_Medium: require("../assets/fonts/MuseoModerno-Medium.ttf"),
  MuseoModerno_LightItalic: require("../assets/fonts/MuseoModerno-LightItalic.ttf"),
  MuseoModerno_Light: require("../assets/fonts/MuseoModerno-Light.ttf"),

  Fredoka_Regular: require("../assets/fonts/Fredoka-Regular.ttf"),
  Fredoka_Medium: require("../assets/fonts/Fredoka-Medium.ttf"),
  Fredoka_SemiBold: require("../assets/fonts/Fredoka-SemiBold.ttf"),

  ...FontAwesome.font,
};

function RootLayoutNav() {
  const { user, initialAuthLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigation = useNavigation();
  const navigationState = navigation.getState();

  const [fontsLoaded, fontError] = useFonts(AppFonts);

  const { effectiveTheme } = useTheme();

  useEffect(() => {
    setStatusBarStyle(effectiveTheme === "dark" ? "light" : "dark");
  }, [effectiveTheme]);

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !initialAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialAuthLoading]);

  // useeffect to handle navigation
  useEffect(() => {
    console.log("Handling navigation based on user state and segments");
    const isRouterReady = navigationState?.key != null;

    if (!isRouterReady || initialAuthLoading) {
      return; // Wait for router and auth to be ready
    }

    const inAuthGroup = segments[0] === "(auth)";

    // If the user is not signed in and not in the auth group, redirect them.
    if (!user && !inAuthGroup) {
      console.log("No user. Redirecting to login.");
      router.replace("/(auth)/login");
      return;
    }

    // If the user is signed in, handle routing
    if (user) {
      const inOnboardingGroup = segments[0] === "(onboarding)";

      // If onboarding is not complete, redirect to onboarding.
      if (user.OnboardingCompleted === "false") {
        if (!inOnboardingGroup) {
          console.log("User not onboarded. Redirecting to onboarding.");
          router.replace("/(onboarding)");
        }
        return; // Stop further execution
      }

      // If user is onboarded and is in a public group (auth/onboarding), redirect to home.
      if (inAuthGroup || inOnboardingGroup) {
        if (user.role === "seller") {
          console.log("Redirecting seller to home.");
          router.replace("/(seller)/home");
        } else {
          console.log("Redirecting customer to home.");
          router.replace("/(customer)/home");
        }
      }
    }
  }, [user, segments, initialAuthLoading, router, navigationState]);

  if (!fontsLoaded || initialAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    // <SafeAreaView
    //   style={{
    //     flex: 1,
    //     backgroundColor:
    //       effectiveTheme === "dark"
    //         ? darkColors.headerBackground
    //         : lightColors.headerBackground,
    //   }}
    // >
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        },
      }}
      initialRouteName="(auth)"
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="(customer)"
        options={{
          contentStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.background
                : lightColors.background,
          },
        }}
      />
      <Stack.Screen
        name="(seller)"
        options={{
          contentStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.background
                : lightColors.background,
          },
        }}
      />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen
        name="(messages)"
        options={{
          presentation: "modal",
          headerShown: false,
          contentStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.background
                : lightColors.background,
          },
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Notifications",
          headerTitleAlign: "left",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.headerBackground
                : lightColors.headerBackground,
          },
          headerTitleStyle: {
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
            fontFamily: "MuseoModerno_SemiBold",
            fontSize: 22,
          },

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

          animation: "ios_from_right",
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
    // </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <MessagingProvider>
                <NotificationProvider>
                  <SearchProvider>
                    <OrderProvider>
                      <RootLayoutNav />
                    </OrderProvider>
                  </SearchProvider>
                </NotificationProvider>
              </MessagingProvider>
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
