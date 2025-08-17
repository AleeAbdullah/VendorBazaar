// app/(auth)/forgot-password.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const { resetPassword, loading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<{
    text: String;
    type: "Success" | "Error";
  } | null>(null);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      await resetPassword(email.trim());
      setMessage({
        text: "Password Reset Email Sent. If an account exists for this email, a link to reset your password has been sent. Please check your inbox (and spam folder).",
        type: "Success",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      if (error.code === "auth/invalid-email") {
        setMessage({
          text: "The email address you entered is not valid.",
          type: "Error",
        });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className=""
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-start",
            paddingTop: 40,
          }}
          className="h-full"
        >
          {router.canGoBack() && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-5 top-5 z-10 p-1"
            >
              <Ionicons name="arrow-back-outline" size={28} color="#0B6623" />
            </TouchableOpacity>
          )}
          <View className="h-full justify-between items-center px-6 py-5">
            {message?.type == "Success" ? (
              <View className="w-full flex flex-1 items-center justify-center gap-5">
                <View className={`w-full p-3 rounded-lg mb-4 `}>
                  <View
                    className="p-4 bg-primary mb-4 w-fit "
                    style={{ borderRadius: 400, alignSelf: "center" }}
                  >
                    <MaterialCommunityIcons
                      name="email-check"
                      size={90}
                      color="#fff"
                    />
                  </View>

                  <Text
                    className={`text-hero text-black font-MuseoModerno_SemiBold mb-4`}
                  >
                    Check Your Mail
                  </Text>
                  <Text className={`text-btn_title text-black mb-32`}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="justify-between items-center">
                <View className="w-full">
                  <View className="w-full flex flex-row items-center justify-center mb-6">
                    <Text
                      className="text-center font-MuseoModerno_Medium text-black mb-3 "
                      style={{ fontSize: 36 }}
                    >
                      Forgot password?
                    </Text>
                  </View>

                  <Text className="text-start text-medium text-gray-500 mb-8 px-4 leading-relaxed">
                    Enter your email for the verification process and we'll send
                    you a link to reset your password.
                  </Text>
                  <View className="min-w-full">
                    <Text className="text-start self-start ml-4 text-btn_title text-gray-800 font-medium mb-1.5">
                      Email
                    </Text>

                    <TextInput
                      className="w-full h-14 bg-gray-50 border border-gray-300 rounded-full px-4 mb-6 text-medium  text-gray-800 focus:border-primary"
                      placeholder="Enter your registered email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity
              className={`w-full h-14 mb-6 rounded-lg justify-center items-center ${
                loading ? "bg-primary-dark" : "bg-primary"
              }`}
              onPress={
                message?.type != "Success"
                  ? handleSendLink
                  : () => {
                      router.replace("/(auth)/login");
                    }
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-medium font-semibold ">
                  {message?.type != "Success"
                    ? "Send Reset Link"
                    : "Back to Login"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
