// app/(customer)/account/orders/leave-review.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
// You would also fetch the order details to get product/seller info if not passed via params
// For now, we'll use placeholder data

const StarRating = ({
  rating,
  setRating,
}: {
  rating: number;
  setRating: (rating: number) => void;
}) => (
  <View className="flex-row justify-center my-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        className="p-2"
      >
        <Ionicons
          name={index < rating ? "star" : "star-outline"}
          size={36}
          color={index < rating ? "#FFC107" : "gray"}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function LeaveReviewScreen() {
  const { orderId, productId, sellerId } = useLocalSearchParams<{
    orderId: string;
    productId: string;
    sellerId: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !reviewText.trim()) {
      Alert.alert("Incomplete", "Please provide a star rating and a comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        orderId,
        createdAt: Timestamp.now(),
        productId,
        rating,
        reviewText,
        reported: false,
        sellerId,
        userId: user?.uid,
        userName: user?.fullName,
        userPhoto: user?.photoURL,
      };

      const reviewsRef = collection(db, "reviews");
      await addDoc(reviewsRef, reviewData);

      Alert.alert("Success", "Your review has been submitted!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Could not submit your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: "Leave a Review",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="p-4">
        <Text className="text-center text-lg font-medium mb-2">
          How was your order?
        </Text>
        <Text className="text-center text-gray-500">
          Please give your rating and also your review
        </Text>

        <StarRating rating={rating} setRating={setRating} />

        <TextInput
          placeholder="Write your review..."
          multiline
          value={reviewText}
          onChangeText={setReviewText}
          className="h-32 border border-gray-300 rounded-lg p-3 text-base leading-6 bg-gray-50"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`bg-primary rounded-lg p-4 mt-6 ${
            isSubmitting ? "opacity-50" : ""
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-base">
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
