// app/(customer)/home/[pid].tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
  RefreshControl,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useProducts } from "@/src/context/ProductContext";
import {
  Product,
  ProductOptionValue,
  Review,
} from "@/src/constants/types.product";
import { mapSupabaseToProduct } from "@/src/helpers/helper";
import { ErrorState, ProductDetailsSkeleton } from "@/src/helpers/skeletons";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { FlatList } from "react-native-gesture-handler";
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  StatusBar,
} from "expo-status-bar";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const REVIEWS_PER_PAGE = 10;
const IMAGE_CAROUSEL_HEIGHT = SCREEN_WIDTH;

const HIDE_THRESHOLD = 150;
const SHOW_THRESHOLD = 250;

const ReviewCard = ({
  review,
  effectiveTheme,
}: {
  review: Review;
  effectiveTheme: string;
}) => (
  <View
    className="bg-white p-4 rounded-2xl mb-4 shadow-sm border mx-5"
    style={{
      borderColor:
        effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      backgroundColor:
        effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      elevation: 3,
      shadowColor: effectiveTheme === "dark" ? "#ffffff30" : "#00000030",
    }}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Text
        className="text-base font-semibold"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {review.userName}
      </Text>
      <View className="flex-row items-center px-2.5 py-1 rounded-full">
        <Text
          className="text-base font-bold mr-2"
          style={{
            color:
              effectiveTheme === "dark" ? darkColors.text : lightColors.text,
          }}
        >
          {review.rating}
        </Text>
        <Ionicons name="star" size={16} color="#FFC700" />
      </View>
    </View>
    <Text
      className="text-sm leading-6"
      style={{
        color:
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText,
      }}
    >
      {review.reviewtText}
    </Text>
    <Text className="text-xs text-gray-400 mt-3 text-right">
      {new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
    </Text>
  </View>
);

const ImageCarousel = ({
  images,
  scrollY,
  onLike,
  isSaved,
  effectiveTheme,
}: {
  images: string[];
  scrollY: Animated.Value;
  onLike: () => void;
  isSaved: boolean;
  effectiveTheme: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, IMAGE_CAROUSEL_HEIGHT],
    outputRange: [-IMAGE_CAROUSEL_HEIGHT, -IMAGE_CAROUSEL_HEIGHT / 2],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        {
          height: IMAGE_CAROUSEL_HEIGHT,
          transform: [{ translateY: imageTranslateY }],
        },
      ]}
      className="w-full absolute top-0 left-0 right-0"
    >
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View
            className="w-screen bg-black/5"
            style={{ height: IMAGE_CAROUSEL_HEIGHT }}
          >
            <Animated.Image
              source={{ uri: item }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )}
      />
      {images.length > 1 && (
        <View className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-full">
          <Text className="text-white text-sm font-semibold">
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function ProductDetailsScreen() {
  const { pid } = useLocalSearchParams<{ pid: string }>();
  const router = useRouter();

  const { likedProductIds, toggleLikeProduct } = useAuth();
  const { addToCart } = useCart();
  const { products: contextProducts } = useProducts();
  const { effectiveTheme } = useTheme();

  // --- Data State ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: ProductOptionValue;
  }>({});
  const [activeTab, setActiveTab] = useState("Details");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [lastVisibleReview, setLastVisibleReview] =
    useState<DocumentData | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Animation State ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const imageAnimation = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const fetchProductData = async () => {
    if (!pid) {
      setLoading(false);
      return;
    } else {
      setLoading(true);
    }
    setError(null);

    const productFromContext = contextProducts.find((item) => item.pid === pid);

    if (productFromContext) {
      setProduct(productFromContext);
      setLoading(false);
    } else {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const productRef = doc(db, "products", pid);
          const docSnap = await getDoc(productRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProduct(mapSupabaseToProduct(data));
          } else {
            setError("Product not found.");
          }
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product details.");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  };

  const fetchReviews = useCallback(
    async (loadMore = false) => {
      if (!pid || (loadMore && !hasMoreReviews)) return;
      setLoadingReviews(true);
      try {
        const reviewsRef = collection(db, "reviews");
        let q;
        const qConstraints = [
          where("productId", "==", pid),
          orderBy("createdAt", "desc"),
          limit(REVIEWS_PER_PAGE),
        ];

        if (loadMore && lastVisibleReview) {
          q = query(reviewsRef, ...qConstraints, startAfter(lastVisibleReview));
        } else {
          q = query(reviewsRef, ...qConstraints);
        }

        const docSnap = await getDocs(q);
        const newReviews = docSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Review[];

        if (docSnap.docs.length < REVIEWS_PER_PAGE) {
          setHasMoreReviews(false);
        }
        setLastVisibleReview(docSnap.docs[docSnap.docs.length - 1]);
        setReviews((prev) =>
          loadMore ? [...prev, ...newReviews] : newReviews
        );
      } catch (error) {
        console.error("Error fetching reviews:", error);
        Alert.alert("Error", "Could not load reviews.");
      } finally {
        setLoadingReviews(false);
      }
    },
    [pid, hasMoreReviews, lastVisibleReview]
  );

  useEffect(() => {
    fetchProductData();
    fetchReviews();
  }, [pid]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProductData();
    setLastVisibleReview(null);
    setHasMoreReviews(true);
    await fetchReviews();
    setIsRefreshing(false);
  }, [fetchProductData, fetchReviews]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentScrollY = (
          event as { nativeEvent: { contentOffset: { y: number } } }
        ).nativeEvent.contentOffset.y;
        if (currentScrollY < 0) return;
        const direction = currentScrollY > lastScrollY.current ? "down" : "up";
        const isScrollingDown = direction === "down";
        // --- Logic for hiding components ---
        if (isScrollingDown) {
          if (isHeaderVisible && currentScrollY > HIDE_THRESHOLD) {
            setIsHeaderVisible(false);
          }
          if (isImageVisible && currentScrollY > SHOW_THRESHOLD) {
            setIsImageVisible(false);
          }
          setStatusBarStyle("dark");
        } else {
          setStatusBarStyle("dark");
          if (!isHeaderVisible) {
            setIsHeaderVisible(true);
          }
          if (!isImageVisible) {
            setIsImageVisible(true);
          }
        }
        lastScrollY.current = currentScrollY;
      },
    }
  );

  // --- Event Handlers ---

  const handleSelectOption = (
    optionName: string,
    value: ProductOptionValue
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    // Check if all required options are selected
    if (product.options) {
      for (const option of product.options) {
        if (!selectedOptions[option.name]) {
          Alert.alert("Selection Required", `Please select a ${option.name}.`);
          return;
        }
      }
    }
    addToCart(product, 1, selectedOptions);
    Alert.alert("Success", "Added to cart!");
  };

  const handleMessageSeller = async () => {
    if (!product) return;
    // setIsCreatingConversation(true);
    router.push({
      pathname: "/(messages)/chat",
      params: {
        recipientId: product.sellerId,
        recipientName: product.sellerName,
      },
    });
  };

  const isSaved = product ? likedProductIds.includes(product.pid) : false;

  // --- Render Methods ---

  if (loading)
    return <ProductDetailsSkeleton effectiveTheme={effectiveTheme} />;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {}}
        effectiveTheme={effectiveTheme}
      />
    );
  }

  if (!product) {
    return (
      <ErrorState
        error="Product could not be loaded."
        onRetry={fetchProductData}
        effectiveTheme={effectiveTheme}
      />
    );
  }

  const renderListHeader = () => (
    <>
      <Animated.View
        className="-z-20"
        style={{
          transform: [{ translateY: imageAnimation }],
          opacity: imageAnimation.interpolate({
            inputRange: [-IMAGE_CAROUSEL_HEIGHT, 0],
            outputRange: [0, 1],
          }),
        }}
      >
        <ImageCarousel
          images={product.imagesUrl}
          scrollY={scrollY}
          isSaved={isSaved}
          onLike={() => toggleLikeProduct(product.pid)}
          effectiveTheme={effectiveTheme}
        />
      </Animated.View>

      {/* Tab Switcher */}
      <View
        className="px-4 py-2"
        style={{
          elevation: 5,
          zIndex: 10,
        }}
      >
        <View
          className="flex-row p-1 rounded-full shadow-md"
          style={{
            backgroundColor:
              effectiveTheme === "dark" ? darkColors.card : lightColors.card,
          }}
        >
          {["Details", "Reviews"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-2.5 rounded-full `}
              style={{
                backgroundColor:
                  activeTab === tab
                    ? effectiveTheme === "dark"
                      ? darkColors.text + "90"
                      : lightColors.text + "90"
                    : "transparent",
              }}
            >
              <Text
                className={`text-base font-bold `}
                style={{
                  color:
                    activeTab === tab
                      ? effectiveTheme === "dark"
                        ? darkColors.card
                        : lightColors.card
                      : effectiveTheme === "dark"
                      ? darkColors.tertiaryText
                      : lightColors.tertiaryText,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View
        className="pt-12 -translate-y-10"
        style={{
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        }}
      >
        <View className="p-4 -mt-4 ">
          {/* Product Info Card */}
          <View
            className="p-5 rounded-2xl shadow-sm border"
            style={{
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              elevation: 5,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
            }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View className="">
                <Text
                  className="text-heading font-Fredoka_SemiBold"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.secondaryText
                        : lightColors.text,
                  }}
                >
                  {product.name}
                </Text>
                <Text
                  className="text-3xl font-Fredoka_SemiBold mt-1"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.accent,
                  }}
                >
                  ${product.price.toFixed(2)}
                </Text>
              </View>

              <View
                className=" h-full"
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <View className="h-fit">
                  <Text
                    className="text-md font-bold"
                    style={{
                      marginRight: 8,
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.tertiaryText
                          : lightColors.tertiaryText,
                    }}
                  >
                    {product.createdAt &&
                      (typeof product.createdAt === "object" &&
                      "toDate" in product.createdAt
                        ? product.createdAt.toDate().toLocaleDateString()
                        : new Date(product.createdAt).toLocaleDateString())}
                  </Text>
                </View>

                <View className="flex-row items-center flex flex-1">
                  <AntDesign
                    name="star"
                    size={20}
                    color="#FFC700"
                    className="mr-1"
                  />
                  <Text
                    className="text-lg font-bold"
                    style={{
                      color:
                        effectiveTheme === "dark"
                          ? darkColors.text
                          : lightColors.text,
                    }}
                  >
                    {product.ratingAvg?.toString() +
                      "/5 ( " +
                      product.totalReviews?.toString() +
                      " )" || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              className="text-base mt-3 leading-6"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              {product.description}
            </Text>
          </View>

          {/* Seller Info */}
          <View
            className="flex-row justify-between items-center my-4 p-3 rounded-2xl"
            style={{
              borderColor:
                effectiveTheme === "dark"
                  ? darkColors.border
                  : lightColors.border,
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              elevation: 5,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
            }}
          >
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() =>
                router.push({
                  pathname: "/(customer)/home/seller/[sellerId]",
                  params: { sellerId: product.sellerId },
                })
              }
            >
              <Image
                source={{ uri: product.sellerImgUrl }}
                className="w-12 h-12 rounded-full bg-gray-200 mr-3"
              />
              <Text
                className="text-base font-semibold"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                {product.sellerName}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMessageSeller}
              className="border border-green-600 rounded-full px-4 py-2"
            >
              <Text className="text-green-600 font-semibold">Message</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Product Options */}
          {activeTab === "Details" &&
            product.options?.map((option) => (
              <View key={option.name} className="mb-4">
                <Text
                  className="text-lg font-bold mb-2"
                  style={{
                    color:
                      effectiveTheme === "dark"
                        ? darkColors.text
                        : lightColors.text,
                  }}
                >
                  Choose {option.name}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {option.values.map((value) => (
                    <TouchableOpacity
                      key={value.name}
                      onPress={() => handleSelectOption(option.name, value)}
                      className={`min-w-[56px] h-14 rounded-2xl border-2 justify-center items-center px-4 `}
                      style={{
                        borderColor:
                          selectedOptions[option.name]?.name === value.name
                            ? effectiveTheme === "dark"
                              ? darkColors.border
                              : lightColors.border
                            : effectiveTheme === "dark"
                            ? darkColors.border + "20"
                            : lightColors.border + "20",
                        backgroundColor:
                          selectedOptions[option.name]?.name === value.name
                            ? effectiveTheme === "dark"
                              ? darkColors.input
                              : lightColors.input + "80"
                            : effectiveTheme === "dark"
                            ? darkColors.input + "20"
                            : lightColors.input + "20",
                      }}
                    >
                      <Text
                        className={`text-lg font-bold `}
                        style={{
                          color:
                            selectedOptions[option.name]?.name === value.name
                              ? effectiveTheme === "dark"
                                ? darkColors.text
                                : lightColors.text
                              : effectiveTheme === "dark"
                              ? darkColors.tertiaryText
                              : lightColors.tertiaryText,
                        }}
                      >
                        {value.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
        </View>

        {activeTab === "Details" && <View className="h-8" />}
      </View>
    </>
  );

  const spacerHeight = imageAnimation.interpolate({
    inputRange: [-IMAGE_CAROUSEL_HEIGHT, 0],
    outputRange: [IMAGE_CAROUSEL_HEIGHT / 2, IMAGE_CAROUSEL_HEIGHT],
    extrapolate: "clamp",
  });

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor:
          effectiveTheme === "dark"
            ? darkColors.background
            : lightColors.background,
      }}
    >
      <Animated.FlatList
        data={activeTab === "Reviews" ? reviews : []}
        renderItem={({ item }) => (
          <ReviewCard review={item} effectiveTheme={effectiveTheme} />
        )}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <Animated.View style={{ height: spacerHeight }} />
            {renderListHeader()}
          </>
        }
        contentContainerStyle={{
          paddingBottom: 120,
          backgroundColor:
            effectiveTheme === "dark"
              ? darkColors.background
              : lightColors.background,
        }}
        ListEmptyComponent={
          activeTab === "Reviews" && !loadingReviews ? (
            <View className="items-center justify-center py-16">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={60}
                color={effectiveTheme === "dark" ? "#444" : "#E6E6E6"}
              />
              <Text className="text-base text-gray-500 mt-4">
                No reviews for this product yet.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          activeTab === "Reviews" && loadingReviews ? (
            <ActivityIndicator
              size="large"
              color={
                effectiveTheme === "dark"
                  ? darkColors.accent
                  : lightColors.accent
              }
              className="my-8"
            />
          ) : activeTab === "Reviews" &&
            hasMoreReviews &&
            reviews.length > 0 ? (
            <TouchableOpacity
              onPress={() => fetchReviews(true)}
              className="bg-primary/10 p-4 rounded-full my-4 mx-5"
            >
              <Text
                className="font-bold text-center text-base"
                style={{
                  color:
                    effectiveTheme === "dark"
                      ? darkColors.text
                      : lightColors.text,
                }}
              >
                Load More Reviews
              </Text>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[
              effectiveTheme === "dark"
                ? darkColors.accent
                : lightColors.accent,
            ]}
            tintColor={
              effectiveTheme === "dark" ? darkColors.accent : lightColors.accent
            }
          />
        }
      />

      {/* Bottom Action Bar */}
      <View className="m-4 absolute bottom-0 left-0 right-0 z-10">
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={40}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
          className="  flex w-full flex-1 border flex-row rounded-2xl overflow-hidden "
          style={{
            borderColor:
              effectiveTheme === "dark"
                ? darkColors.border
                : lightColors.border,
            backgroundColor:
              effectiveTheme === "dark"
                ? darkColors.secondaryText + "20"
                : lightColors.card + "20",
          }}
        >
          <View className="p-4 flex-col items-start">
            <Text
              className="text-sm"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.secondaryText
                    : lightColors.secondaryText,
              }}
            >
              Price
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{
                color:
                  effectiveTheme === "dark"
                    ? darkColors.text
                    : lightColors.text,
              }}
            >
              ${product.price.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleAddToCart} className="flex-1 mx-2">
            <LinearGradient
              colors={["#0b6649", "#0b6623"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderRadius: 9999,
              }}
              className=" m-4 rounded-full flex-row justify-center items-center overflow-hidden"
            >
              <Ionicons name="cart-outline" size={22} color="white" />
              <Text className="text-white text-base font-bold ml-2">
                Add to Cart
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}
