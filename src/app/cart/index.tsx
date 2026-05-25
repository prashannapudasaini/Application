import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();

  // 🔥 NEW: States for the custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deliveryFee = items.length > 0 ? (cartTotal > 500 ? 0 : 50) : 0;
  const grandTotal = cartTotal + deliveryFee;

  // Triggers the modal instead of native alerts
  const handleClearItem = (cartItemId: string, itemName: string) => {
    setItemToRemove({ id: cartItemId, name: itemName });
    setShowConfirmModal(true);
  };

  // Executes the removal when user clicks "Yes"
  const confirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id);
    }
    setShowConfirmModal(false);
    setItemToRemove(null);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="shopping-bag" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added any fresh dairy products to your cart
            yet.
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.shopNowText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <View key={item.cartItemId} style={styles.cartItem}>
              <View style={styles.itemImageWrapper}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemSize}>{item.size}</Text>
                {item.plan !== "One Time" && (
                  <View style={styles.planBadge}>
                    <MaterialCommunityIcons
                      name="calendar-refresh"
                      size={12}
                      color={COLORS.primary}
                    />
                    <Text style={styles.planBadgeText}>
                      {item.plan} Delivery
                    </Text>
                  </View>
                )}
                <Text style={styles.itemPrice}>
                  NPR {item.price * item.quantity}
                </Text>
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity
                  onPress={() => handleClearItem(item.cartItemId, item.name)}
                  style={styles.trashBtn}
                >
                  <Feather
                    name="trash-2"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Feather name="minus" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Feather name="plus" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.billContainer}>
          <Text style={styles.billHeader}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>NPR {cartTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text
              style={[
                styles.billValue,
                deliveryFee === 0 && { color: COLORS.success || "#27AE60" },
              ]}
            >
              {deliveryFee === 0 ? "FREE" : `NPR ${deliveryFee}`}
            </Text>
          </View>
          {deliveryFee > 0 && (
            <Text style={styles.freeDeliveryHint}>
              Add NPR {500 - cartTotal} more for FREE delivery!
            </Text>
          )}
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>NPR {grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalBox}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>NPR {grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/cart/checkout")}
        >
          <Text style={styles.checkoutText}>PROCEED</Text>
          <Feather name="chevron-right" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 🔥 NEW: Custom Confirmation Modal for Deleting Items */}
      <Modal visible={showConfirmModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#FFF0F0" }]}
            >
              <Feather name="trash-2" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Remove Item?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove{" "}
              <Text style={{ fontWeight: "800" }}>{itemToRemove?.name}</Text>{" "}
              from your cart?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmRemove}
              >
                <Text style={styles.modalConfirmBtnText}>Remove</Text>
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
  scrollContent: { paddingBottom: 100 },
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
    marginBottom: SPACING.m,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.l,
  },
  shopNowBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
  },
  shopNowText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  itemsContainer: { padding: SPACING.m, gap: SPACING.m },
  cartItem: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImageWrapper: {
    width: 70,
    height: 70,
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    padding: 8,
    marginRight: SPACING.m,
  },
  itemImage: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, justifyContent: "center" },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 2,
  },
  actionColumn: { justifyContent: "space-between", alignItems: "flex-end" },
  trashBtn: { padding: 4 },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.small,
  },
  qtyBtn: { padding: 8 },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    width: 20,
    textAlign: "center",
  },
  billContainer: {
    backgroundColor: COLORS.card,
    margin: SPACING.m,
    padding: SPACING.l,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billHeader: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.s,
  },
  billLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  billValue: { fontSize: 13, color: COLORS.text, fontWeight: "700" },
  freeDeliveryHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "right",
    marginTop: -4,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  grandTotalLabel: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  grandTotalValue: { fontSize: 16, fontWeight: "900", color: COLORS.text },
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
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    gap: 4,
  },
  checkoutText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // 🔥 Modal Styles
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
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
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
  modalBtnRow: { flexDirection: "row", gap: SPACING.m, width: "100%" },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  modalCancelBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  modalConfirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
});