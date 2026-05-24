import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../../constants/theme";

const { width } = Dimensions.get("window");

const PRODUCT = {
  id: "1",
  name: "Sitaram Toned Milk",
  size: "1 Ltr",
  price: 56,
  originalPrice: 60,
  discount: "7% OFF",
  rating: 4.8,
  reviews: 120,
  image:
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80",
  description:
    "Sitaram Toned Milk is pure, hygienic & packed with nutrition. Perfect for your family to stay active and healthy throughout the day. Sourced from local dairy farms with 100% quality assurance.",
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconCircle}>
          <Feather name="share-2" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: PRODUCT.image }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.productTitle}>{PRODUCT.name}</Text>
          <Text style={styles.productSize}>{PRODUCT.size}</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>₹{PRODUCT.price}</Text>
              <Text style={styles.originalPrice}>₹{PRODUCT.originalPrice}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{PRODUCT.discount}</Text>
              </View>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F5A623" />
            <Text style={styles.ratingText}>
              {PRODUCT.rating}{" "}
              <Text style={styles.reviewCount}>({PRODUCT.reviews})</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Product Details</Text>
          <Text style={styles.descriptionText}>{PRODUCT.description}</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => setQuantity(1)}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeCartContainer}>
            <View style={styles.priceTotalContainer}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalPrice}>₹{PRODUCT.price * quantity}</Text>
            </View>
            <View style={styles.counterPill}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => q - 1)}
              >
                <Feather name="minus" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.counterText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Feather name="plus" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },
  header: {
    position: "absolute",
    top: 40,
    left: SPACING.m,
    right: SPACING.m,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: { paddingBottom: 100 },
  imageContainer: {
    width: width,
    height: width * 0.8,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  productImage: { width: "70%", height: "70%" },
  infoContainer: { padding: SPACING.m },
  productTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },
  productSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: SPACING.m,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.s,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
  },
  currentPrice: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  discountBadge: {
    backgroundColor: "rgba(63, 163, 77, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  discountText: { color: COLORS.success, fontSize: 10, fontWeight: "800" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: SPACING.m,
  },
  ratingText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  reviewCount: { color: COLORS.textSecondary, fontWeight: "500" },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  addToCartText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  activeCartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
  },
  priceTotalContainer: { justifyContent: "center" },
  totalLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  totalPrice: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    height: "100%",
    paddingHorizontal: 10,
  },
  counterBtn: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    marginHorizontal: 8,
  },
});
