import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryRow from "../../components/home/CategoryRow";
import HeroBanner from "../../components/home/HeroBanner";
import HomeHeader from "../../components/home/HomeHeader";
import ProductCard from "../../components/home/ProductCard";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { RADIUS, SPACING } from "../../constants/theme";

interface FormattedProduct {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
}

export default function HomeScreen() {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔥 1. Add state to track what the user types in the search bar
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.PRODUCTS);
      const json = await response.json();

      if (json.status === "success") {
        const mappedProducts = json.data.map((item: any) => {
          const firstVariant =
            item.variants && item.variants.length > 0 ? item.variants[0] : null;
          return {
            id: item.id.toString(),
            name: item.name,
            size: firstVariant ? firstVariant.size : "N/A",
            price: firstVariant ? firstVariant.price_npr : 0,
            image: getImageUrl(item.image),
          };
        });
        setProducts(mappedProducts);
      } else {
        setError("Failed to load products from database.");
      }
    } catch (err) {
      console.error("API Fetch Error:", err);
      setError("Cannot connect to server. Check your WiFi/IP address.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 2. Create a filtered list based on the search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 🔥 3. Pass the state and setter down to the Header */}
      <HomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 🔥 4. Hide banners and categories if the user is actively searching */}
        {searchQuery.length === 0 && (
          <>
            <HeroBanner />
            <CategoryRow />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery.length > 0
              ? `Search Results for "${searchQuery}"`
              : "Best Sellers"}
          </Text>
          {searchQuery.length === 0 && (
            <TouchableOpacity activeOpacity={0.8} onPress={fetchProducts}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#800000" />
            <Text style={styles.loadingText}>Fetching fresh products...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={fetchProducts}
              style={styles.retryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProducts.length === 0 ? (
          // 🔥 5. Show a nice empty state if the search finds nothing
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
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  scrollContent: { paddingBottom: 100 },
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
    paddingHorizontal: SPACING.m,
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

  // Empty Search State Styles
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
