// app/(auth)/signup.tsx
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

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp, loading } = useAuth();
  const router = useRouter();

  const { signInWithGoogle } = useAuth();

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters long.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      await signUp(email.trim(), password, fullName.trim());
    } catch (error: any) {
      console.error("Signup failed:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "This email address is already registered. Please try logging in.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address you entered is not valid.";
            break;
          case "auth/weak-password":
            errorMessage =
              "The password is too weak. Please choose a stronger one (at least 6 characters).";
            break;
          default:
            errorMessage =
              error.message || "Failed to create account. Please try again.";
        }
      }
      Alert.alert("Signup Failed", errorMessage);
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
    <SafeAreaView className="bg-white h-full">
      <KeyboardAvoidingView
        className="flex"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="">
          <View className="justify-start px-6 py-5">
            <Text className="text-hero font-bold text-black mb-2 text-center font-display">
              Create an account
            </Text>
            <Text className="text-medium text-gray-500 mb-6 text-center font-sans">
              Let's create your account.
            </Text>

            <View className="w-full">
              <Text className="text-btn_title text-gray-800 font-sans font-medium mb-1.5">
                Full Name
              </Text>
              <TextInput
                className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg px-4 mb-3 text-medium font-sans text-gray-800 focus:border-primary"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                placeholderTextColor="#A0AEC0"
              />
              <Text className="text-btn_title text-gray-800 font-sans font-medium mb-1.5">
                Email
              </Text>
              <TextInput
                className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg px-4 mb-3 text-medium font-sans text-gray-800 focus:border-primary"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0AEC0"
              />
              <Text className="text-btn_title text-gray-800 font-sans font-medium mb-1.5">
                Password
              </Text>
              <View className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg flex-row items-center px-4 mb-3 focus-within:border-primary">
                <TextInput
                  className="flex-1 h-full text-medium font-sans text-gray-800"
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
              <Text className="text-btn_title text-gray-800 font-sans font-medium mb-1.5">
                Confirm Password
              </Text>
              <View className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg flex-row items-center px-4 mb-4 focus-within:border-primary">
                <TextInput
                  className="flex-1 h-full text-medium font-sans text-gray-800"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#A0AEC0"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="pl-2.5"
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#718096"
                  />
                </TouchableOpacity>
              </View>

              <Text className="text-extra_small text-gray-500 mb-5 text-center font-sans leading-normal">
                By signing up you agree to our Terms, Privacy Policy, and Cookie
                Use.
              </Text>

              <TouchableOpacity
                className={`w-full h-12 rounded-lg justify-center items-center mb-4 flex-row ${
                  loading ? "bg-primary-dark" : "bg-primary"
                }`}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-medium font-semibold font-sans">
                    Create an Account
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
                className="w-full h-12 rounded-lg justify-center items-center mb-4 flex-row bg-white border border-gray-300"
                onPress={() => {
                  handleGoogleSignIn();
                }}
              >
                <Ionicons name="logo-google" size={22} className="mr-2.5" />
                <Text className="text-gray-800 text-medium font-medium font-sans">
                  Sign Up with Google
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
                  Sign Up with Facebook
                </Text>
              </TouchableOpacity> */}

              <View className="mt-6 flex-row justify-center items-center">
                <Text className="text-gray-500 text-small font-sans">
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-action-green font-semibold text-small font-sans">
                      Log In
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
