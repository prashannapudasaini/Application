import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const CANCELLATION_WINDOW_MS = 5 * 60 * 1000;

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { orderHistory, cancelOrder } = useCart();

  const order = orderHistory.find((o) => o.id === id);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // 🔥 NEW: States for the custom modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!order || order.status !== "Processing" || !order.timestamp) return;
    const calculateTimeLeft = () => {
      const timePassed = Date.now() - order.timestamp;
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

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case "Delivered":
        return COLORS.success || "#27AE60";
      case "Processing":
        return "#F5A623";
      case "Cancelled":
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

  // Step 1: Open Confirmation Modal
  const promptCancelOrder = () => setShowConfirmModal(true);

  // Step 2: Actually Cancel it
  const executeCancellation = () => {
    setShowConfirmModal(false);
    cancelOrder(order.id);
    setTimeout(() => {
      setShowSuccessModal(true); // Open Success Modal after a tiny delay for smooth animation
    }, 300);
  };

  // Step 3: Finish and Redirect
  const finishCancellation = () => {
    setShowSuccessModal(false);
    router.replace({
      pathname: "/(tabs)/orders",
      params: { cancelledId: order.id },
    });
  };

  const canCancel = order.status === "Processing" && timeLeft > 0;
  const timeExpired = order.status === "Processing" && timeLeft === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: getStatusColor(order.status) + "15",
              borderColor: getStatusColor(order.status) + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.statusBannerText,
              { color: getStatusColor(order.status) },
            ]}
          >
            Status: {order.status}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{order.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Date</Text>
            <Text style={styles.value}>{order.date}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <View style={styles.itemRow}>
            <Image
              source={{ uri: order.image }}
              style={styles.itemImage}
              resizeMode="contain"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {order.items}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal (With Delivery)</Text>
            <Text style={styles.value}>NPR {order.amount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>NPR {order.amount}</Text>
          </View>
        </View>

        {canCancel && (
          <View>
            <Text style={styles.timerWarning}>
              You can cancel this order for another {formatTime(timeLeft)}
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
              The 5-minute cancellation window for this order has passed.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 🔥 Confirmation Modal */}
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
              Are you sure you want to cancel Order #{order.id}? This action
              cannot be undone.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>No, Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={executeCancellation}
              >
                <Text style={styles.modalConfirmBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔥 Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[styles.modalIconWrapper, { backgroundColor: "#E8F5E9" }]}
            >
              <Feather name="check" size={32} color="#27AE60" />
            </View>
            <Text style={styles.modalTitle}>Cancellation Successful</Text>
            <Text style={styles.modalMessage}>
              Your order has been cancelled and any refunds have been initiated.
            </Text>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { width: "100%" }]}
              onPress={finishCancellation}
            >
              <Text style={styles.modalConfirmBtnText}>Okay</Text>
            </TouchableOpacity>
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
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  placeholder: { width: 32 },
  scrollContent: { padding: SPACING.m, paddingBottom: 40 },
  statusBanner: {
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.s,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  value: { fontSize: 13, color: COLORS.text, fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.s,
  },
  grandTotalLabel: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  grandTotalValue: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.small,
    backgroundColor: "#F8F8F8",
    marginRight: SPACING.m,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  timerWarning: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: "#FFF0F0",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(161, 18, 23, 0.15)",
  },
  cancelBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  expiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    padding: SPACING.m,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expiredText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },

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
