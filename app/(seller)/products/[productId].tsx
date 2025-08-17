import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import { db } from "@/src/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import { Product, Review } from "@/src/constants/types.product";
import { useAuth } from "@/src/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  StatusBar,
} from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { mapSupabaseToProduct } from "@/src/helpers/helper";
import { useTheme } from "@/src/context/ThemeContext";
import { darkColors, lightColors } from "@/src/constants/Colors";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const REVIEWS_PER_PAGE = 10;
// The height of the image carousel, used for layout calculations.
const IMAGE_CAROUSEL_HEIGHT = SCREEN_WIDTH;

const HIDE_THRESHOLD = 200;
const SHOW_THRESHOLD = 300;

// --- Skeleton Loader Component ---
const SkeletonLoader = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const imageSize = SCREEN_WIDTH * 0.9;

  // Define colors based on the theme prop
  const isDark = effectiveTheme === "dark";
  const mainBg = isDark ? "bg-zinc-800" : "bg-gray-100";
  const placeholderBg = isDark ? "bg-zinc-700" : "bg-gray-200";
  const cardBg = isDark ? "bg-zinc-800" : "bg-white";

  return (
    <View className={`flex-1 items-center pt-4 ${mainBg}`}>
      <View
        className={`rounded-xl ${placeholderBg}`}
        style={{ width: imageSize, height: imageSize }}
      />

      <View className="w-full px-5 mt-4 space-y-4">
        <View className={`p-5 rounded-2xl shadow ${cardBg}`}>
          <View className={`w-3/4 h-6 rounded-md ${placeholderBg}`} />
          <View className={`w-1/2 h-9 rounded-md mt-2 ${placeholderBg}`} />
          <View className={`w-full h-4 rounded-md mt-4 ${placeholderBg}`} />
          <View className={`w-11/12 h-4 rounded-md mt-2 ${placeholderBg}`} />
        </View>

        {/* Tab Switcher */}
        <View
          className={`p-1 rounded-full mt-5 ${
            isDark ? "bg-zinc-700/70" : "bg-gray-200/70"
          }`}
        >
          <View className={`h-10 w-full rounded-full ${cardBg}`} />
        </View>

        {/* Grid */}
        <View className="flex-row space-x-4 mt-5">
          <View className={`flex-1 h-24 rounded-2xl ${cardBg}`} />
          <View className={`flex-1 h-24 rounded-2xl ${cardBg}`} />
        </View>
        <View className="flex-row space-x-4 mt-4">
          <View className={`flex-1 h-24 rounded-2xl ${cardBg}`} />
          <View className={`flex-1 h-24 rounded-2xl ${cardBg}`} />
        </View>
      </View>
    </View>
  );
};

// --- Re-designed Components ---
const StatCard = ({
  label,
  value,
  icon,
  effectiveTheme,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  effectiveTheme: string;
}) => (
  <View
    className="flex-1 p-4 rounded-2xl items-center shadow-sm border"
    style={{
      borderColor:
        effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      backgroundColor:
        effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      elevation: 5,
      shadowColor: effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
    }}
  >
    <View className="flex-row items-center flex w-full justify-between px-8">
      <Ionicons
        name={icon}
        size={28}
        color={
          effectiveTheme === "dark"
            ? darkColors.secondaryText
            : lightColors.secondaryText
        }
      />
      <Text
        className="text-heading font-Fredoka_SemiBold mt-2 "
        style={{
          color:
            effectiveTheme === "dark"
              ? darkColors.secondaryText
              : lightColors.secondaryText,
        }}
      >
        {value}
      </Text>
    </View>

    <Text
      className="text-medium font-Fredoka_Regular mt-2"
      style={{
        color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
      }}
    >
      {label}
    </Text>
  </View>
);

const ReviewCard = ({
  review,
  effectiveTheme,
}: {
  review: Review;
  effectiveTheme: string;
}) => (
  <View
    className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-200/30 mx-5"
    style={{
      borderColor:
        effectiveTheme === "dark" ? darkColors.border : lightColors.border,
      backgroundColor:
        effectiveTheme === "dark" ? darkColors.card : lightColors.card,
      elevation: 5,
      shadowColor: effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
    }}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Text
        className="text-text font-Fredoka_Medium"
        style={{
          color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
        }}
      >
        {review.userName}
      </Text>
      <View className="flex-row items-center  px-2.5 py-1 rounded-full">
        <Text
          className="text-medium font-Fredoka_Medium mr-2"
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
      className="text-medium font-Fredoka_Regular leading-6"
      style={{
        color: effectiveTheme === "dark" ? darkColors.text : lightColors.text,
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
}: {
  images: string[];
  scrollY: Animated.Value;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // useEffect(() => {
  //   console.log(scrollY);
  // }, [scrollY]);

  // Parallax effect for the image carousel. It moves up at half the scroll speed.
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

export default function SellerProductDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();

  // --- Animation and Scroll State ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const imageAnimation = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // --- Data State ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Analytics");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [lastVisibleReview, setLastVisibleReview] =
    useState<DocumentData | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchProduct = async () => {
    if (!productId) return;
    !product && setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) throw error;
      if (data) {
        setProduct(mapSupabaseToProduct(data));
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      Alert.alert("Error", "Could not load product details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = useCallback(
    async (loadMore = false) => {
      if (!productId || (loadMore && !hasMoreReviews)) return;
      setLoadingReviews(true);
      try {
        const reviewsRef = collection(db, "reviews");
        const qConstraints = [
          where("productId", "==", productId),
          orderBy("createdAt", "desc"),
          limit(REVIEWS_PER_PAGE),
        ];
        const q =
          loadMore && lastVisibleReview
            ? query(reviewsRef, ...qConstraints, startAfter(lastVisibleReview))
            : query(reviewsRef, ...qConstraints);
        const docSnap = await getDocs(q);
        const newReviews = docSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Review[];
        if (docSnap.docs.length < REVIEWS_PER_PAGE) setHasMoreReviews(false);
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
    [productId, hasMoreReviews, lastVisibleReview]
  );

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  // --- Animation Logic ---
  useEffect(() => {
    // This effect triggers the animation for the header info card.
    Animated.timing(headerAnimation, {
      toValue: isHeaderVisible ? 0 : -300,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isHeaderVisible]);

  useEffect(() => {
    // This effect triggers the animation for the main image and spacer.
    // useNativeDriver is set to false because we are animating 'height' (a layout property).
    Animated.timing(imageAnimation, {
      toValue: isImageVisible ? 0 : -IMAGE_CAROUSEL_HEIGHT,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isImageVisible]);

  // --- Event Handlers ---
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // When refreshing, make sure everything is visible again.
    setIsHeaderVisible(true);
    setIsImageVisible(true);
    await fetchProduct();
    if (activeTab === "Reviews") {
      setLastVisibleReview(null);
      setHasMoreReviews(true);
      await fetchReviews();
    }
    setIsRefreshing(false);
  }, [activeTab, fetchReviews]);

  const handleEdit = () => {
    if (!product) return;
    router.push({
      pathname: "/(seller)/products/add",
      params: { pid: product.pid },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      "This will mark the product as deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!product) return;
            const { error } = await supabase
              .from("products")
              .update({ deleted: true })
              .eq("id", product.pid);
            if (error) Alert.alert("Error", "Failed to delete the product.");
            else {
              Alert.alert("Success", "Product has been deleted.");
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleToggleDisabled = async () => {
    if (!product) return;
    const newDisabledState = !product.disabled;
    const { data, error } = await supabase
      .from("products")
      .update({ disabled: newDisabledState })
      .eq("id", product.pid)
      .select()
      .single();
    if (error) Alert.alert("Error", "Could not update product visibility.");
    else if (data) {
      setProduct((prev) =>
        prev ? { ...prev, disabled: data.disabled } : null
      );
      Alert.alert(
        "Success",
        `Product is now ${newDisabledState ? "hidden" : "visible"}.`
      );
    }
  };

  // This handler contains the logic to show/hide the header and image based on scroll direction.
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentScrollY = (
          event as { nativeEvent: { contentOffset: { y: number } } }
        ).nativeEvent.contentOffset.y;
        // Ignore bounce scrolling at the top
        if (currentScrollY < 0) return;

        const direction = currentScrollY > lastScrollY.current ? "down" : "up";

        const isScrollingDown = direction === "down";

        // --- Logic for hiding components ---
        if (isScrollingDown) {
          // Hide header only if it's currently visible and we've passed the threshold.
          if (isHeaderVisible && currentScrollY > HIDE_THRESHOLD) {
            setIsHeaderVisible(false);
          }
          // Hide image only if it's currently visible and we've passed the threshold.
          if (isImageVisible && currentScrollY > SHOW_THRESHOLD) {
            setIsImageVisible(false);
          }
          // setStatusBarBackgroundColor("transparent");
          setStatusBarStyle("dark");
        }
        // --- Logic for showing components ---
        else {
          // Show header only if it's currently hidden and we are scrolling up.
          // setStatusBarBackgroundColor("white");
          setStatusBarStyle("dark");
          if (!isHeaderVisible) {
            setIsHeaderVisible(true);
          }
          // Show image only if it's currently hidden and we are scrolling up.
          if (!isImageVisible) {
            setIsImageVisible(true);
          }
        }

        lastScrollY.current = currentScrollY;
      },
    }
  );

  // --- Render Methods ---
  if (loading) {
    return <SkeletonLoader effectiveTheme={effectiveTheme} />;
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Stack.Screen
          options={{
            headerTransparent: true,
            title: "",
            headerTintColor: effectiveTheme === "dark" ? "#fff" : "#000",
          }}
        />
        <Text className="text-base text-gray-500">Product not found.</Text>
      </View>
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
        <ImageCarousel images={product.imagesUrl} scrollY={scrollY} />
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ translateY: headerAnimation }],
          opacity: headerAnimation.interpolate({
            inputRange: [-300, 0],
            outputRange: [0, 1],
          }),
        }}
      >
        <View className="p-5">
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
                    {product.ratingAvg?.toString() || "N/A"}
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
        </View>

        <View className="px-5">
          <View
            className="flex-row p-1 rounded-full shadow-md"
            style={{
              backgroundColor:
                effectiveTheme === "dark" ? darkColors.card : lightColors.card,
              elevation: 5,
              shadowColor:
                effectiveTheme === "dark" ? "#ffffff50" : "#00000050",
            }}
          >
            {["Analytics", "Reviews"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 items-center py-2.5 rounded-full`}
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
      </Animated.View>

      {/* Analytics section is outside the animated view, so it appears immediately */}
      {activeTab === "Analytics" ? (
        <View className="p-5">
          <View className="flex-row gap-x-4">
            <StatCard
              label="Revenue"
              value={`$${(product.totalRevenue || 0).toFixed(0)}`}
              icon="cash-outline"
              effectiveTheme={effectiveTheme}
            />
            <StatCard
              label="Sales"
              value={(product.totalSales || 0).toString()}
              icon="cart-outline"
              effectiveTheme={effectiveTheme}
            />
          </View>
          <View className="flex-row gap-x-4 mt-4">
            <StatCard
              label="Views"
              value={(product.totalViews || 0).toString()}
              icon="eye-outline"
              effectiveTheme={effectiveTheme}
            />
            <StatCard
              label="In Stock"
              value={product.stockQuantity?.toString() ?? "N/A"}
              icon="cube-outline"
              effectiveTheme={effectiveTheme}
            />
          </View>
        </View>
      ) : (
        <View className="h-8" />
      )}
    </>
  );

  const spacerHeight = imageAnimation.interpolate({
    inputRange: [-IMAGE_CAROUSEL_HEIGHT, 0],
    outputRange: [IMAGE_CAROUSEL_HEIGHT / 2, IMAGE_CAROUSEL_HEIGHT],
    extrapolate: "clamp",
  });

  return (
    <View className="flex-1 ">
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerTransparent: true,
        }}
      />

      <Animated.FlatList
        style={{ zIndex: 0 }}
        data={activeTab === "Reviews" ? reviews : []}
        renderItem={({ item }) => (
          <ReviewCard review={item} effectiveTheme={effectiveTheme} />
        )}
        keyExtractor={(item) => item.id}
        nestedScrollEnabled={true}
        ListHeaderComponent={() => {
          return (
            <>
              <Animated.View style={{ height: spacerHeight }} />
              {renderListHeader()}
            </>
          );
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          activeTab === "Reviews" && !loadingReviews ? (
            <View className="items-center justify-center py-16">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={60}
                color="#E6E6E6"
              />
              <Text className="text-base text-gray-500 mt-4">
                No reviews for this product yet.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          activeTab === "Reviews" && loadingReviews ? (
            <ActivityIndicator size="large" color="#0b6623" className="my-8" />
          ) : activeTab === "Reviews" &&
            hasMoreReviews &&
            reviews.length > 0 ? (
            <TouchableOpacity
              onPress={() => fetchReviews(true)}
              className="bg-green-700/10 p-4 rounded-full my-4 mx-5"
            >
              <Text className="text-green-700 font-bold text-center text-base">
                Load More Reviews
              </Text>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#0b6623"]}
            tintColor={"#0b6623"}
            progressViewOffset={40}
          />
        }
      />

      {/* Bottom Action Bar */}
      <View className="m-4 absolute bottom-0 left-0 right-0 z-10">
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={40}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
          className="  flex w-full flex-1 border rounded-2xl overflow-hidden "
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
          <View className="p-4 flex-row gap-x-3 items-center">
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500/10 p-3.5 rounded-full"
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleDisabled}
              className="p-3.5 rounded-full"
              style={{
                backgroundColor:
                  product.disabled && effectiveTheme === "dark"
                    ? darkColors.text + "10"
                    : product.disabled && effectiveTheme === "light"
                    ? lightColors.text + "10"
                    : "transparent",
              }}
            >
              <Ionicons
                name={product.disabled ? "eye-outline" : "eye-off-outline"}
                size={24}
                color={
                  effectiveTheme === "dark" ? darkColors.text : lightColors.text
                }
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEdit} className="flex-1 mx-2">
              <LinearGradient
                colors={["#0b6649", "#0b6623"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: 9999,
                }}
                className="p-2 rounded-full flex-row justify-center items-center overflow-hidden"
              >
                <Ionicons name="create-outline" size={22} color="white" />
                <Text className="text-white text-base font-bold ml-2">
                  Edit Product
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
