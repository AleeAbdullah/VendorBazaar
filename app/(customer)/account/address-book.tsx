// app/(customer)/account/address-book.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Address } from "@/src/constants/types.user";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AddressBookScreen() {
  const router = useRouter();
  const { user, ReFetchUser } = useAuth();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const [addresses, setAddresses] = useState<Address[]>(user?.address || []);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Address>({
    nickname: "",
    fullAddress: "",
    latitude: 0,
    longitude: 0,
    isDefault: false,
  });

  const mapRef = useRef<MapView>(null);

  const [locating, setLocating] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  const modalBackdropAnim = useRef(new Animated.Value(0)).current;
  const addressAnimations = useRef<Animated.Value[]>([]).current;

  // Initialize animations for each address
  useEffect(() => {
    addresses.forEach((_, index) => {
      if (!addressAnimations[index]) {
        addressAnimations[index] = new Animated.Value(1);
      }
    });
  }, [addresses]);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Please enable location services to automatically detect your location."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      setFormData((prevData) => ({
        ...prevData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));

      // Animate to current location
      mapRef.current?.animateToRegion(newRegion, 1000);

      // Get address from coordinates
      await reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setLocating(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result) {
        const address = [
          result.streetNumber,
          result.street,
          result.district,
          result.city,
          result.region,
          result.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        setFormData((prevData) => ({
          ...prevData,
          fullAddress: address,
        }));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const openModal = (index?: number) => {
    if (index !== undefined) {
      setEditingIndex(index);
      const addressToEdit = addresses[index];
      setFormData(addressToEdit);

      const savedRegion = {
        latitude: addressToEdit.latitude,
        longitude: addressToEdit.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(savedRegion);

      setTimeout(() => {
        mapRef.current?.animateToRegion(savedRegion, 1000);
      }, 500);
    } else {
      setEditingIndex(null);
      setFormData({
        nickname: "",
        fullAddress: "",
        isDefault: addresses.length === 0,
        latitude: 0,
        longitude: 0,
      });
      getCurrentLocation();
    }
    setModalVisible(true);

    // Animate modal opening
    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    // Animate modal closing
    Animated.parallel([
      Animated.timing(modalBackdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setEditingIndex(null);
      setFormData({
        nickname: "",
        fullAddress: "",
        latitude: 0,
        longitude: 0,
        isDefault: false,
      });
    });
  };

  const animateAddressRemoval = (index: number, callback: () => void) => {
    Animated.timing(addressAnimations[index], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const saveAddress = async () => {
    if (!formData.latitude || !formData.longitude) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    if (!formData.nickname.trim()) {
      Alert.alert("Error", "Please enter a nickname for this address");
      return;
    }

    if (!formData.fullAddress.trim()) {
      Alert.alert("Error", "Please enter the full address");
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      let updatedAddresses = [...addresses];

      if (editingIndex !== null) {
        // Update existing address
        updatedAddresses[editingIndex] = formData;
      } else {
        // Add new address
        updatedAddresses.push(formData);
      }

      // If this address is set as default, unset others
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map((addr, idx) => ({
          ...addr,
          isDefault: idx === (editingIndex ?? updatedAddresses.length - 1),
        }));
      }

      // Ensure at least one address is default
      const hasDefault = updatedAddresses.some((addr) => addr.isDefault);
      if (!hasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        address: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await ReFetchUser();
      closeModal();
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setFormData((prev) => ({
      ...prev,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));
    await reverseGeocode(coordinate.latitude, coordinate.longitude);
  };

  const deleteAddress = (index: number) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;

            animateAddressRemoval(index, async () => {
              try {
                let updatedAddresses = addresses.filter((_, i) => i !== index);

                // If deleted address was default, set first address as default
                if (addresses[index].isDefault && updatedAddresses.length > 0) {
                  updatedAddresses[0].isDefault = true;
                }

                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                  address: updatedAddresses,
                });

                setAddresses(updatedAddresses);
                await ReFetchUser();
              } catch (error) {
                console.error("Error deleting address:", error);
                Alert.alert(
                  "Error",
                  "Failed to delete address. Please try again."
                );
              }
            });
          },
        },
      ]
    );
  };

  const setAsDefault = async (index: number) => {
    if (!user || addresses[index].isDefault) return;

    try {
      const updatedAddresses = addresses.map((addr, idx) => ({
        ...addr,
        isDefault: idx === index,
      }));

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        address: updatedAddresses,
      });

      setAddresses(updatedAddresses);
      await ReFetchUser();
    } catch (error) {
      console.error("Error setting default address:", error);
      Alert.alert("Error", "Failed to update default address.");
    }
  };

  const AddressCard = ({
    address,
    index,
  }: {
    address: Address;
    index: number;
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          transform: [
            { scale: addressAnimations[index] || 1 },
            { scale: scaleAnim },
          ],
          opacity: addressAnimations[index] || 1,
        }}
        className="mb-3"
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor:
              effectiveTheme === "dark" ? darkColors.card : lightColors.card,
            borderColor: address.isDefault
              ? effectiveTheme === "dark"
                ? darkColors.accent
                : lightColors.accent
              : effectiveTheme === "dark"
              ? darkColors.border
              : lightColors.border,
            borderWidth: address.isDefault ? 2 : 1,
          }}
        >
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="home"
                  size={18}
                  color={
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text
                  }
                />
                <Text
                  className="font-semibold text-lg ml-2"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  {address.nickname}
                </Text>
                {address.isDefault && (
                  <View
                    className="ml-2 px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? darkColors.accent
                          : lightColors.accent,
                    }}
                  >
                    <Text className="text-white text-xs font-medium">
                      Default
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="text-sm"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                {address.fullAddress}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-end gap-2 mt-3">
            {!address.isDefault && (
              <TouchableOpacity
                onPress={() => setAsDefault(index)}
                className="px-3 py-1.5 rounded-lg border"
                style={{
                  borderColor:
                    effectiveTheme === "dark"
                      ? darkColors.border
                      : lightColors.border,
                }}
              >
                <Text
                  className="text-sm"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  Set as Default
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => openModal(index)}
              className="px-3 py-1.5 rounded-lg flex-row items-center"
              style={{
                backgroundColor:
                  effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
              }}
            >
              <Ionicons
                name="pencil"
                size={16}
                color={
                  effectiveTheme === "dark" ? darkColors.text : lightColors.text
                }
              />
              <Text
                className="text-sm ml-1"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteAddress(index)}
              className="px-3 py-1.5 rounded-lg flex-row items-center"
              style={{
                backgroundColor: "#ef44441a",
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text className="text-sm ml-1 text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {addresses.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons
                name="location-outline"
                size={80}
                color={effectiveTheme === "dark" ? "#666" : "#999"}
              />
              <Text
                className="text-lg font-medium mt-4 mb-2"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                No addresses yet
              </Text>
              <Text
                className="text-sm text-center mb-6"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.secondaryText
                      : lightColors.secondaryText,
                }}
              >
                Add your delivery addresses to make checkout faster
              </Text>
            </View>
          ) : (
            <View className="py-4">
              {addresses.map((address, index) => (
                <AddressCard key={index} address={address} index={index} />
              ))}
            </View>
          )}

          {/* Add Address Button */}
          <TouchableOpacity onPress={() => openModal()} className="my-4">
            <View
              className="py-4 rounded-2xl flex-row items-center justify-center"
              style={{
                backgroundColor:
                  effectiveTheme === "dark"
                    ? darkColors.accent
                    : lightColors.accent,
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-lg ml-2">
                Add New Address
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Address Form Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View
          className="flex-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: modalBackdropAnim,
          }}
        >
          <Pressable className="flex-1" onPress={closeModal}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1 justify-end"
            >
              <Animated.View
                className="rounded-t-3xl px-4 pt-6 pb-8"
                style={{
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? darkColors.background
                      : lightColors.background,
                  transform: [{ translateY: modalSlideAnim }],
                  maxHeight: "85%",
                }}
                onStartShouldSetResponder={() => true}
              >
                <Pressable>
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center mb-6">
                    <Text
                      className="text-large font-semibold"
                      style={{
                        color:
                          effectiveTheme === "dark"
                            ? darkColors.text
                            : lightColors.text,
                      }}
                    >
                      {editingIndex !== null
                        ? "Edit Address"
                        : "Add New Address"}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons
                        name="close-circle"
                        size={28}
                        color={
                          effectiveTheme === "dark"
                            ? darkColors.text
                            : lightColors.text
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  {/* map */}
                  <View
                    style={{
                      height: SCREEN_HEIGHT * 0.35,
                      marginBottom: 10,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <MapView
                      ref={mapRef}
                      provider={PROVIDER_GOOGLE}
                      style={{ flex: 1 }}
                      region={region}
                      onRegionChangeComplete={setRegion}
                      onPress={handleMapPress}
                      showsUserLocation
                      showsMyLocationButton={false}
                    >
                      {formData.latitude && formData.longitude && (
                        <Marker
                          coordinate={{
                            latitude: formData.latitude,
                            longitude: formData.longitude,
                          }}
                          draggable
                          onDragEnd={(e) => {
                            const coord = e.nativeEvent.coordinate;
                            setFormData((prev) => ({
                              ...prev,
                              latitude: coord.latitude,
                              longitude: coord.longitude,
                            }));
                            reverseGeocode(coord.latitude, coord.longitude);
                          }}
                        >
                          <View className="items-center">
                            <View className="p-2 rounded-full">
                              <Ionicons
                                name="location"
                                size={24}
                                color={colors.accent}
                              />
                            </View>
                          </View>
                        </Marker>
                      )}
                    </MapView>

                    {/* Map Instructions */}
                    <View
                      className="absolute bottom-2 left-2 right-2 p-3 rounded-lg"
                      style={{
                        backgroundColor:
                          effectiveTheme === "dark" ? "#000000cc" : "#ffffffcc",
                      }}
                    >
                      <Text
                        className="text-sm text-center"
                        style={{ color: colors.text }}
                      >
                        Tap on the map or drag the marker to select your
                        delivery location
                      </Text>
                    </View>
                  </View>

                  {/* Form Fields */}
                  <View>
                    <View className="mb-4">
                      <Text
                        className="text-sm font-medium mb-2"
                        style={{
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.secondaryText
                              : lightColors.secondaryText,
                        }}
                      >
                        Address Nickname
                      </Text>
                      <TextInput
                        value={formData.nickname}
                        onChangeText={(text) =>
                          setFormData({ ...formData, nickname: text })
                        }
                        placeholder="e.g., Home, Office, etc."
                        placeholderTextColor={
                          effectiveTheme === "dark" ? "#666" : "#999"
                        }
                        className="px-4 py-3 rounded-xl text-base"
                        style={{
                          backgroundColor:
                            effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.text
                              : lightColors.text,
                          borderWidth: 1,
                          borderColor:
                            effectiveTheme === "dark"
                              ? darkColors.border
                              : lightColors.border,
                        }}
                      />
                    </View>

                    <View className="mb-4">
                      <Text
                        className="text-sm font-medium mb-2"
                        style={{
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.secondaryText
                              : lightColors.secondaryText,
                        }}
                      >
                        Full Address
                      </Text>
                      <TextInput
                        value={formData.fullAddress}
                        onChangeText={(text) =>
                          setFormData({ ...formData, fullAddress: text })
                        }
                        placeholder="Enter your complete address"
                        placeholderTextColor={
                          effectiveTheme === "dark" ? "#666" : "#999"
                        }
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="px-4 py-3 rounded-xl text-base"
                        style={{
                          backgroundColor:
                            effectiveTheme === "dark" ? "#1a1a1a" : "#f3f4f6",
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.text
                              : lightColors.text,
                          borderWidth: 1,
                          borderColor:
                            effectiveTheme === "dark"
                              ? darkColors.border
                              : lightColors.border,
                          minHeight: 80,
                        }}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setFormData({
                          ...formData,
                          isDefault: !formData.isDefault,
                        })
                      }
                      className="flex-row items-center mb-6"
                    >
                      <View
                        className="w-6 h-6 rounded-md mr-3 items-center justify-center"
                        style={{
                          backgroundColor: formData.isDefault
                            ? effectiveTheme === "dark"
                              ? darkColors.accent
                              : lightColors.accent
                            : "transparent",
                          borderWidth: 2,
                          borderColor:
                            effectiveTheme === "dark"
                              ? darkColors.accent
                              : lightColors.accent,
                        }}
                      >
                        {formData.isDefault && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#ffffff"
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          color:
                            effectiveTheme === "dark"
                              ? darkColors.text
                              : lightColors.text,
                        }}
                      >
                        Set as default address
                      </Text>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={closeModal}
                        className="flex-1 py-3 rounded-xl border"
                        style={{
                          borderColor:
                            effectiveTheme === "dark"
                              ? darkColors.border
                              : lightColors.border,
                        }}
                      >
                        <Text
                          className="text-center font-medium"
                          style={{
                            color:
                              effectiveTheme === "dark"
                                ? darkColors.text
                                : lightColors.text,
                          }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveAddress}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl"
                        style={{
                          backgroundColor:
                            effectiveTheme === "dark"
                              ? darkColors.accent
                              : lightColors.accent,
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text className="text-white text-center font-medium">
                            {editingIndex !== null ? "Update" : "Save"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            </KeyboardAvoidingView>
          </Pressable>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
