// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            errorMessage =
              "Invalid email or password. Please check your credentials.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address you entered is not valid.";
            break;
          case "auth/user-disabled":
            errorMessage = "This user account has been disabled.";
            break;
          case "auth/too-many-requests":
            errorMessage =
              "Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.";
            break;
          default:
            errorMessage =
              error.message || "Failed to log in. Please try again.";
        }
      }
      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // The context itself handles most errors, but you can add more here if needed
      console.error("Google Sign-In button press error", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <View className="justify-center px-6 py-5">
            <Text className="text-hero font-bold text-black mb-2 text-center font-display">
              Safe Buy Africa
            </Text>
            <Text className="text-medium text-gray-500 mb-8 text-center font-sans">
              It's great to see you again.
            </Text>

            <View className="w-full">
              <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                Email
              </Text>
              <TextInput
                className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg px-4 mb-4 text-medium text-gray-800 focus:border-primary"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0AEC0"
              />
              <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                Password
              </Text>
              <View className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg flex-row items-center px-4 mb-2 focus-within:border-primary">
                <TextInput
                  className="flex-1 h-full text-medium text-gray-800"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#A0AEC0"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="pl-2.5"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#718096"
                  />
                </TouchableOpacity>
              </View>

              <View className="w-full items-end mb-6">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-action-green font-semibold text-small font-sans">
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <TouchableOpacity
                className={`w-full h-12 rounded-lg justify-center items-center mb-4 flex-row ${
                  loading ? "bg-primary-dark" : "bg-primary"
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-btn_title font-semibold font-sans">
                    Login
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500 font-sans text-small">
                  Or
                </Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignIn}
                className="w-full h-12 rounded-lg justify-center items-center mb-4 flex-row bg-white border border-gray-300"
              >
                <Ionicons name="logo-google" size={22} className="mr-2.5" />
                <Text className="text-gray-800 text-medium font-medium font-sans">
                  Login with Google
                </Text>
              </TouchableOpacity>
              {/* <TouchableOpacity className="w-full h-12 rounded-lg justify-center items-center mb-4 flex-row bg-[#1877F2] border border-[#1877F2]">
                <Ionicons
                  name="logo-facebook"
                  size={22}
                  color="#FFFFFF"
                  className="mr-2.5"
                />
                <Text className="text-white text-medium font-medium font-sans">
                  Login with Facebook
                </Text>
              </TouchableOpacity> */}

              <View className="mt-6 flex-row justify-center items-center">
                <Text className="text-gray-500 text-small font-sans">
                  Don't have an account?{" "}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text className="text-action-green font-semibold text-small font-sans">
                      Join
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
