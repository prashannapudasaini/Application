import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import HomeHeader from "../../components/home/HomeHeader";
import ProductCard from "../../components/home/ProductCard";
import { ProductSkeleton } from "../../components/home/SkeletonLoader";

const HeroBanner = lazy(() => import("../../components/home/HeroBanner"));
const CategoryRow = lazy(() => import("../../components/home/CategoryRow"));
import { ENDPOINTS } from "../../constants/api";
import { RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";

interface FormattedProduct {
  id: string;
  name: string;
  category?: string;
  stock?: number;
  stock_quantity?: number;
  variants?: any[];
  size: string;
  price: number;
  image: string;
}

// Helper to safely format image URLs if not already full paths
const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://sitaramdudh.com/backend/${path.replace(/^\//, "")}`;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "price_asc" | "price_desc">("latest");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch when debounced query or sort changes
  useEffect(() => {
    fetchData();
  }, [debouncedSearchQuery, sortBy]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build API query parameters
      const isDefaultFetch = debouncedSearchQuery === "" && sortBy === "latest";
      let productEndpoint = ENDPOINTS.PRODUCTS;
      const separator = productEndpoint.includes('?') ? '&' : '?';
      
      if (!isDefaultFetch) {
        productEndpoint += `?q=${encodeURIComponent(debouncedSearchQuery)}&sort=${sortBy}&_t=${Date.now()}`;
      } else {
        productEndpoint += `${separator}_t=${Date.now()}`;
        // --- STALE-WHILE-REVALIDATE CACHING ---
        // Instantly load from cache so UI doesn't show loading skeletons unnecessarily on mount
        const cachedProducts = await AsyncStorage.getItem("@cached_products");
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
          setIsLoading(false); // Hide loading immediately if we have a cache!
        }
      }

      // Fetch products and categories concurrently
      const [productsRes, categoriesRes] = await Promise.all([
        api.get(productEndpoint).catch((err) => ({ error: err })),
        api.get(ENDPOINTS.CATEGORIES).catch((err) => ({ error: err })),
      ]);

      if (productsRes && !("error" in productsRes)) {
        const json = productsRes.data;
        if (json.status === "success" && Array.isArray(json.data)) {
          const mappedProducts = json.data.map((item: any) => {
            const firstVariant =
              item.variants && item.variants.length > 0 ? item.variants[0] : null;
            return {
              id: item.id.toString(),
              name: item.name,
              category: item.category,
              stock: item.stock,
              stock_quantity: item.stock_quantity,
              variants: item.variants,
              size: firstVariant ? firstVariant.size : "N/A",
              price: firstVariant ? Number(firstVariant.price_npr) : 0,
              image: getImageUrl(item.image),
            };
          });
          
          setProducts(mappedProducts);

          // Update cache silently in the background
          if (isDefaultFetch) {
            AsyncStorage.setItem("@cached_products", JSON.stringify(mappedProducts));
          }
        } else {
          setError("Failed to load products from database.");
        }
      } else {
        console.error("API Fetch Error:", (productsRes as any)?.error);
        setError("Cannot connect to server. Check your WiFi/IP address.");
      }

      if (categoriesRes && !("error" in categoriesRes)) {
        const json = categoriesRes.data;
        if (json?.status === "success" || Array.isArray(json?.data)) {
          const rawList = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
          setCategories(
            rawList.map((item: any) => ({
              id: item.id.toString(),
              name: item.name,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      setError("Cannot connect to server. Check your WiFi/IP address.");
    } finally {
      setIsLoading(false);
    }
  };

  // We no longer filter locally, the backend handles it!
  const displayProducts = products;
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Modal visible={showPopup} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity 
              style={styles.closePopupButton} 
              onPress={() => setShowPopup(false)}
              activeOpacity={0.8}
            >
              <Feather name="x" size={20} color="#000" />
            </TouchableOpacity>
            <Image 
              source={require("../../../assets/images/popup.jpeg")} 
              style={styles.popupImage} 
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      <HomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <FlatList
        data={isLoading || error || displayProducts.length === 0 ? [] : displayProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: SPACING.m }}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/scan-and-win" as any)}
              style={styles.scanBanner}
            >
              <View style={styles.scanBannerIconWrapper}>
                <Feather name="gift" size={24} color="#800000" />
              </View>
              <View style={styles.scanBannerTextContainer}>
                <Text style={styles.scanBannerTitle}>SCAN & WIN!</Text>
                <Text style={styles.scanBannerSubtitle}>Win a Gift Hamper every 10 days!</Text>
              </View>
              <Feather name="chevron-right" size={24} color="#E2B254" />
            </TouchableOpacity>

            {searchQuery.length === 0 && (
              <Suspense fallback={<View style={{ height: 150, justifyContent: 'center' }}><ActivityIndicator size="small" color="#800000" /></View>}>
                <HeroBanner />
                <CategoryRow initialCategories={categories} />
              </Suspense>
            )}

            <View style={[styles.sectionHeader, { alignItems: 'center' }]}>
              <Text style={styles.sectionTitle}>
                {debouncedSearchQuery.length > 0
                  ? `Search Results for "${debouncedSearchQuery}"`
                  : "All Products"}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setSortBy(sortBy === "price_asc" ? "price_desc" : sortBy === "price_desc" ? "latest" : "price_asc")}>
                  <Text style={[styles.seeAllText, { color: sortBy === "latest" ? "#666" : "#800000" }]}>
                    {sortBy === "price_asc" ? "Price: Low to High" : sortBy === "price_desc" ? "Price: High to Low" : "Sort: Latest"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.productGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={fetchData}
                style={styles.retryBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Feather
                name="search"
                size={48}
                color="#CCCCCC"
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyStateTitle}>No products found</Text>
              <Text style={styles.emptyStateSub}>
                We couldn't find anything matching "{searchQuery}". Try a
                different keyword.
              </Text>
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  scrollContent: { paddingBottom: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  popupContainer: {
    width: "85%",
    aspectRatio: 3/4,
    backgroundColor: "transparent",
    borderRadius: RADIUS.large,
    overflow: "hidden",
    position: "relative",
  },
  popupImage: {
    width: "100%",
    height: "100%",
  },
  closePopupButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  scanBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#800000", // App primary maroon theme
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: "rgba(226, 178, 84, 0.5)", // Gold border
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  scanBannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2B254",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#E2B254",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  scanBannerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  scanBannerTitle: {
    color: "#E2B254",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  scanBannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginHorizontal: SPACING.m,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#1A1A1A" },
  seeAllText: { fontSize: 13, fontWeight: "800", color: "#800000" },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  centerBox: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: "#555",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#800000",
    textAlign: "center",
    marginBottom: SPACING.m,
    fontWeight: "600",
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: "#800000",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
  emptyStateContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  clearSearchBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
  },
  clearSearchText: { color: "#800000", fontWeight: "800", fontSize: 14 },
});
