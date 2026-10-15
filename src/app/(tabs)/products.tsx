import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";
import { useCart } from "../../context/CartContext";

interface Variant {
  size: string;
  price_npr: number;
  stock_quantity: number;
  original_price?: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  stock?: number;
  stock_quantity?: number;
  variants: Variant[];
}

const CATEGORIES = [
  "All",
  "Milk",
  "Curd",
  "Ghee",
  "Butter",
  "Paneer",
  "Cheese",
  "Ice Cream",
  "Lassi",
  "Flavored Milk",
  "Beverages",
];

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCategory = typeof params.category === "string" && params.category ? params.category : "All";

  const { items, addToCart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const safeItems = items || [];
  const totalCartCount = safeItems.reduce((acc, i) => acc + (i.quantity || 0), 0);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync if route params change
  useEffect(() => {
    if (params.category && typeof params.category === "string") {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const endpoint = API_ENDPOINTS?.PRODUCTS || "/api/products/index.php";
      const separator = endpoint.includes("?") ? "&" : "?";
      const response = await api.get(`${endpoint}${separator}_t=${Date.now()}`);
      const json = response.data;

      if (json?.status === "success" && Array.isArray(json?.data)) {
        setProducts(json.data);
      } else if (Array.isArray(json)) {
        setProducts(json);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "All" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const renderProductCard = ({ item }: { item: Product }) => {
    let activePrice = 0;
    let cutPrice: number | null = null;
    let defaultSize = "Standard";

    if (item.variants?.length > 0) {
      const cheapestVariant = item.variants.reduce((prev, curr) => {
        const prevPrice = Number(prev.price_npr || 0);
        const currPrice = Number(curr.price_npr || 0);
        if (prevPrice === 0) return curr;
        if (currPrice === 0) return prev;
        return prevPrice < currPrice ? prev : curr;
      }, item.variants[0]);

      if (cheapestVariant) {
        activePrice = Number(cheapestVariant.price_npr || 0);
        defaultSize = cheapestVariant.size || "Standard";
        cutPrice = cheapestVariant.original_price
          ? Number(cheapestVariant.original_price)
          : null;
      }
    }

    const showDiscount = cutPrice !== null && cutPrice > activePrice;
    const discountPercent = showDiscount
      ? Math.round(((cutPrice! - activePrice) / cutPrice!) * 100)
      : 0;

    const formattedImageUrl = item.image
      ? getImageUrl(item.image)
      : "https://via.placeholder.com/150";

    const totalStock =
      item.variants && item.variants.length > 0
        ? item.variants.reduce(
            (acc, v) => acc + parseInt(String(v.stock_quantity || 0), 10),
            0,
          )
        : parseInt(String(item.stock ?? item.stock_quantity ?? 0), 10);

    const isOutOfStock = totalStock <= 0;

    // Check quantity of this product in cart
    const activeCartItem = safeItems.find(
      (ci) => ci.id === String(item.id) || ci.cartItemId?.startsWith(`${item.id}-`),
    );
    const quantity = activeCartItem ? activeCartItem.quantity : 0;

    const handleAdd = (e: any) => {
      e.stopPropagation();
      addToCart({
        id: String(item.id),
        name: item.name,
        price: activePrice,
        image: item.image,
        size: defaultSize,
      });
    };

    const handleIncrement = (e: any) => {
      e.stopPropagation();
      if (activeCartItem) {
        updateQuantity(activeCartItem.cartItemId, activeCartItem.quantity + 1);
      } else {
        handleAdd(e);
      }
    };

    const handleDecrement = (e: any) => {
      e.stopPropagation();
      if (activeCartItem) {
        if (activeCartItem.quantity <= 1) {
          removeFromCart(activeCartItem.cartItemId);
        } else {
          updateQuantity(activeCartItem.cartItemId, activeCartItem.quantity - 1);
        }
      }
    };

    return (
      <TouchableOpacity
        style={[styles.card, isOutOfStock && { opacity: 0.55 }]}
        activeOpacity={0.85}
        disabled={isOutOfStock}
        onPress={() =>
          router.push({
            pathname: `/product/${item.id}` as any,
            params: {
              name: item.name,
              image: formattedImageUrl,
            },
          })
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: formattedImageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {quantity > 0 && (
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>{quantity} in cart</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>NPR {activePrice}</Text>
              {showDiscount && (
                <View style={styles.discountRow}>
                  <Text style={styles.cutPriceText}>NPR {cutPrice}</Text>
                  <Text style={styles.discountPercentText}>-{discountPercent}%</Text>
                </View>
              )}
            </View>

            {isOutOfStock ? (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
              </View>
            ) : quantity === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={handleAdd}
              >
                <Feather name="plus" size={16} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.counterPill}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  activeOpacity={0.7}
                  onPress={handleDecrement}
                >
                  <Feather name="minus" size={13} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.counterText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.counterBtn}
                  activeOpacity={0.7}
                  onPress={handleIncrement}
                >
                  <Feather name="plus" size={13} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} items available
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/cart")}
          activeOpacity={0.8}
        >
          <Feather name="shopping-bag" size={20} color="#1A1A1A" />
          {totalCartCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fresh dairy items..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORY CHIPS */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* PRODUCTS LIST */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading fresh dairy products...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather name="package" size={48} color="#CCC" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No items matching "${searchQuery}".`
              : `No items available in "${selectedCategory}".`}
          </Text>
          {(selectedCategory !== "All" || searchQuery) && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            >
              <Text style={styles.resetBtnText}>View All Products</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductCard}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            totalCartCount > 0 && { paddingBottom: 120 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FLOATING VIEW CART BAR */}
      {totalCartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            activeOpacity={0.9}
            onPress={() => router.push("/cart")}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartBadge}>
                <Feather name="shopping-bag" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.floatingCartCount}>
                  {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"} in Cart
                </Text>
                <Text style={styles.floatingCartTotal}>
                  NPR {cartTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartAction}>View Cart</Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginTop: 1,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  headerBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },

  // SEARCH
  searchContainer: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    padding: 0,
  },

  // CATEGORY CHIPS
  chipsContainer: {
    paddingVertical: 8,
  },
  chipsScroll: {
    paddingHorizontal: SPACING.m,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.round,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  chipTextActive: {
    color: "#FFF",
  },

  // PRODUCT LIST
  listContent: {
    padding: SPACING.m,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },

  // CARD
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.s,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 125,
    backgroundColor: "#F9F9F9",
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.s,
    padding: SPACING.xs,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  qtyBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  qtyBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },
  productInfo: {
    paddingHorizontal: 2,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: "column",
    flex: 1,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cutPriceText: {
    fontSize: 10,
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#16A34A",
  },

  // BUTTONS
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    height: 30,
    paddingHorizontal: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  counterBtn: {
    paddingHorizontal: 6,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginHorizontal: 2,
    minWidth: 16,
    textAlign: "center",
  },
  outOfStockBadge: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  outOfStockText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B7280",
  },

  // STATES
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  emptyText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.medium,
  },
  resetBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // FLOATING BOTTOM CART BAR
  floatingCartContainer: {
    position: "absolute",
    bottom: 20,
    left: SPACING.m,
    right: SPACING.m,
  },
  floatingCartBar: {
    backgroundColor: "#1A1A1A",
    borderRadius: RADIUS.large,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  floatingCartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  floatingCartCount: {
    color: "#CCC",
    fontSize: 11,
    fontWeight: "700",
  },
  floatingCartTotal: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },
  floatingCartRight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
  },
  floatingCartAction: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 4,
  },
});
