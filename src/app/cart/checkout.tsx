import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, cartTotal, walletBalance, placeOrder } = useCart();

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" or "wallet"

  // 🔥 SAFETY FALLBACKS: Prevents "toLocaleString" crashes!
  const safeItems = items || [];
  const safeTotal = cartTotal || 0;
  const safeWallet = walletBalance || 0;
  const deliveryFee = safeTotal > 0 ? 50 : 0;
  const grandTotal = safeTotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (safeItems.length === 0) {
      Alert.alert("Empty Cart", "Add some items before checking out.");
      return;
    }

    if (paymentMethod === "wallet" && safeWallet < grandTotal) {
      Alert.alert(
        "Insufficient Funds",
        "Please load your wallet or select Cash on Delivery.",
      );
      return;
    }

    // Call the context function
    const orderId = placeOrder(grandTotal, paymentMethod);

    if (Platform.OS === "web") {
      alert(`Order Placed Successfully! ID: ${orderId}`);
      router.replace("/(tabs)/orders");
    } else {
      Alert.alert(
        "Order Confirmed! 🎉",
        `Your order #${orderId} has been placed.`,
        [
          {
            text: "Track Order",
            onPress: () => router.replace("/(tabs)/orders"),
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 📍 DELIVERY ADDRESS */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <View style={styles.iconCircle}>
              <Feather name="map-pin" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressType}>Home</Text>
              <Text style={styles.addressText}>
                Lazimpat, Kathmandu, Bagmati Province
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🛒 ORDER SUMMARY */}
        <Text style={styles.sectionTitle}>
          Order Summary ({safeItems.length} Items)
        </Text>
        <View style={styles.card}>
          {safeItems.map((item, index) => (
            <View
              key={item.cartItemId || index.toString()}
              style={styles.summaryItem}
            >
              <Image source={{ uri: item.image }} style={styles.summaryImage} />
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.summaryQty}>
                  Qty: {item.quantity} • {item.size}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>
                NPR {(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* 💳 PAYMENT METHOD */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.card}>
          {/* Wallet Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "wallet" && styles.paymentOptionActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod("wallet")}
          >
            <View style={styles.paymentLeft}>
              <Ionicons
                name="wallet"
                size={24}
                color={paymentMethod === "wallet" ? COLORS.primary : "#666"}
              />
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.paymentName,
                    paymentMethod === "wallet" && { color: COLORS.primary },
                  ]}
                >
                  Sitaram Wallet
                </Text>
                <Text style={styles.paymentSub}>
                  Balance: NPR {safeWallet.toLocaleString()}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === "wallet" && styles.radioCircleActive,
              ]}
            >
              {paymentMethod === "wallet" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Cash Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "cash" && styles.paymentOptionActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod("cash")}
          >
            <View style={styles.paymentLeft}>
              <MaterialCommunityIcons
                name="cash"
                size={24}
                color={paymentMethod === "cash" ? COLORS.primary : "#666"}
              />
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.paymentName,
                    paymentMethod === "cash" && { color: COLORS.primary },
                  ]}
                >
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentSub}>Pay when you receive</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === "cash" && styles.radioCircleActive,
              ]}
            >
              {paymentMethod === "cash" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* 🧾 BILL DETAILS */}
        <Text style={styles.sectionTitle}>Bill Details</Text>
        <View style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>
              NPR {safeTotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>NPR {deliveryFee}</Text>
          </View>
          <View style={[styles.divider, { marginVertical: 12 }]} />
          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>
              NPR {grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 🚀 PLACE ORDER BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total to Pay</Text>
          <Text style={styles.totalPrice}>
            NPR {grandTotal.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutText}>Place Order</Text>
          <Feather name="check-circle" size={18} color="#FFF" />
        </TouchableOpacity>
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
    padding: SPACING.m,
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

  content: { padding: SPACING.m },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    marginLeft: 4,
    marginTop: SPACING.m,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: SPACING.s,
  },

  addressRow: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressDetails: { flex: 1 },
  addressType: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  addressText: { fontSize: 13, color: "#666", lineHeight: 18 },
  changeText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },

  summaryItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  summaryImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.small,
    backgroundColor: "#F8F8F8",
    marginRight: 12,
  },
  summaryDetails: { flex: 1 },
  summaryName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  summaryQty: { fontSize: 12, color: "#666", fontWeight: "600" },
  summaryPrice: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  paymentOptionActive: {},
  paymentLeft: { flexDirection: "row", alignItems: "center" },
  paymentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  paymentSub: { fontSize: 12, color: "#666", fontWeight: "500" },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 12 },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  billLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
  billValue: { fontSize: 14, color: "#1A1A1A", fontWeight: "700" },
  grandTotalLabel: { fontSize: 16, color: "#1A1A1A", fontWeight: "900" },
  grandTotalValue: { fontSize: 18, color: COLORS.primary, fontWeight: "900" },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: SPACING.m,
    paddingBottom: Platform.OS === "ios" ? 0 : SPACING.m,
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: COLORS.primary,
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
});
