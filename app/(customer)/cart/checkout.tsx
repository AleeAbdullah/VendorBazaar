import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { CartItem } from "@/src/constants/types.product";
import { Address } from "@/src/constants/types.user";
import { SafeAreaView } from "react-native-safe-area-context";

// A compact version of the cart item for the summary view
const CheckoutItem = ({
  item,
  effectiveTheme,
}: {
  item: CartItem;
  effectiveTheme: string;
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View
      className="flex-row justify-between items-center py-2 border-b"
      style={{ borderColor: colors.border }}
    >
      <Text
        className="font-MuseoModerno_Regular"
        style={{ color: colors.text, flex: 1 }}
        numberOfLines={1}
      >
        {item.quantity} x {item.name}
      </Text>
      <Text className="font-MuseoModerno_Medium" style={{ color: colors.text }}>
        ${(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartItems, cartSubtotal, initiatePayment, isPaying, SHIPPING_FEE } =
    useCart();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(
    undefined
  );
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Set the default address when the component mounts
    const defaultAddress =
      user?.address?.find((addr) => addr.isDefault) || user?.address?.[0];
    setSelectedAddress(defaultAddress);
  }, [user]);

  const VAT_RATE = 0.0;
  const total = cartSubtotal * (1 + VAT_RATE) + SHIPPING_FEE;

  const handleProceedToPayment = async () => {
    if (!selectedAddress) {
      Alert.alert(
        "No Address",
        "Please select a shipping address before proceeding."
      );
      return;
    }

    try {
      // Pass the selected address to the payment function
      const paymentUrl = await initiatePayment({ address: selectedAddress });
      if (typeof paymentUrl !== "string" || !paymentUrl) {
        throw new Error("Could not retrieve payment link.");
      }
      router.push({
        pathname: "/(customer)/cart/payment",
        params: { url: paymentUrl },
      });
    } catch (e: any) {
      Alert.alert(
        "Payment Error",
        e.message || "Could not start the payment process."
      );
    }
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-lg border mb-3"
      style={{
        backgroundColor: colors.card,
        borderColor:
          selectedAddress?.fullAddress === item.fullAddress
            ? colors.accent
            : colors.border,
      }}
      onPress={() => {
        setSelectedAddress(item);
        setModalVisible(false);
      }}
    >
      <Ionicons
        name={
          selectedAddress?.fullAddress === item.fullAddress
            ? "radio-button-on"
            : "radio-button-off"
        }
        size={24}
        color={colors.accent}
      />
      <View className="ml-4 flex-1">
        <Text
          className="text-base font-MuseoModerno_Medium"
          style={{ color: colors.text }}
        >
          {item.nickname}
        </Text>
        <Text
          className="text-sm font-MuseoModerno_Regular"
          style={{ color: colors.secondaryText }}
        >
          {item.fullAddress}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <Modal
        animationType="slide"
        navigationBarTranslucent={false}
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/50">
          <View
            className="p-5 m-5 rounded-2xl max-h-[60%]"
            style={{ backgroundColor: colors.background }}
          >
            <Text
              className="text-xl font-MuseoModerno_SemiBold mb-5 text-center"
              style={{ color: colors.text }}
            >
              Select Address
            </Text>
            <FlatList
              data={user?.address || []}
              renderItem={renderAddressItem}
              keyExtractor={(item, index) => `${item.fullAddress}-${index}`}
            />
            <TouchableOpacity
              className="flex-row items-center justify-center p-4 rounded-full mt-3"
              style={{ backgroundColor: colors.accent }}
              onPress={() => {
                setModalVisible(false);
                router.push("/(customer)/account/address-book");
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.text}
              />
              <Text
                className="text-base font-MuseoModerno_SemiBold ml-2.5"
                style={{ color: colors.text }}
              >
                Add New Address
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => setModalVisible(false)}
            >
              <Text
                className="font-MuseoModerno_Medium"
                style={{ color: colors.accent }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Shipping Address Section */}
        <View
          className="p-4 m-4 rounded-lg"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-lg font-MuseoModerno_SemiBold"
              style={{ color: colors.text }}
            >
              Shipping Address
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text
                className="font-MuseoModerno_Medium"
                style={{ color: colors.tertiaryText }}
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View>
              <Text
                className="font-MuseoModerno_Medium text-base"
                style={{ color: colors.text }}
              >
                {user?.fullName}
              </Text>
              <Text
                className="font-MuseoModerno_Regular"
                style={{ color: colors.secondaryText }}
              >
                {selectedAddress.fullAddress}
              </Text>
            </View>
          ) : (
            <Text
              className="font-MuseoModerno_Regular"
              style={{ color: colors.secondaryText }}
            >
              No address selected. Please add one.
            </Text>
          )}
        </View>

        {/* Order Summary Section */}
        <View
          className="p-4 m-4 rounded-lg"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-lg font-MuseoModerno_SemiBold mb-2"
            style={{ color: colors.text }}
          >
            Order Summary
          </Text>
          {cartItems.map((item) => (
            <CheckoutItem
              key={item.pid}
              item={item}
              effectiveTheme={effectiveTheme}
            />
          ))}
        </View>

        {/* Cost Breakdown Section */}
        <View
          className="p-4 m-4 rounded-lg"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-between mb-2">
            <Text
              className="font-MuseoModerno_Regular"
              style={{ color: colors.secondaryText }}
            >
              Sub-total
            </Text>
            <Text
              className="font-MuseoModerno_Medium"
              style={{ color: colors.secondaryText }}
            >
              ${cartSubtotal.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text
              className="font-MuseoModerno_Regular"
              style={{ color: colors.secondaryText }}
            >
              Shipping Fee
            </Text>
            <Text
              className="font-MuseoModerno_Medium"
              style={{ color: colors.secondaryText }}
            >
              ${SHIPPING_FEE.toFixed(2)}
            </Text>
          </View>
          <View
            className="h-px my-2"
            style={{ backgroundColor: colors.border }}
          />
          <View className="flex-row justify-between mt-2">
            <Text
              className="text-lg font-MuseoModerno_SemiBold"
              style={{ color: colors.text }}
            >
              Total
            </Text>
            <Text
              className="text-lg font-MuseoModerno_SemiBold"
              style={{ color: colors.text }}
            >
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4 border-t"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <TouchableOpacity
          className="rounded-full p-4 flex-row justify-center items-center"
          style={{
            backgroundColor: colors.accent,
            opacity: isPaying ? 0.7 : 1,
          }}
          onPress={handleProceedToPayment}
          disabled={isPaying}
        >
          {isPaying ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text
                className="text-lg font-MuseoModerno_SemiBold"
                style={{ color: "white" }}
              >
                Proceed to Payment
              </Text>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
