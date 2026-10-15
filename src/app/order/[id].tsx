import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const CANCELLATION_WINDOW_MS = 5 * 60 * 1000;

interface OrderDetailData {
  id: string | number;
  created_at: string;
  total_amount: string | number;
  delivery_fee?: string | number | null;
  delivery_date?: string;
  delivery_slot?: string;
  order_status: string;
  payment_method: string;
  delivery_address: string;
  phone_number: string;
  items: {
    name: string;
    quantity: number;
    price: string | number;
    image?: string;
  }[];
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 🔥 DIRECT NAVIGATION: Safely routes back to the orders list tab
  const handleGoBack = () => {
    router.replace("/(tabs)/orders");
  };

  useEffect(() => {
    if (!id || !user?.id) return;

    api
      .get(`api/orders/get_one.php?order_id=${id}&user_id=${user.id}`)
      .then((res) => {
        if (res.data.status === "success") {
          setOrder(res.data.data);
        }
      })
      .catch((err) => console.error("Error fetching order details:", err))
      .finally(() => setIsLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (
      !order ||
      order.order_status?.toLowerCase() !== "processing" ||
      !order.created_at
    )
      return;

    const orderTimestamp = new Date(
      order.created_at.replace(" ", "T"),
    ).getTime();

    const calculateTimeLeft = () => {
      const timePassed = Date.now() - orderTimestamp;
      const remaining = CANCELLATION_WINDOW_MS - timePassed;
      return remaining > 0 ? remaining : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const getStatusColor = (currentStatus: string) => {
    const s = currentStatus?.toLowerCase().trim();
    switch (s) {
      case "delivered":
      case "completed":
        return COLORS.success;
      case "processing":
      case "pending":
        return "#F5A623";
      case "cancelled":
      case "canceled":
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString.replace(" ", "T"));
    const datePart = dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = dateObj.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart}, ${timePart}`;
  };

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString.replace(" ", "T"));
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const promptCancelOrder = () => setShowConfirmModal(true);

  const executeCancellation = async () => {
    if (!order?.id || !user?.id) return;
    setIsCancelling(true);
    try {
      const res = await api.post("/api/orders/cancel.php", {
        order_id: Number(order.id),
        user_id: Number(user.id),
        reason: "Cancelled by customer within grace period",
      });

      if (res.data?.status === "success") {
        setShowConfirmModal(false);
        setOrder((prev) => (prev ? { ...prev, order_status: "cancelled" } : prev));
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 300);
      } else {
        setShowConfirmModal(false);
        Alert.alert(
          "Cancellation Failed",
          res.data?.message || "Could not cancel this order.",
        );
      }
    } catch (err: any) {
      console.error(
        "Cancel order error:",
        JSON.stringify(err.response?.data || err.message || err)
      );
      setShowConfirmModal(false);
      Alert.alert(
        "Cancellation Failed",
        err.response?.data?.message || "Network error. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const finishCancellation = () => {
    setShowSuccessModal(false);
    router.replace({
      pathname: "/(tabs)/orders",
      params: { cancelledId: order?.id },
    });
  };

  const safeStatus = order?.order_status?.toLowerCase() || "";
  const canCancel =
    (safeStatus === "processing" || safeStatus === "pending") && timeLeft > 0;
  const timeExpired =
    (safeStatus === "processing" || safeStatus === "pending") && timeLeft === 0;

  // Calculate Subtotal and Delivery Fee dynamically
  const subtotal = order?.items ? order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0) : 0;
  const deliveryFee = order?.delivery_fee !== undefined && order?.delivery_fee !== null 
    ? Number(order.delivery_fee) 
    : Math.max(0, Number(order?.total_amount || 0) - subtotal);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: COLORS.textSecondary }}>
            Order not found or access denied.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Modern Top Info Banner */}
        <View style={styles.topBanner}>
          <Text style={styles.bannerOrderId}>Order #{order.id}</Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(safeStatus) + "18" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(safeStatus) },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                { color: getStatusColor(safeStatus) },
              ]}
            >
              {safeStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Order Information Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Details</Text>
          <View style={styles.infoRow}>
            <Feather
              name="calendar"
              size={16}
              color={COLORS.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Placed On:</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(order.created_at)}
            </Text>
          </View>
          {order.delivery_date && (
            <View style={styles.infoRow}>
              <Feather
                name="truck"
                size={16}
                color={COLORS.textSecondary}
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>Delivery:</Text>
              <Text style={styles.infoValue}>
                {formatDateOnly(order.delivery_date)} • {order.delivery_slot}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Feather
              name="credit-card"
              size={16}
              color={COLORS.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Payment:</Text>
            <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>
              {order.payment_method}
            </Text>
          </View>
        </View>

        {/* Dynamic Items List */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Items Ordered</Text>
          <View style={styles.itemsListContainer}>
            {order.items &&
              order.items.map((item, index) => {
                const imageUrl = item.image ? getImageUrl(item.image) : null;
                return (
                  <View key={index} style={styles.itemRowWrapper}>
                    <View style={styles.productThumbnailContainer}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.productThumbnail}
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather name="package" size={20} color="#999" />
                      )}
                    </View>

                    <View style={styles.productMeta}>
                      <Text style={styles.productNameText}>{item.name}</Text>
                      <Text style={styles.productPriceText}>
                        NPR {item.price}
                      </Text>
                    </View>

                    <View style={styles.quantityBadgeContainer}>
                      <Text style={styles.productQuantityBadge}>
                        x{item.quantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>

        {/* Payment Receipt Style Summary */}
        <View style={styles.receiptBlock}>
          <Text style={styles.sectionHeader}>Summary</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Subtotal</Text>
            <Text style={styles.receiptValue}>NPR {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Delivery Fee</Text>
            <Text style={styles.receiptValue}>
              {deliveryFee > 0 ? `NPR ${deliveryFee.toLocaleString()}` : "FREE"}
            </Text>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>NPR {Number(order.total_amount).toLocaleString()}</Text>
          </View>
        </View>

        {/* Actions */}
        {canCancel && (
          <View style={styles.actionContainer}>
            <Text style={styles.timerWarning}>
              Cancel order within {formatTime(timeLeft)}
            </Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={promptCancelOrder}
            >
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {timeExpired && (
          <View style={styles.expiredBanner}>
            <Feather
              name="info"
              size={14}
              color={COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.expiredText}>
              The 5-minute cancellation window has passed.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#FFF0F0" }]}
            >
              <Feather name="alert-circle" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel Order #{order?.id}? This action
              cannot be undone.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={isCancelling}
              >
                <Text style={styles.modalCancelBtnText}>No, Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, isCancelling && { opacity: 0.6 }]}
                onPress={executeCancellation}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#ECFDF5" }]}
            >
              <Feather name="check-circle" size={36} color="#16A34A" />
            </View>
            <Text style={styles.modalTitle}>Cancellation Successful</Text>
            <Text style={styles.modalMessage}>
              Your order has been cancelled and any refunds have been initiated.
            </Text>

            <TouchableOpacity
              style={styles.modalSuccessBtn}
              activeOpacity={0.8}
              onPress={finishCancellation}
            >
              <Text style={styles.modalSuccessBtnText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 17, fontWeight: "900", color: COLORS.text },
  placeholder: { width: 32 },
  scrollContent: { padding: SPACING.m, paddingBottom: 40 },

  topBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bannerOrderId: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusPillText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },

  sectionBlock: {
    backgroundColor: "#FFF",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: SPACING.m,
    letterSpacing: 0.5,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoIcon: { marginRight: 8 },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: "800" },

  itemsListContainer: { gap: 12 },
  itemRowWrapper: { flexDirection: "row", alignItems: "center" },
  productThumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.small,
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productThumbnail: { width: "100%", height: "100%" },
  productMeta: { flex: 1, marginLeft: 12, justifyContent: "center" },
  productNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  productPriceText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  quantityBadgeContainer: { marginLeft: SPACING.s },
  productQuantityBadge: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  receiptBlock: {
    backgroundColor: "#FFF",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  receiptValue: { fontSize: 14, color: COLORS.text, fontWeight: "700" },
  dashedDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginVertical: SPACING.m,
    borderRadius: 1,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  grandTotalValue: { fontSize: 18, fontWeight: "900", color: COLORS.primary },

  actionContainer: { marginTop: SPACING.s },
  timerWarning: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: 12,
  },
  cancelBtn: {
    backgroundColor: "#FFF0F0",
    padding: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(161, 18, 23, 0.2)",
  },
  cancelBtnText: { color: COLORS.primary, fontWeight: "900", fontSize: 15 },
  expiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expiredText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
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
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  modalCancelBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  modalConfirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  modalSuccessBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSuccessBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
