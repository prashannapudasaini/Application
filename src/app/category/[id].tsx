import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

interface FormattedProduct {
  id: string;
  name: string;
  size: string;
  price: number;
  original_price?: number;
  image: string;
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();

  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCategoryProducts();
    }
  }, [id]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/api/products/index.php`);
      const json = await response.json();

      if (json.status === "success") {
        const filteredProducts = json.data.filter(
          (item: any) => item.category_id == id,
        );
        const mappedProducts = filteredProducts.map((item: any) => {
          let cheapestVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
          if (item.variants && item.variants.length > 0) {
            cheapestVariant = item.variants.reduce((prev: any, curr: any) => {
              const prevPrice = Number(prev.price_npr || 0);
              const currPrice = Number(curr.price_npr || 0);
              if (prevPrice === 0) return curr;
              if (currPrice === 0) return prev;
              return prevPrice < currPrice ? prev : curr;
            }, item.variants[0]);
          }
          const price = cheapestVariant ? parseFloat(cheapestVariant.price_npr) : parseFloat(item.price || 0);
          const originalPrice = cheapestVariant?.original_price ? parseFloat(cheapestVariant.original_price) : (item.original_price ? parseFloat(item.original_price) : null);

          return {
            id: item.id.toString(),
            name: item.name,
            size: cheapestVariant ? cheapestVariant.size : "Standard",
            price: price,
            original_price: originalPrice,
            image: getImageUrl(item.image),
          };
        });
        setProducts(mappedProducts);
      } else {
        setError("Could not load products for this category.");
      }
    } catch (err) {
      console.error("Category Products Fetch Error:", err);
      setError("Cannot connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/categories");
    }
  };

  const renderGridCard = ({ item }: { item: FormattedProduct }) => {
    const showDiscount = item.original_price !== undefined && item.original_price !== null && item.original_price > item.price;
    const discountPercent = showDiscount ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100) : 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productSize}>{item.size}</Text>
          <View style={styles.footerRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>NPR {item.price}</Text>
              {showDiscount && (
                <View style={styles.discountRow}>
                  <Text style={styles.cutPriceText}>NPR {item.original_price}</Text>
                  <Text style={styles.discountPercentText}>-{discountPercent}%</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
              <Feather name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name || "Category"}
        </Text>
        <View style={{ width: 40 }}></View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#A11217" />
            <Text style={styles.loadingText}>Loading fresh items...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Feather
              name="alert-circle"
              size={40}
              color={COLORS.textSecondary}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={fetchCategoryProducts}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.rowWrapper}
            renderItem={renderGridCard}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="box" size={40} color="#A11217" />
                </View>
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptySubtitle}>
                  We currently don't have any products available in the {name}{" "}
                  category.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  content: { flex: 1 },
  gridContainer: { padding: SPACING.m, paddingBottom: 40 },
  rowWrapper: { justifyContent: "space-between", marginBottom: SPACING.m },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.m,
  },
  productImage: { width: "100%", height: "100%" },
  cardBody: { padding: SPACING.m },
  productName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  productSize: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  productPrice: { fontSize: 16, fontWeight: "900", color: "#800000" },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  cutPriceText: {
    fontSize: 11,
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  addBtn: {
    backgroundColor: "#A11217",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    marginTop: 60,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#800000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
