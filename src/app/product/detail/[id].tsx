import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL, getImageUrl } from "../../../constants/api";
import { COLORS, SPACING } from "../../../constants/theme";
import { useCart } from "../../../context/CartContext";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/get_one.php?id=${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setProduct(json.data);
        }
      })
      .catch((err) => console.error("Detail Fetch Error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  const activeVariant =
    product.variants && product.variants.length > 0
      ? product.variants[activeVariantIndex]
      : null;

  const displayImage = activeVariant?.image
    ? getImageUrl(activeVariant.image)
    : getImageUrl(product.image);
  const displayPrice = activeVariant?.price_npr || product.price || 0;
  const displaySize = activeVariant?.size || product.size || "Standard";

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id + (activeVariant ? `-${activeVariant.size}` : ""),
        name: product.name,
        price: parseFloat(displayPrice),
        image: activeVariant?.image || product.image,
        size: displaySize,
      });
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
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
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.productTitle}>
            {product.name} <Text style={styles.titleSize}>({displaySize})</Text>
          </Text>

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

          <View style={styles.shelfLifeBox}>
            <Feather
              name="info"
              size={14}
              color={COLORS.textSecondary}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.shelfLifeText}>
              Shelf Life: Fresh products. Keep refrigerated. If price range
              extends ₹3000, you can place an order without a subscription.
            </Text>
          </View>

          <Text style={styles.priceText}>NPR {displayPrice}</Text>

          <TouchableOpacity style={styles.subscribeBtn} activeOpacity={0.8}>
            <Feather
              name="calendar"
              size={16}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.subscribeText}>SUBSCRIBE NOW</Text>
          </TouchableOpacity>

          <View style={styles.cartActionRow}>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.qtyBtn}
              >
                <Feather name="minus" size={16} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={styles.qtyBtn}
              >
                <Feather name="plus" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addCartBtn}
              activeOpacity={0.8}
              onPress={handleAddToCart}
            >
              <Feather
                name="shopping-cart"
                size={16}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addCartText}>ADD TO CART</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>PRODUCT DESCRIPTION</Text>
          <Text style={styles.bodyText}>
            {product.description ||
              "Premium authentic dairy. Firm yet tender, this high-protein staple is a versatile addition to any meal."}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>NUTRITIONAL INFORMATION</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeaderCell}>Nutrient</Text>
              <Text style={styles.tableHeaderCellRight}>Value</Text>
            </View>
            {[
              { label: "Energy (kCal)", value: "308.0" },
              { label: "Protein (g)", value: "22.0" },
              { label: "Carbohydrates (g)", value: "10.0" },
              { label: "Total Fat (g)", value: "20.0" },
            ].map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{row.label}</Text>
                <Text style={styles.tableCellRight}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>PRODUCT FEATURES</Text>
          <View style={styles.bulletList}>
            {product.features ? (
              <Text style={styles.bodyText}>{product.features}</Text>
            ) : (
              <View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Texture & Taste: Soft and delicious, maintaining the natural
                    flavor.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Pure Quality: Contains no added preservatives for a more
                    natural product.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>
                    Storage: Must be stored at refrigeration temperature (4°C or
                    below).
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  scrollContent: { paddingBottom: 60 },

  imageWrapper: {
    width: "100%",
    height: 320,
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
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: SPACING.m,
  },
  titleSize: { fontSize: 18, color: COLORS.primary, fontWeight: "700" },

  section: { marginBottom: SPACING.m },
  smallLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  variantRow: { flexDirection: "row", gap: 10 },
  variantBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  variantBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  variantText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  variantTextActive: { color: "#FFF" },

  shelfLifeBox: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.s,
    marginBottom: SPACING.l,
  },
  shelfLifeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  priceText: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SPACING.l,
  },

  subscribeBtn: {
    backgroundColor: "#001F3F",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.m,
    borderRadius: 6,
    marginBottom: SPACING.m,
  },
  subscribeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },

  cartActionRow: { flexDirection: "row", gap: SPACING.m },
  quantitySelector: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  qtyBtn: { padding: SPACING.m },
  qtyText: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  addCartBtn: {
    flex: 0.6,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  addCartText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },

  divider: { height: 8, backgroundColor: "#F0F0F0", marginVertical: SPACING.m },

  infoSection: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.l },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#001F3F",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: SPACING.m,
    marginTop: SPACING.s,
  },
  bodyText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 22,
    textAlign: "center",
  },

  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: SPACING.s,
  },
  tableHeaderRow: { flexDirection: "row", backgroundColor: COLORS.primary },
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  tableHeaderCellRight: {
    flex: 1,
    padding: 10,
    color: "#FFF",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#FAFAFA",
  },
  tableCell: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "600",
  },
  tableCellRight: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    color: COLORS.text,
    textAlign: "right",
  },

  bulletList: { marginTop: SPACING.s },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 20 },
});