import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Extracted from your Orders page screenshot for a matching UI
const THEME = {
  background: "#F8F9FA",
  cardBg: "#FFFFFF",
  textDark: "#1A1A1A",
  textGray: "#757575",
  border: "#F0F0F0",
  primaryRed: "#8A151B", // Matching your "Details >" button
  successBg: "#E8F5E9",
  successText: "#2E7D32",
  warningBg: "#FFF3E0",
  warningText: "#E65100",
  dangerBg: "#FFEBEE",
  dangerText: "#C62828",
};

export default function SupplyManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "alert" as "alert" | "confirm",
    title: "",
    message: "",
    confirmText: "OK",
    isDestructive: false,
    onConfirm: () => {},
  });

  const showModal = (config: Partial<typeof modalConfig>) => {
    setModalConfig({ ...modalConfig, ...config, visible: true });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/user/my-subscription.php?user_id=${user?.id}&_t=${new Date().getTime()}`,
      );
      if (res.data.status === "success") {
        setSubscriptions(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load subscriptions", error);
      showModal({
        type: "alert",
        title: "Error",
        message: "Could not load your supply routines.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = (sub: any) => {
    const isPaused = sub.status?.trim().toLowerCase() === "paused";
    const newStatus = isPaused ? "Active" : "Paused";
    const actionText = isPaused ? "resume" : "pause";

    const proceedWithUpdate = async () => {
      closeModal();
      setIsUpdating(sub.id);
      try {
        const res = await api.post(
          "/user/update_subscription_status.php",
          { user_id: user?.id, id: sub.id, status: newStatus },
          { headers: { "Content-Type": "application/json" } },
        );

        if (res.data && res.data.status === "success") {
          // Update local state instantly to prevent race conditions
          setSubscriptions((prev) =>
            prev.map((s) => (s.id == sub.id ? { ...s, status: newStatus } : s)),
          );

          // Show success custom modal
          setTimeout(() => {
            showModal({
              type: "alert",
              title: "Success",
              message: `Routine is now ${newStatus}.`,
            });
          }, 300); // Slight delay allows the closing animation to finish first
        } else {
          const errorMsg =
            res.data?.message || "The database refused the update.";
          setTimeout(
            () =>
              showModal({
                type: "alert",
                title: "Backend Error",
                message: errorMsg,
              }),
            300,
          );
        }
      } catch (error: any) {
        console.error("Update error:", error);
        setTimeout(
          () =>
            showModal({
              type: "alert",
              title: "Network Error",
              message: "Could not reach the server.",
            }),
          300,
        );
      } finally {
        setIsUpdating(null);
      }
    };

    // Trigger Custom Confirmation Modal instead of native Alert/Window
    showModal({
      type: "confirm",
      title: `${isPaused ? "Resume" : "Pause"} Supply?`,
      message: `Are you sure you want to ${actionText} routine ${sub.sub_id}?`,
      confirmText: isPaused ? "Resume" : "Pause",
      isDestructive: !isPaused,
      onConfirm: proceedWithUpdate,
    });
  };

  const renderSubscription = ({ item }: { item: any }) => {
    const isPaused = item.status?.trim().toLowerCase() === "paused";
    const isCurrentlyUpdating = isUpdating === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.planType}>{item.plan_type} Plan</Text>
            <Text style={styles.subId}>{item.sub_id}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: isPaused ? THEME.dangerBg : THEME.successBg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isPaused ? THEME.dangerText : THEME.successText },
              ]}
            >
              {isPaused ? "PAUSED" : "ACTIVE"}
            </Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.statusBoxHeader}>
            <MaterialCommunityIcons
              name={isPaused ? "snowflake" : "truck-delivery"}
              size={18}
              color={isPaused ? THEME.dangerText : THEME.textDark}
            />
            <Text
              style={[
                styles.statusTitle,
                { color: isPaused ? THEME.dangerText : THEME.textDark },
              ]}
            >
              {isPaused ? "Deliveries Frozen" : "Deliveries Active"}
            </Text>
          </View>
          <Text style={styles.statusDesc}>
            {isPaused
              ? "Your ongoing daily product delivery orders for this plan are currently paused and will not be dispatched."
              : `Your farm-fresh milk shipments deploy on your assigned days during the ${item.delivery_time} route.`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, isCurrentlyUpdating && { opacity: 0.7 }]}
          onPress={() => handleToggleStatus(item)}
          disabled={isCurrentlyUpdating}
        >
          {isCurrentlyUpdating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.actionText}>
                {isPaused ? "Resume Daily Supply" : "Pause My Deliveries"}
              </Text>
              <Feather
                name={isPaused ? "play" : "pause"}
                size={16}
                color="#FFF"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/profile");
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={THEME.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supply Control</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primaryRed} />
          <Text style={styles.loadingText}>Loading routines...</Text>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderSubscription}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-remove"
                size={60}
                color="#CCC"
              />
              <Text style={styles.emptyTitle}>No Active Routines</Text>
              <Text style={styles.emptyDesc}>
                You haven't set up any recurring deliveries yet.
              </Text>
            </View>
          }
        />
      )}

      {/* CUSTOM BEAUTIFUL UI MODAL */}
      <Modal visible={modalConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>

            <View style={styles.modalButtonRow}>
              {modalConfig.type === "confirm" && (
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  modalConfig.type === "confirm" && modalConfig.isDestructive
                    ? { backgroundColor: THEME.dangerText }
                    : {},
                  modalConfig.type === "alert" && {
                    width: "100%",
                    marginLeft: 0,
                  },
                ]}
                onPress={
                  modalConfig.type === "confirm"
                    ? modalConfig.onConfirm
                    : closeModal
                }
              >
                <Text style={styles.modalConfirmText}>
                  {modalConfig.confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.textDark,
    textTransform: "uppercase",
  },
  listContent: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.textGray,
    fontWeight: "700",
  },

  // Card Styling matching "Orders" page
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planType: {
    fontSize: 11,
    fontWeight: "800",
    color: THEME.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subId: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.textDark,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBox: {
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 20,
  },
  statusBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  statusDesc: {
    fontSize: 13,
    color: THEME.textGray,
    lineHeight: 20,
    fontWeight: "500",
  },
  // Button styling matching the "Details >" button from Orders
  actionBtn: {
    backgroundColor: THEME.primaryRed,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: THEME.textGray,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },

  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: THEME.textGray,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: "500",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    marginRight: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: THEME.textDark,
    fontWeight: "800",
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: THEME.textDark, // Defaults to dark gray/black
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
  },
});
