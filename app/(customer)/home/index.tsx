import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useProducts } from "@/src/context/ProductContext";
import { Product } from "@/src/constants/types.product";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useMemo } from "react";
import { useTheme } from "@/src/context/ThemeContext";
import { lightColors, darkColors } from "@/src/constants/Colors";
import { ErrorState, ProductCardSkeleton } from "@/src/helpers/skeletons";
import { LinearGradient } from "expo-linear-gradient";

export type ListItem = Product | { pid: string; isPlaceholder: true };

const CategoryFilters = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const { categories, selectedCategory, setSelectedCategory } = useProducts();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  return (
    <View className="pt-2 pb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => {
              selectedCategory === category.name
                ? setSelectedCategory("")
                : setSelectedCategory(category.name);
            }}
            style={{
              backgroundColor:
                selectedCategory === category.name
                  ? colors.accent
                  : colors.card + "80",
              borderColor: colors.border + "90",
              borderWidth: 1,
              boxShadow:
                effectiveTheme === "dark"
                  ? "0 0px 1px rgba(255, 255, 255, 0.5)"
                  : "0 0px 1px rgba(0, 0, 0, 0.2)",
              overflowY: "visible",
            }}
            className="px-5 py-2.5 my-1 rounded-2xl mr-3 border"
          >
            <Text
              style={{
                color:
                  selectedCategory === category.name ? "white" : colors.text,
              }}
              className="font-normal text-medium"
            >
              {category.name.trim() || "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const ProductCard = ({
  product,
  effectiveTheme,
}: {
  product: Product;
  effectiveTheme: "light" | "dark";
}) => {
  const { likedProductIds, toggleLikeProduct } = useAuth();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const isSaved = likedProductIds.includes(product.pid);

  const handleSavePress = () => {
    toggleLikeProduct(product.pid);
  };

  return (
    <Link href={`/(customer)/home/${product.pid}`} asChild>
      <TouchableOpacity
        className="flex-1 m-1.5 border rounded-lg shadow-md"
        style={{
          backgroundColor:
            effectiveTheme === "dark" ? darkColors.input : lightColors.card,
          borderColor: colors.border,
          shadowColor: effectiveTheme === "dark" ? "#fff" : "#000",
        }}
      >
        <View>
          <View className="relative">
            <TouchableOpacity
              onPress={handleSavePress}
              style={{ backgroundColor: colors.card }}
              className="absolute top-3 right-3 p-1  shadow z-10 rounded-md"
            >
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={24}
                color={isSaved ? "#ef4444" : colors.text}
              />
            </TouchableOpacity>
            <Image
              source={{ uri: product.imagesUrl[0] }}
              style={{ backgroundColor: colors.border }}
              className="w-full aspect-square rounded-lg overflow-hidden"
              resizeMode="cover"
            />
          </View>

          <View className="p-3">
            <Text
              style={{ color: colors.text }}
              className="text-text font-Fredoka_Medium"
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text
              style={{ color: colors.secondaryText }}
              className="text-medium font-Fredoka_Regular mt-1"
            >
              ${product.price.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const ListFooter = ({
  effectiveTheme,
}: {
  effectiveTheme: "light" | "dark";
}) => {
  const { loadingMore, hasMore } = useProducts();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  if (loadingMore) {
    return (
      <View className="p-10 justify-center items-center">
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return <View className="h-20" />;
};

// const SearchAndFilter = ({
//   effectiveTheme,
// }: {
//   effectiveTheme: "light" | "dark";
// }) => {
//   const colors = effectiveTheme === "dark" ? darkColors : lightColors;
//   return (
//     <View className="flex-row items-center p-4 pt-2 gap-x-3">
//       <View
//         style={{
//           backgroundColor: colors.card + "60",
//           borderColor: colors.border + "80",
//         }}
//         className="flex-1 flex-row items-center border rounded-lg px-3"
//       >
//         <MaterialCommunityIcons
//           name="archive-search"
//           size={20}
//           color={colors.placeholder}
//         />
//         <TextInput
//           placeholder="Search for clothes..."
//           className="flex-1 h-12 ml-2 text-base"
//           style={{ color: colors.text }}
//           placeholderTextColor={colors.placeholder}
//         />
//       </View>
//       <TouchableOpacity
//         style={{ backgroundColor: colors.accent }}
//         className="p-3 rounded-lg"
//       >
//         <Ionicons name="search" size={24} color="white" />
//       </TouchableOpacity>
//     </View>
//   );
// };

export default function CustomerHomeScreen() {
  const { products, loading, error, loadMoreProducts, hasMore, fetchProducts } =
    useProducts();
  const { effectiveTheme } = useTheme();
  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  const dataForList: ListItem[] = useMemo(() => {
    if (products.length % 2 !== 0) {
      return [...products, { isPlaceholder: true, pid: "placeholder-item" }];
    }
    return products;
  }, [products]);

  if (error) {
    return (
      <ErrorState
        error={error || "Failed to load products."}
        onRetry={fetchProducts}
        effectiveTheme={effectiveTheme}
      />
    );
  }

  return (
    <View style={{ flex: 1 }} className="flex justify-start mt-2">
      <FlatList
        data={loading ? [] : dataForList}
        keyExtractor={(item, index) => `${item.pid}-${index}`}
        numColumns={2}
        renderItem={({ item }) => {
          if ("isPlaceholder" in item) {
            return <View className="flex-1 m-1.5" />;
          }
          return <ProductCard product={item} effectiveTheme={effectiveTheme} />;
        }}
        ListHeaderComponent={
          <>
            {/* <SearchAndFilter effectiveTheme={effectiveTheme} /> */}
            <TouchableOpacity
              className="relative flex justify-center mb-4 w-[85%] mx-auto rounded-3xl overflow-hidden"
              style={{ position: "relative" }}
              onPress={() => router.push("https://expo.dev")}
            >
              <Text
                className="absolute text-white text-[30px] font-MuseoModerno_SemiBold bottom-2 left-4"
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 16,
                  zIndex: 2,
                }}
              >
                Become a Seller
              </Text>
              <LinearGradient
                colors={["#242d1690", "transparent", "#242d1690"]}
                start={{ x: 0.2, y: 1 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                }}
              />
              <Image
                source={require("@/assets/images/BecomeSellerPoster1.png")}
                className="w-full h-32 mx-auto object-cover"
                style={{
                  zIndex: 0,
                }}
              />
            </TouchableOpacity>
            <CategoryFilters effectiveTheme={effectiveTheme} />
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ flex: 1 }}>
              <FlatList
                data={Array(6).fill(0)}
                numColumns={2}
                keyExtractor={(_, index) => `skeleton-${index}`}
                renderItem={() => (
                  <ProductCardSkeleton effectiveTheme={effectiveTheme} />
                )}
                contentContainerStyle={{ paddingHorizontal: 8 }}
              />
            </View>
          ) : (
            <View className="flex-1 justify-center items-center mt-20 p-5">
              <View
                className="m-3  "
                style={{
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? darkColors.accent + "30"
                      : lightColors.accent + "30",
                  padding: 20,
                  borderRadius: 50,
                }}
              >
                <Ionicons name="file-tray-outline" size={60} color="#557754" />
              </View>
              <Text
                style={{ color: colors.secondaryText }}
                className="mt-4 text-center"
              >
                No products found in this category.
              </Text>
            </View>
          )
        }
        ListFooterComponent={<ListFooter effectiveTheme={effectiveTheme} />}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMoreProducts();
          }
        }}
        onEndReachedThreshold={0.7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchProducts} />
        }
      />
    </View>
  );
}
