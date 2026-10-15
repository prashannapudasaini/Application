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
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id, image: paramImage, name: paramName } = useLocalSearchParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const initialName = typeof paramName === 'string' ? paramName : "";
  const initialImage = typeof paramImage === 'string' ? paramImage : "";

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/get_one.php?id=${id}&_t=${Date.now()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          const fetchedProduct = json.data;
          setProduct(fetchedProduct);
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            let cheapestIdx = 0;
            let minPrice = Infinity;
            fetchedProduct.variants.forEach((v: any, idx: number) => {
              const price = Number(v.price_npr || 0);
              if (price > 0 && price < minPrice) {
                minPrice = price;
                cheapestIdx = idx;
              }
            });
            setActiveVariantIndex(cheapestIdx);
          }
        }
      })
      .catch((err) => console.error("Detail Fetch Error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const activeVariant =
    product?.variants && product.variants.length > 0
      ? product.variants[activeVariantIndex]
      : null;

  const displayImage = activeVariant?.image
    ? getImageUrl(activeVariant.image)
    : product?.image
      ? getImageUrl(product.image)
      : initialImage;

  const basePrice = product ? parseFloat(activeVariant?.price_npr || product.price || 0) : 0;
  const cutPrice = product ? (activeVariant?.original_price ? parseFloat(activeVariant.original_price) : product.original_price ? parseFloat(product.original_price) : null) : null;
  const displaySize = product ? (activeVariant?.size || product.size || "Standard") : "";

  const showDiscount = cutPrice !== null && cutPrice > basePrice;
  const discountPercent = showDiscount ? Math.round(((cutPrice! - basePrice) / cutPrice!) * 100) : 0;

  // --- CURD & OUT-OF-STOCK RESTRICTION LOGIC ---
  const currentStock = product ? parseInt(
    String(activeVariant?.stock_quantity ?? product.stock_quantity ?? product.stock ?? 0),
    10
  ) : 0;

  const isOutOfStock = currentStock <= 0;
  const isUnavailable = product ? isOutOfStock : true;

  const handleAddToCart = () => {
    if (isUnavailable) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id + (activeVariant ? `-${activeVariant.size}` : ""),
        name: product.name,
        price: basePrice,
        image: activeVariant?.image || product.image,
        size: displaySize,
      });
    }
    router.push("/cart");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name || initialName || "Loading..."}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: displayImage }}
            style={[styles.mainImage, isUnavailable && product && { opacity: 0.55 }]}
            contentFit="contain"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>

        <View style={styles.detailsContainer}>
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#800000" />
            </View>
          ) : !product ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={styles.emptyText}>Product not found.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.productTitle}>
                {product.name} <Text style={styles.titleSize}>({displaySize})</Text>
              </Text>

              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>
                  NPR {basePrice} <Text style={styles.perUnitText}>/ unit</Text>
                </Text>
                {showDiscount && (
                  <View style={styles.discountRow}>
                    <Text style={[styles.cutPriceText, { color: "#E2B254" }]}>NPR {cutPrice}</Text>
                    <Text style={[styles.discountPercentText, { color: "#E2B254" }]}>-{discountPercent}%</Text>
                  </View>
                )}
              </View>

              {/* Variants / Pack Size */}
              {product.variants && product.variants.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.smallLabel}>PACK SIZE</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.variantRow}
                  >
                    {product.variants.map((variant: any, index: number) => {
                      const isActive = index === activeVariantIndex;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.variantBtn,
                            isActive && styles.variantBtnActive,
                          ]}
                          onPress={() => setActiveVariantIndex(index)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.variantText,
                              isActive && styles.variantTextActive,
                            ]}
                          >
                            {variant.size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={styles.divider} />

              {/* --- MULTI-PRODUCT SUBSCRIPTION REDIRECT BANNER --- */}
              <TouchableOpacity
                style={styles.subscribeBanner}
                activeOpacity={0.9}
                onPress={() => router.push("/plan/curate" as any)}
              >
                <View style={styles.subscribeBannerIcon}>
                  <Feather name="calendar" size={20} color="#E2B254" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subscribeBannerTitle}>
                    BUILD RECURRING SUBSCRIPTION
                  </Text>
                  <Text style={styles.subscribeBannerSub}>
                    Subscribe to Daily or Weekly plans and combine multiple products across days.
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.infoSection}>
                <Text style={styles.sectionHeader}>PRODUCT DESCRIPTION</Text>
                <Text style={styles.bodyText}>
                  {product.description ||
                    "Premium authentic dairy. Firm yet tender, this high-protein staple is a versatile addition to any meal."}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom One-Time Buy Bar */}
      {product && !loading && (
        <View style={styles.bottomActionBar}>
        <View style={styles.quantityContainer}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View
            style={[
              styles.quantitySelector,
              isUnavailable && { opacity: 0.45 },
            ]}
          >
            <TouchableOpacity
              disabled={isUnavailable}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyBtn}
            >
              <Feather name="minus" size={16} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              disabled={isUnavailable || quantity >= currentStock}
              onPress={() => setQuantity(quantity + 1)}
              style={styles.qtyBtn}
            >
              <Feather name="plus" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addCartBtn,
            isUnavailable && { backgroundColor: "#CCCCCC" },
          ]}
          activeOpacity={0.9}
          disabled={isUnavailable}
          onPress={handleAddToCart}
        >
          <Feather
            name="shopping-cart"
            size={18}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addCartText}>
            {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
          </Text>
        </TouchableOpacity>
      </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  scrollContent: { paddingBottom: 110 },
  imageWrapper: {
    width: "100%",
    height: 280,
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.l,
  },
  mainImage: { width: "100%", height: "100%" },
  detailsContainer: { padding: SPACING.l },
  productTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#002147",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  titleSize: { fontSize: 18, color: "#002147", fontWeight: "700" },
  priceContainer: {
    marginBottom: SPACING.m,
  },
  priceText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#9e111a",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  cutPriceText: {
    fontSize: 16,
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  perUnitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
  curdNoticeBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.l,
  },
  curdNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  section: { marginBottom: SPACING.l },
  smallLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  variantRow: { flexDirection: "row", gap: 10 },
  variantBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.medium,
    backgroundColor: "#FFF",
  },
  variantBtnActive: { backgroundColor: "#002147", borderColor: "#002147" },
  variantText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  variantTextActive: { color: "#FFF" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: SPACING.m },
  subscribeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#002147",
    padding: 16,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.l,
    gap: 12,
  },
  subscribeBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeBannerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  subscribeBannerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    lineHeight: 15,
  },
  infoSection: { marginBottom: SPACING.l },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#001F3F",
    letterSpacing: 1,
    marginBottom: SPACING.s,
  },
  bodyText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 22,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    padding: SPACING.m,
    flexDirection: "row",
    gap: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  quantityContainer: { flex: 0.35 },
  qtyLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    paddingHorizontal: 4,
  },
  qtyBtn: { padding: 10 },
  qtyText: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  addCartBtn: {
    flex: 0.65,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9e111a",
    borderRadius: RADIUS.medium,
    paddingVertical: 14,
  },
  addCartText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});