import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, cartTotal } = useCart();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productSize}>{item.size}</Text>
        <Text style={styles.productPrice}>NPR {item.price}</Text>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity
          onPress={() => removeItem(item.id, item.size)}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={18} color="#FF3B30" />
        </TouchableOpacity>

        <View style={styles.quantityController}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, item.size, -1)}
          >
            <Feather name="minus" size={16} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, item.size, 1)}
          >
            <Feather name="plus" size={16} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="shopping-cart" size={40} color="#800000" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't added any dairy products to your cart yet.
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              activeOpacity={0.8}
              onPress={handleGoBack}
            >
              <Text style={styles.shopNowText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => `${item.id}-${item.size}`}
              renderItem={renderCartItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            {/* Bottom Checkout Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalPrice}>
                  NPR {cartTotal.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutBtn}
                activeOpacity={0.9}
                onPress={() => router.push("/cart/checkout")}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
                <Feather name="chevron-right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },

  // Header
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
  listContent: { padding: SPACING.m, paddingBottom: 100 },

  // Cart Item Card
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageContainer: {
    width: 70,
    height: 70,
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
    padding: 5,
  },
  productImage: { width: "100%", height: "100%" },
  itemDetails: { flex: 1, justifyContent: "center" },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  productSize: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  productPrice: { fontSize: 15, fontWeight: "900", color: "#800000" },

  // Controls
  actionColumn: { justifyContent: "space-between", alignItems: "flex-end" },
  deleteBtn: { padding: 4 },
  quantityController: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  qtyBtn: { padding: 8 },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
    minWidth: 20,
    textAlign: "center",
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: SPACING.m,
    paddingBottom: Platform.OS === "ios" ? 0 : SPACING.m,
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  totalContainer: { flex: 1 },
  totalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 2,
  },
  totalPrice: { fontSize: 20, fontWeight: "900", color: "#1A1A1A" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#800000", // Corporate Sitaram Red
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    gap: 8,
  },
  checkoutText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  shopNowBtn: {
    backgroundColor: "#800000",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
  },
  shopNowText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});
