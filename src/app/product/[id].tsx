import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import ProductCard from "../../components/home/ProductCard";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, SPACING } from "../../constants/theme";

// Reusing our Product interface
interface FormattedProduct {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  // We grab the category title that was passed when the user clicked the card (e.g., "Paneer")
  const { title } = useLocalSearchParams();

  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (title) {
      fetchProductsByCategory(title as string);
    }
  }, [title]);

  const fetchProductsByCategory = async (categoryName: string) => {
    try {
      setIsLoading(true);
      // We pass the category name to the API we just updated
      const url = `${API_ENDPOINTS.PRODUCTS}?category=${encodeURIComponent(categoryName)}`;
      const response = await fetch(url);
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
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Products</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center title */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centerBox}>
            <Feather
              name="shopping-bag"
              size={48}
              color="#D3D3D3"
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.emptyText}>
              No products found in {title} yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Check back later for fresh stock!
            </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  scrollContent: { paddingBottom: 100, paddingTop: SPACING.m },
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
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});
