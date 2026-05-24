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
import { BASE_URL, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches the specific product details from your PHP backend
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

  const fullImageUrl = getImageUrl(product.base_image || product.image);

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Hero Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: fullImageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Product Details Card */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price || 0}</Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description || "Freshly sourced from our local farms."}
          </Text>

          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.description}>
            {product.features || "100% Organic and Natural."}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Add to Cart Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          activeOpacity={0.8}
          onPress={() => {
            addToCart({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              image: product.base_image || product.image,
              size: "Standard",
            });
            // Optional: Provide visual feedback or just go back
            router.back();
          }}
        >
          <Text style={styles.btnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  backBtn: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: RADIUS.round,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  scrollContent: { paddingBottom: 100 },
  imageWrapper: {
    height: 350,
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "80%", height: "80%" },
  infoContainer: {
    padding: SPACING.m,
    backgroundColor: COLORS.card,
    marginTop: -20,
    borderRadius: RADIUS.large,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  name: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    marginVertical: SPACING.s,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: SPACING.m,
    marginBottom: 4,
  },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  footer: {
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  addToCartBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
