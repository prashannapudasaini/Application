import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext"; // <-- NEW IMPORT

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
}
interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();

  // Bring in the global cart powers!
  const { items, addToCart, updateQuantity } = useCart();

  // Check if THIS specific product is already in the cart
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Clean the URL
  const cleanImageUrl = product.image ? product.image.trim() : "";

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => router.push(`/product/detail/${product.id}`)}
    >
      <View style={styles.imageContainer}>
        {!cleanImageUrl ? (
          <View style={styles.fallbackBox}>
            <Feather name="image" size={32} color="#D3D3D3" />
          </View>
        ) : Platform.OS === "web" ? (
          <img
            src={cleanImageUrl}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <Image
            source={{ uri: cleanImageUrl }}
            style={styles.productImage}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.productSize}>{product.size}</Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.priceText}>₹{product.price}</Text>

        {/* Dynamic Cart Buttons */}
        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() =>
              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: product.size,
              })
            }
          >
            <Feather name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.counterPill}>
            <TouchableOpacity
              onPress={() => updateQuantity(product.id, -1)}
              style={styles.counterBtn}
            >
              <Feather name="minus" size={14} color={COLORS.card} />
            </TouchableOpacity>
            <Text style={styles.counterText}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(product.id, 1)}
              style={styles.counterBtn}
            >
              <Feather name="plus" size={14} color={COLORS.card} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.s,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    height: 120,
    width: "100%",
    padding: SPACING.s,
    marginBottom: SPACING.s,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: { width: "100%", height: "100%" },
  fallbackBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#F9F9F9",
    borderRadius: RADIUS.small,
  },
  detailsContainer: { marginBottom: SPACING.s },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  productSize: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  priceText: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    height: 28,
    paddingHorizontal: 4,
  },
  counterBtn: {
    paddingHorizontal: 6,
    height: "100%",
    justifyContent: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginHorizontal: 4,
  },
});
