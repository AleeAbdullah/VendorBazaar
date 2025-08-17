// app/(onboarding)/index.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";

const onboardingIllustration = require("../../assets/images/auth/onboardingIllustration.webp");

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleProceed = async () => {
    setLoading(true);
    try {
      router.push("/(onboarding)/from");
    } catch (e) {
      console.error("OnboardingScreen: Failed to save onboarding status", e);
      router.replace("/(auth)/signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 h-screen w-screen">
        <View className="items-center justify-start h-[78%] relative ">
          <Text
            className="text-[60px] font-Fredoka_SemiBold text-[#063e2a] mb-4 text-start"
            style={{
              lineHeight: Platform.OS === "ios" ? 70 : 60,
            }}
          >
            Find everything at one place
          </Text>
          <View className="w-full absolute bottom-0 opacity-90 -z-10">
            <Image
              source={onboardingIllustration}
              className="self-center h-[400px]"
              resizeMode="contain"
            />
          </View>
        </View>

        <View className="w-full flex-1 justify-end pb-5 items-center">
          <Text className="text-small text-gray-500 mb-6 text-center font-sans">
            Verifying your email address helps you to safely recover your
            password and retrieve your account.
          </Text>
          <TouchableOpacity
            onPress={handleProceed}
            className={`w-[90%] py-3.5 rounded-lg items-center justify-center shadow-md mb-2 ${
              loading ? "bg-green-400" : "bg-primary"
            }`}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-white text-btn_title font-semibold">
                  Sign Up for Marketplace
                </Text>
                <AntDesign name="arrowright" size={24} color={"white"} />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-small text-gray-400 text-center ">
            By continuing, you agree to the Marketplace{" "}
            <Text className="text-primary">Terms of Agreement</Text>
            and acknowledge the Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
