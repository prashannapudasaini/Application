import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
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
  const { items, cartTotal, placeOrder, walletBalance } = useCart(); // 🔥 Imported walletBalance

  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // 🔥 Handles insufficient funds

  if (items.length === 0 && !showSuccessModal) {
    if (Platform.OS !== "web") router.replace("/cart");
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
      </View>
    );
  }

  const deliveryFee = cartTotal > 500 ? 0 : 50;
  const grandTotal = cartTotal + deliveryFee;

  const PAYMENT_METHODS = [
    {
      id: "cod",
      title: "Cash on Delivery",
      icon: "cash",
      desc: "Pay when your order arrives",
    },
    {
      id: "wallet",
      title: `Sitaram Wallet (Bal: NPR ${walletBalance.toLocaleString()})`,
      icon: "wallet-outline",
      desc: "Fast & Secure checkout",
    },
    {
      id: "card",
      title: "Credit / Debit Card",
      icon: "credit-card-outline",
      desc: "Visa, MasterCard",
    },
  ];

  const handlePlaceOrder = () => {
    // 🔥 Check if they chose wallet but don't have enough money
    if (selectedPayment === "wallet" && walletBalance < grandTotal) {
      setShowErrorModal(true);
      return;
    }

    placeOrder(grandTotal, selectedPayment);
    setShowSuccessModal(true);
  };

  const handleFinishCheckout = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)/orders");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>NPR {cartTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text
                style={[
                  styles.billValue,
                  deliveryFee === 0 && { color: "#27AE60" },
                ]}
              >
                {deliveryFee === 0 ? "FREE" : `NPR ${deliveryFee}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>NPR {grandTotal}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => {
            const isActive = selectedPayment === method.id;
            // Highlight red if they don't have enough balance for the wallet option
            const isWalletError =
              method.id === "wallet" && isActive && walletBalance < grandTotal;

            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  isActive && styles.paymentCardActive,
                  isWalletError && { borderColor: "red" },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    isActive && { backgroundColor: COLORS.primary + "15" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text
                    style={[
                      styles.paymentTitle,
                      isActive && { color: COLORS.primary },
                    ]}
                  >
                    {method.title}
                  </Text>
                  <Text
                    style={[
                      styles.paymentDesc,
                      isWalletError && { color: "red" },
                    ]}
                  >
                    {isWalletError ? "Insufficient Balance" : method.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    isActive && styles.radioOuterActive,
                    isWalletError && { borderColor: "red" },
                  ]}
                >
                  {isActive && (
                    <View
                      style={[
                        styles.radioInner,
                        isWalletError && { backgroundColor: "red" },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalBox}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>NPR {grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          activeOpacity={0.8}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>PLACE ORDER</Text>
          <Feather name="check-circle" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#27AE60" }]}
            >
              <Feather name="check" size={40} color="#FFF" />
            </View>
            <Text style={styles.modalTitle}>Order Confirmed!</Text>
            <Text style={styles.modalMessage}>
              Your order has been placed successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              activeOpacity={0.8}
              onPress={handleFinishCheckout}
            >
              <Text style={styles.modalBtnText}>View My Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔥 Error Modal (Insufficient Funds) */}
      <Modal visible={showErrorModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#FFF0F0" }]}
            >
              <Feather name="alert-circle" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Insufficient Balance</Text>
            <Text style={styles.modalMessage}>
              You do not have enough funds in your Sitaram Wallet to complete
              this purchase.
            </Text>

            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { flex: 1, backgroundColor: "#F5F5F5" },
                ]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1 }]}
                onPress={() => {
                  setShowErrorModal(false);
                  router.push("/(tabs)/wallet"); // Route directly to wallet top up
                }}
              >
                <Text style={styles.modalBtnText}>Top Up Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: "center", alignItems: "center" },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
  },
  section: { marginBottom: SPACING.l },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#001F3F",
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.s,
  },
  billLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  billValue: { fontSize: 14, color: COLORS.text, fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.s,
  },
  grandTotalLabel: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  grandTotalValue: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  paymentCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFDFD",
  },
  paymentInfo: { flex: 1 },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  paymentDesc: { fontSize: 12, color: COLORS.textSecondary },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  bottomTotalBox: { flex: 1 },
  bottomTotalLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  bottomTotalValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    gap: 8,
  },
  placeOrderText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: "center",
    elevation: 10,
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalBtn: {
    backgroundColor: "#001F3F",
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});