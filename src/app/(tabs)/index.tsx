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
import { COLORS, SPACING } from "../../constants/theme";

// This matches what ProductCard.tsx expects for a seamless UI
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

  // Fetch data automatically when the screen loads
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
        // Map your complex backend data to the simple format the ProductCard needs
        const mappedProducts = json.data.map((item: any) => {
          // Get the first variant to display the default size and price
          const firstVariant =
            item.variants && item.variants.length > 0 ? item.variants[0] : null;

          return {
            id: item.id.toString(),
            name: item.name,
            size: firstVariant ? firstVariant.size : "N/A",
            price: firstVariant ? firstVariant.price_npr : 0,
            image: getImageUrl(item.image), // Safely converts the filename to a full URL
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HomeHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroBanner />
        <CategoryRow />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Database Rendering Logic */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
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
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginHorizontal: SPACING.m,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  seeAllText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
  },

  // Loading and Error Styles
  centerBox: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.m,
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
});
