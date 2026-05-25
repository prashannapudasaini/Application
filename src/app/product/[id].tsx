import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { BASE_URL, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

// 🔥 NEW: Added an 'offer' property to the Daily plan
const PLANS = [
  {
    id: "One Time",
    icon: "shopping-outline",
    label: "One Time Buy",
    sub: "1 Delivery",
  },
  {
    id: "Daily",
    icon: "calendar-today",
    label: "Daily",
    sub: "30 Deliveries/Mo",
    offer: "🎁 2L FREE",
  },
  {
    id: "Alternate",
    icon: "calendar-multiselect",
    label: "Alternate Days",
    sub: "15 Deliveries/Mo",
  },
  {
    id: "Weekly",
    icon: "calendar-week",
    label: "Weekly",
    sub: "4 Deliveries/Mo",
  },
];

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("One Time");
  const [deliveryTime, setDeliveryTime] = useState("Morning (7:00 AM)");

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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!product)
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
      </View>
    );

  const activeVariant =
    product.variants && product.variants.length > 0
      ? product.variants[activeVariantIndex]
      : null;

  const displayImage = activeVariant?.image
    ? getImageUrl(activeVariant.image)
    : getImageUrl(product.image);
  const basePrice = parseFloat(activeVariant?.price_npr || product.price || 0);
  const displaySize = activeVariant?.size || product.size || "Standard";

  const getPlanMultiplier = () => {
    if (selectedPlan === "Daily") return 30;
    if (selectedPlan === "Alternate") return 15;
    if (selectedPlan === "Weekly") return 4;
    return 1;
  };

  const planMultiplier = getPlanMultiplier();
  const finalItemPrice = basePrice * planMultiplier;
  const grandTotal = finalItemPrice * quantity;

  const getStartDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const startDate = new Date();

    if (currentHour < 20) {
      startDate.setDate(now.getDate() + 1);
    } else {
      startDate.setDate(now.getDate() + 2);
    }

    return startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const handleAddToCart = () => {
    const formattedPlanString =
      selectedPlan === "One Time"
        ? `One Time • ${deliveryTime} • ${getStartDate()}`
        : `${selectedPlan} • ${deliveryTime} • Starts ${getStartDate()}`;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id + (activeVariant ? `-${activeVariant.size}` : ""),
        name: product.name,
        price: finalItemPrice,
        image: activeVariant?.image || product.image,
        size: displaySize,
        plan: formattedPlanString,
      });
    }
    router.push("/cart");
  };

  const featurePoints = product.features
    ? product.features
        .split(/(?:\r\n|\r|\n|(?<=[a-z])\.\s+)/)
        .filter((f: string) => f.trim().length > 0)
    : [
        "Texture & Taste: Soft and delicious, maintaining the natural flavor.",
        "Pure Quality: Contains no added preservatives for a more natural product.",
        "Storage: Must be stored at refrigeration temperature (4°C or below).",
      ];

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

          <Text style={styles.priceText}>
            NPR {basePrice} <Text style={styles.perUnitText}>/ unit</Text>
          </Text>

          <View style={styles.planSection}>
            <Text style={styles.smallLabel}>CHOOSE PLAN</Text>
            <View style={styles.planGrid}>
              {PLANS.map((plan) => {
                const isActive = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isActive && styles.planCardActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    {/* 🔥 NEW: Dynamic Offer Badge */}
                    {plan.offer && (
                      <View style={styles.offerBadge}>
                        <Text style={styles.offerBadgeText}>{plan.offer}</Text>
                      </View>
                    )}

                    <MaterialCommunityIcons
                      name={plan.icon as any}
                      size={20}
                      color={isActive ? "#FFF" : COLORS.textSecondary}
                      style={{ marginBottom: 4 }}
                    />
                    <Text
                      style={[
                        styles.planCardText,
                        isActive && styles.planCardTextActive,
                      ]}
                    >
                      {plan.label}
                    </Text>
                    <Text
                      style={[
                        styles.planSubText,
                        isActive && styles.planSubTextActive,
                      ]}
                    >
                      {plan.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.timingSection}>
            <Text style={styles.smallLabel}>DELIVERY TIMING</Text>

            <View style={styles.timingInfoBox}>
              <Feather
                name="info"
                size={14}
                color={COLORS.primary}
                style={{ marginTop: 2, marginRight: 6 }}
              />
              <Text style={styles.timingInfoText}>
                Order before 8:00 PM for tomorrow's delivery. Your cycle begins:{" "}
                <Text style={{ fontWeight: "800" }}>{getStartDate()}</Text>
              </Text>
            </View>

            <View style={styles.timingGrid}>
              <TouchableOpacity
                style={[
                  styles.timeCard,
                  deliveryTime === "Morning (7:00 AM)" && styles.timeCardActive,
                ]}
                onPress={() => setDeliveryTime("Morning (7:00 AM)")}
                activeOpacity={0.8}
              >
                <Feather
                  name="sunrise"
                  size={18}
                  color={
                    deliveryTime === "Morning (7:00 AM)"
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.timeCardText,
                    deliveryTime === "Morning (7:00 AM)" &&
                      styles.timeCardTextActive,
                  ]}
                >
                  Morning (7:00 AM)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timeCard,
                  deliveryTime === "Evening (5:00 PM)" && styles.timeCardActive,
                ]}
                onPress={() => setDeliveryTime("Evening (5:00 PM)")}
                activeOpacity={0.8}
              >
                <Feather
                  name="sunset"
                  size={18}
                  color={
                    deliveryTime === "Evening (5:00 PM)"
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.timeCardText,
                    deliveryTime === "Evening (5:00 PM)" &&
                      styles.timeCardTextActive,
                  ]}
                >
                  Evening (5:00 PM)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>PRODUCT HIGHLIGHTS</Text>
          <View style={styles.bulletList}>
            {featurePoints.map((point: string, idx: number) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>
                  {point.trim().replace(/\.$/, "")}.
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActionBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={styles.qtyBtn}
          >
            <Feather name="minus" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            style={styles.qtyBtn}
          >
            <Feather name="plus" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addCartBtn,
            {
              backgroundColor:
                selectedPlan === "One Time" ? "#001F3F" : COLORS.primary,
            },
          ]}
          activeOpacity={0.9}
          onPress={handleAddToCart}
        >
          <Text style={styles.addCartText}>
            {selectedPlan === "One Time"
              ? "ADD TO CART"
              : `SUBSCRIBE ${selectedPlan.toUpperCase()}`}
          </Text>
          <Text style={styles.addCartPrice}>NPR {grandTotal}</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: { paddingBottom: 100 },

  imageWrapper: {
    width: "100%",
    height: 280,
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.l,
  },
  mainImage: { width: "100%", height: "100%" },

  detailsContainer: { padding: SPACING.l, paddingBottom: SPACING.m },
  productTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: SPACING.s,
  },
  titleSize: { fontSize: 18, color: COLORS.primary, fontWeight: "700" },
  priceText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    marginVertical: SPACING.s,
  },
  perUnitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },

  section: { marginBottom: SPACING.m },
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
  variantBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  variantText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  variantTextActive: { color: "#FFF" },

  /* Plan Grid */
  planSection: { marginTop: SPACING.m },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  planCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    padding: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }, // overflow added for corner badge
  planCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planCardText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  planCardTextActive: { color: "#FFF" },
  planSubText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  planSubTextActive: { color: "rgba(255,255,255,0.8)" },

  // 🔥 NEW: Styles for the Offer Badge
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#27AE60",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  offerBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  /* Timing Section */
  timingSection: { marginTop: SPACING.l },
  timingInfoBox: {
    flexDirection: "row",
    backgroundColor: "#FFF0F0",
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(161,18,23,0.1)",
  },
  timingInfoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 18,
  },
  timingGrid: { flexDirection: "row", gap: 10 },
  timeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    backgroundColor: "#FAFAFA",
  },
  timeCardActive: { borderColor: COLORS.primary, backgroundColor: "#FFFDFD" },
  timeCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  timeCardTextActive: { color: COLORS.primary },

  divider: { height: 6, backgroundColor: "#F4F4F4", marginVertical: SPACING.m },

  infoSection: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.l },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#001F3F",
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
    marginTop: SPACING.s,
  },

  bulletList: { marginTop: 4 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingRight: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    fontWeight: "500",
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
  quantitySelector: {
    flex: 0.35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
  },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  addCartBtn: {
    flex: 0.65,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADIUS.medium,
    paddingVertical: 10,
  },
  addCartText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  addCartPrice: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});
