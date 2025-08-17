import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardTypeOptions,
  FlatList,
  LayoutChangeEvent,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useSellerProducts } from "@/src/context/seller/SellerProductContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "@/src/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useAuth } from "@/src/context/AuthContext";
import { useDebounce } from "use-debounce";
import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Product, ProductOption } from "@/src/constants/types.product";
import { useTheme } from "@/src/context/ThemeContext";
import { lightColors, darkColors } from "@/src/constants/Colors"; // Import palettes

// --- Reusable UI Components (Themed) ---

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  effectiveTheme: "light" | "dark";
};

const FormInput = ({ label, effectiveTheme, ...props }: FormInputProps) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View className="mb-4">
      <Text
        style={{ color: colors.secondaryText }}
        className="text-base font-medium mb-2"
      >
        {label}
      </Text>
      <TextInput
        {...props}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text,
          height: props.multiline ? 112 : 48,
        }}
        className="p-3 border rounded-lg text-base"
        textAlignVertical={props.multiline ? "top" : "center"}
        placeholderTextColor={colors.placeholder}
      />
    </View>
  );
};

const FormSection = ({
  title,
  children,
  effectiveTheme,
}: {
  title: string;
  children: React.ReactNode;
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="p-4 rounded-xl border shadow-sm mb-6"
    >
      <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
};

const ConditionSelector = ({
  value,
  onSelect,
  effectiveTheme,
}: {
  value: Product["condition"];
  onSelect: (val: Product["condition"]) => void;
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const options: Product["condition"][] = ["new", "used", "refurbished"];
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / options.length : 0;
  const selectedIndex = useSharedValue(options.indexOf(value));

  useEffect(() => {
    selectedIndex.value = withTiming(options.indexOf(value), { duration: 250 });
  }, [value, options, selectedIndex]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectedIndex.value * tabWidth }],
    backgroundColor: colors.card,
  }));

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View>
      <Text
        style={{ color: colors.secondaryText }}
        className="text-base font-medium mb-2"
      >
        Condition
      </Text>

      <View
        style={{ backgroundColor: colors.background }}
        className="flex-row rounded-lg p-1"
        onLayout={onContainerLayout}
      >
        {containerWidth > 0 && (
          <Animated.View
            className="absolute h-full rounded-md shadow"
            style={[
              { left: 5, alignSelf: "center", height: "100%" },
              { width: tabWidth - 10 },
              animatedPillStyle,
            ]}
          />
        )}
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className="flex-1 p-2 rounded-md z-10"
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: value === option ? colors.text : colors.tertiaryText,
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const CategoryInput = ({
  value,
  onSelect,
  effectiveTheme,
}: {
  value: string;
  onSelect: (val: string) => void;
  effectiveTheme: "light" | "dark";
}) => {
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery] = useDebounce(inputValue, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        // Get the Categories document from the App collection
        const categoriesDocRef = await getDocs(collection(db, "App"));
        let fetchedCategories: string[] = [];

        // Find the MetaData document and extract the categories array
        categoriesDocRef.forEach((doc) => {
          if (doc.id === "MetaData" && doc.data().Categories) {
            // Filter categories that match the query
            fetchedCategories = doc
              .data()
              .Categories.filter((category: string) =>
                category.toLowerCase().includes(debouncedQuery.toLowerCase())
              )
              .slice(0, 5); // Limit to 5 results
          }
        });

        setSuggestions(fetchedCategories);
      } catch (error) {
        console.error("Error fetching category suggestions:", error);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View>
      <FormInput
        label="Category"
        value={inputValue}
        onChangeText={(text) => {
          setInputValue(text);
          onSelect(text);
          setShowSuggestions(true);
        }}
        placeholder="e.g., Clothing, Electronics"
        effectiveTheme={effectiveTheme}
      />
      {showSuggestions && debouncedQuery.length >= 3 && (
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="border rounded-lg -mt-4 mb-4 shadow-lg"
        >
          {loading && (
            <ActivityIndicator className="p-2" color={colors.accent} />
          )}
          {!loading && suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(item)}
                  style={{ borderBottomColor: colors.border }}
                  className="p-3 border-b"
                >
                  <Text style={{ color: colors.text }} className="text-base">
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

// --- Main Screen ---
export default function AddOrEditProductScreen() {
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;
  const router = useRouter();
  const {
    addProduct,
    updateProduct,
    products: contextProducts,
  } = useSellerProducts();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ pid?: string }>();
  const isEditing = !!params.pid;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<Product["condition"]>("new");
  const [images, setImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditing && contextProducts.length > 0) {
      const productToEdit = contextProducts.find((p) => p.pid === params.pid);
      if (productToEdit) {
        setName(productToEdit.name);
        setDescription(productToEdit.description || "");
        setPrice(productToEdit.price.toString());
        setStockQuantity(productToEdit.stockQuantity?.toString() || "1");
        setCategory(productToEdit.category);
        setCondition(productToEdit.condition);
        setImages(productToEdit.imagesUrl);
        setOriginalImages(productToEdit.imagesUrl);
        setOptions(productToEdit.options || []);
      }
    }
  }, [params.pid, contextProducts, isEditing]);

  const ProductOptionsManager = useCallback(
    ({
      options,
      onOptionsChange,
    }: {
      options: ProductOption[];
      onOptionsChange: (options: ProductOption[]) => void;
    }) => {
      const handleAddOption = () => {
        const newOption: ProductOption = { name: "", values: [{ name: "" }] };
        onOptionsChange([...options, newOption]);
      };

      const handleRemoveOption = (optionIndex: number) => {
        onOptionsChange(options.filter((_, index) => index !== optionIndex));
      };

      const handleOptionNameChange = (text: string, optionIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].name = text;
        onOptionsChange(newOptions);
      };

      const handleAddValue = (optionIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values.push({ name: "" });
        onOptionsChange(newOptions);
      };

      const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values = newOptions[optionIndex].values.filter(
          (_, index) => index !== valueIndex
        );
        onOptionsChange(newOptions);
      };

      const handleValueChange = (
        text: string,
        optionIndex: number,
        valueIndex: number,
        field: "name" | "priceModifier"
      ) => {
        const newOptions = [...options];
        const value = newOptions[optionIndex].values[valueIndex];
        if (field === "name") {
          value.name = text;
        } else {
          const parsedModifier = parseFloat(text);
          value.priceModifier = isNaN(parsedModifier)
            ? undefined
            : parsedModifier;
        }
        onOptionsChange(newOptions);
      };

      return (
        <View>
          {options.map((option, optionIndex) => (
            <View
              key={optionIndex}
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              className="p-3 rounded-lg border mb-4"
            >
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-1">
                  <TextInput
                    placeholder="Option Name (e.g., Size)"
                    value={option.name}
                    onChangeText={(text) =>
                      handleOptionNameChange(text, optionIndex)
                    }
                    placeholderTextColor={colors.placeholder}
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    className="p-2 border rounded-md text-base h-11"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveOption(optionIndex)}
                  className="ml-2 p-2"
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View
                style={{ borderLeftColor: colors.border }}
                className="pl-2 border-l-2"
              >
                {option.values.map((value, valueIndex) => (
                  <View key={valueIndex} className="flex-row items-center my-1">
                    <View className="flex-1">
                      <TextInput
                        placeholder="Value (e.g., Small)"
                        value={value.name}
                        onChangeText={(text) =>
                          handleValueChange(
                            text,
                            optionIndex,
                            valueIndex,
                            "name"
                          )
                        }
                        placeholderTextColor={colors.placeholder}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                        className="p-2 border rounded-md text-base h-11"
                      />
                    </View>
                    <View className="w-28 mx-2">
                      <TextInput
                        placeholder="+/- Price"
                        value={value.priceModifier?.toString() || ""}
                        onChangeText={(text) =>
                          handleValueChange(
                            text,
                            optionIndex,
                            valueIndex,
                            "priceModifier"
                          )
                        }
                        placeholderTextColor={colors.placeholder}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                        className="p-2 border rounded-md text-base text-center h-11"
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveValue(optionIndex, valueIndex)}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color={colors.tertiaryText}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => handleAddValue(optionIndex)}
                  style={{ backgroundColor: colors.border }}
                  className="flex-row items-center mt-2 p-2 rounded-md"
                >
                  <Ionicons name="add" size={20} color={colors.secondaryText} />
                  <Text
                    style={{ color: colors.secondaryText }}
                    className="ml-2 font-semibold"
                  >
                    Add Value
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            onPress={handleAddOption}
            style={{ borderColor: colors.accent }}
            className="flex-row items-center justify-center p-3 mt-2 border-2 border-dashed rounded-lg"
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={colors.accent}
            />
            <Text
              style={{ color: colors.accent }}
              className="font-bold text-base ml-2"
            >
              Add a Product Option
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [options, colors]
  );

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload a maximum of 5 images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(
      storage,
      `products/${user?.uid}/${Date.now()}-${Math.random()}`
    );
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) =>
          setUploadProgress(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ),
        (error) => reject(error),
        () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
      );
    });
  };

  const deleteImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.startsWith("https://")) return;
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code !== "storage/object-not-found") {
        console.error("Error deleting old image:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !stockQuantity || !category || images.length === 0) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields and add at least one image."
      );
      return;
    }
    const invalidOption = options.some(
      (opt) => !opt.name || opt.values.some((val) => !val.name)
    );
    if (invalidOption) {
      Alert.alert(
        "Invalid Options",
        "Please fill in all option and value names, or remove the empty ones."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      if (isEditing) {
        const removedImages = originalImages.filter(
          (url) => !images.includes(url)
        );
        await Promise.all(removedImages.map((url) => deleteImage(url)));
      }

      const imageUrlsToSave: string[] = [];
      for (const img of images) {
        if (img.startsWith("file://")) {
          const url = await uploadImage(img);
          imageUrlsToSave.push(url);
        } else {
          imageUrlsToSave.push(img);
        }
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity, 10),
        category,
        imagesUrl: imageUrlsToSave,
        condition,
        options,
      };

      const success = isEditing
        ? await updateProduct(params.pid!, productData)
        : await addProduct(productData);

      if (success) {
        Alert.alert(
          "Success",
          `Product has been ${isEditing ? "updated" : "listed"}!`
        );
        router.back();
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      Alert.alert("Error", "There was a problem saving your product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Product" : "List New Product" }}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <FormSection title="Core Details" effectiveTheme={effectiveTheme}>
          <FormInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Regular Fit T-Shirt"
            effectiveTheme={effectiveTheme}
          />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product's features, material, etc."
            multiline
            effectiveTheme={effectiveTheme}
          />
        </FormSection>

        <FormSection title="Pricing & Stock" effectiveTheme={effectiveTheme}>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <FormInput
                label="Price ($)"
                value={price}
                onChangeText={setPrice}
                placeholder="29.99"
                keyboardType="numeric"
                effectiveTheme={effectiveTheme}
              />
            </View>
            <View className="flex-1">
              <FormInput
                label="Stock Quantity"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                placeholder="10"
                keyboardType="number-pad"
                effectiveTheme={effectiveTheme}
              />
            </View>
          </View>
        </FormSection>

        <FormSection title="Categorization" effectiveTheme={effectiveTheme}>
          <CategoryInput
            value={category}
            onSelect={setCategory}
            effectiveTheme={effectiveTheme}
          />
          <View className="mt-4">
            <ConditionSelector
              value={condition}
              onSelect={setCondition}
              effectiveTheme={effectiveTheme}
            />
          </View>
        </FormSection>

        <FormSection
          title="Product Variants / Options"
          effectiveTheme={effectiveTheme}
        >
          <Text
            style={{ color: colors.secondaryText }}
            className="text-sm mb-3"
          >
            Add options like size or color. You can adjust the price for each
            variant.
          </Text>
          <ProductOptionsManager
            options={options}
            onOptionsChange={setOptions}
          />
        </FormSection>

        <FormSection title="Images" effectiveTheme={effectiveTheme}>
          <Text
            style={{ color: colors.secondaryText }}
            className="text-sm mb-3"
          >
            Add up to 5 images. The first image will be the main one.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {images.map((uri, index) => (
              <View key={index} className="relative mr-2">
                <Image
                  source={{ uri }}
                  style={{ backgroundColor: colors.border }}
                  className="w-24 h-24 rounded-lg"
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                >
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
                className="w-24 h-24 rounded-lg justify-center items-center border-2 border-dashed"
              >
                <Ionicons name="add" size={32} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </FormSection>

        {isSubmitting && (
          <View className="my-2">
            <Text
              className="text-center"
              style={{ color: colors.secondaryText }}
            >
              {uploadProgress < 100
                ? `Uploading... ${Math.round(uploadProgress)}%`
                : "Saving product..."}
            </Text>
            <View
              style={{ backgroundColor: colors.border }}
              className="w-full rounded-full h-2.5 mt-1"
            >
              <View
                className="h-2.5 rounded-full"
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: colors.accent,
                }}
              ></View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{ backgroundColor: colors.accent }}
          className={`p-4 rounded-lg flex-row justify-center items-center mt-4 ${
            isSubmitting ? "opacity-50" : ""
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {isEditing ? "Save Changes" : "List Product"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
