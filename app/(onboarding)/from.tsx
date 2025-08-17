import React, { useState, useEffect, useRef } from "react";
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
  Dimensions,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Address } from "@/src/constants/types.user";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, lightColors } from "@/src/constants/Colors";

const { height: screenHeight } = Dimensions.get("window");

// A simple component for the gender selection buttons
const GenderButton = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 h-14 rounded-lg justify-center items-center border ${
      isSelected ? "bg-primary border-primary" : "bg-gray-50 border-gray-300"
    }`}
  >
    <Text
      className={`text-medium font-semibold ${
        isSelected ? "text-white" : "text-gray-600"
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function OnboardingScreen() {
  const { user, updateInitialUserProfile, loading } = useAuth();

  // State for the form fields
  const [dob, setDob] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [address, setAddress] = useState("");
  const [formData, setFormData] = useState<Address>({
    nickname: "Home",
    fullAddress: "",
    latitude: 0,
    longitude: 0,
    isDefault: true,
  });

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -26.2041,
    longitude: 28.0473,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    // Automatically get the user's current location when the component mounts
    getCurrentLocation();
  }, []);

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setFormData((prev) => ({
      ...prev,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));
    await reverseGeocode(coordinate.latitude, coordinate.longitude);
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
        setAddress(address); // Also update the text input
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const getCurrentLocation = async () => {
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

      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 500);

      // Get address from coordinates
      await reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Always hide the picker after a selection is made or dismissed
    setShowDatePicker(false);

    // Check if the user confirmed a date selection
    if (event.type === "set" && selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Basic validation
    if (!dob || !address.trim()) {
      Alert.alert("Incomplete Form", "Please fill in all fields to continue.");
      return;
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      Alert.alert(
        "Invalid Date",
        "Please enter your date of birth in YYYY-MM-DD format."
      );
      return;
    }

    // Update formData with the current address
    const updatedFormData = {
      ...formData,
      fullAddress: address,
    };

    await updateInitialUserProfile(gender, [updatedFormData], dobDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-5">
            <View className="my-8">
              <Text className="text-hero font-bold text-black mb-2 text-center font-display">
                Complete Your Profile
              </Text>
              <Text className="text-medium text-gray-500 mb-6 text-center font-sans">
                A few more details to get you started.
              </Text>
            </View>

            <View className="space-y-4">
              {/* Date of Birth Picker Trigger */}
              <View>
                <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                  Date of Birth
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="w-full h-14 bg-gray-50 border border-gray-300 rounded-lg px-4 justify-center"
                >
                  <Text
                    className={`text-medium ${
                      dob ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {dob
                      ? dob.toLocaleDateString()
                      : "Select your date of birth"}
                  </Text>
                </TouchableOpacity>

                {/* Render the Date Picker when showDatePicker is true */}
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={dob}
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Gender Selection */}
              <View>
                <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                  Gender
                </Text>
                <View className="flex-row w-full space-x-3">
                  <GenderButton
                    label="Male"
                    isSelected={gender === "male"}
                    onPress={() => setGender("male")}
                  />
                  <GenderButton
                    label="Female"
                    isSelected={gender === "female"}
                    onPress={() => setGender("female")}
                  />
                </View>
              </View>

              {/* Address Input */}
              <View>
                <Text className="text-btn_title text-gray-800 font-medium mb-1.5">
                  Primary Address
                </Text>

                {/* Map Container */}
                <View
                  style={{
                    height: Math.min(300, screenHeight * 0.35), // More reasonable height
                    marginBottom: 16,
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    region={region}
                    onPress={handleMapPress}
                    showsUserLocation
                    showsMyLocationButton={false}
                  >
                    {formData.latitude !== 0 && formData.longitude !== 0 && (
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
                        {/* Fixed marker - removed className and simplified */}
                        <View style={{ alignItems: "center" }}>
                          <View>
                            <Ionicons
                              name="location"
                              size={24}
                              color={darkColors.accent}
                            />
                          </View>
                        </View>
                      </Marker>
                    )}
                  </MapView>

                  {/* Map Instructions */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      right: 8,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: darkColors.text,
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Tap on the map or drag the marker to select your delivery
                      location
                    </Text>
                  </View>
                </View>

                <TextInput
                  className="w-full h-24 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-medium text-gray-800 focus:border-primary"
                  placeholder="Enter your full address"
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    setFormData((prev) => ({ ...prev, fullAddress: text }));
                  }}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#A0AEC0"
                />
              </View>

              {/* Submit Button */}
              <View className="mt-6">
                <TouchableOpacity
                  className={`w-full h-14 rounded-lg justify-center items-center flex-row ${
                    loading ? "bg-primary/80" : "bg-primary"
                  }`}
                  onPress={handleCompleteOnboarding}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-btn_title font-semibold font-sans">
                      Save and Continue
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
