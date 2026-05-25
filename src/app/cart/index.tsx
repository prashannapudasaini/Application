import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

// Dummy data representing items in the cart
const INITIAL_CART = [
  {
    id: "1",
    name: "Sitaram Toned Milk",
    size: "1 Ltr",
    price: 56,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "2",
    name: "Fresh Paneer",
    size: "200g",
    price: 80,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "3",
    name: "Desi Ghee",
    size: "500ml",
    price: 320,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1605297833075-84ab8e833441?auto=format&fit=crop&w=150&q=80",
  },
];

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(INITIAL_CART);

  // Helper functions to manage state
  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    ); // Remove item if quantity hits 0
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const totalAmount = calculateTotal();
  const totalItems = cartItems.reduce(
    (count, item) => count + item.quantity,
    0,
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.headerSubtitle}>{totalItems} Items</Text>
        </View>
        <View style={styles.placeholder} /> {/* For centering the title */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Cart Items List */}
        <View style={styles.cartList}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemImageContainer}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSize}>{item.size}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>

              {/* Zepto-style Counter */}
              <View style={styles.counterPill}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Feather
                    name="minus"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                <Text style={styles.counterText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Feather name="plus" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 3. Bill Details Section */}
        {totalItems > 0 && (
          <View style={styles.billContainer}>
            <Text style={styles.sectionTitle}>Bill Details</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>MRP Total</Text>
              <Text style={styles.billValue}>₹{totalAmount}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValueFree}>FREE</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{totalAmount}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. Sticky Checkout Bar */}
      {totalItems > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.checkoutButton}
            activeOpacity={0.8}
            onPress={() => router.push("/cart/checkout")} // We will build this next!
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutPrice}>₹{totalAmount}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  backButton: {
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  placeholder: {
    width: 32, // Matches back button width to center title
  },
  scrollContent: {
    paddingBottom: 120, // Clearance for sticky bottom bar
  },
  cartList: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.small,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xs,
    marginRight: SPACING.m,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  itemSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  counterBtn: {
    padding: SPACING.s,
    paddingHorizontal: 12,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  billContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.s,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  billValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "700",
  },
  billValueFree: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: 30, // Safe area for home indicator
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: RADIUS.medium,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
  },
  checkoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  checkoutPrice: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
