import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// --- CUSTOM COLOR THEME & TOKENS ---
const COLORS = {
  primary: "#002147",
  primaryDark: "#00142B",
  primaryLight: "#0D3360",
  accent: "#E2B254",
  accentLight: "#FEF9EC",
  background: "#F7F8FA",
  white: "#FFFFFF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  pendingBg: "#FEF3C7",
  pendingText: "#B45309",
  deliveredBg: "#DCFCE7",
  deliveredText: "#15803D",
  actionGreen: "#10B981",
  unpaidBg: "#FEE2E2",
  unpaidText: "#B91C1C",
  codBg: "#FFEDD5",
  codText: "#C2410C",
  infoBg: "#EFF6FF",
  infoText: "#1D4ED8",
  cardShadow: "rgba(0, 0, 0, 0.05)",
};

// --- DATA TYPES & INTERFACES ---
interface TaskItem {
  qty: number | string;
  name: string;
  size?: string;
}

interface Task {
  task_id: string;
  customer: string;
  address: string;
  phone: string;
  amount: number | string;
  type?: string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  driver_id?: string | number | null;
  items?: TaskItem[];
}

type NavTab = "Dashboard" | "Deliveries" | "Profile";
type FilterTab = "All" | "Pending" | "Delivered";
type DeliveryType = "Normal" | "Subscription";

// --- MAIN DASHBOARD COMPONENT ---
export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Navigation & Filtering State
  const [activeNav, setActiveNav] = useState<NavTab>("Dashboard");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("Normal");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Data & Loading State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // Time formatting helpers
  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const getTimeOfDay = () => {
    const hour = now.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // 🔥 DYNAMIC FETCH: Pulls only the tasks assigned to the logged-in driver
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`api/delivery/tasks.php?driver_id=${user.id}&_t=${Date.now()}`);
      if (res.data.status === "success") {
        setTasks(res.data.data || []);
      } else {
        console.warn("Failed to load tasks:", res.data.message);
      }
    } catch (error) {
      console.error("Task Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  // 🔥 API Handler: Dynamically Updates Delivery Status
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await api.post("api/delivery/update_status.php", {
        task_id: taskId,
        status: newStatus,
        driver_id: user?.id,
      });

      if (res.data.status === "success") {
        setTasks((prev) =>
          prev.map((t) => (t.task_id === taskId ? { ...t, status: newStatus } : t))
        );
        if (selectedTask && selectedTask.task_id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        Alert.alert("Update Failed", res.data.message || "Failed to update task status.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Unable to reach server to update status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 🔥 API Handler: Dynamically Marks Payment as Paid (COD verification)
  const handleUpdatePayment = async (taskId: string) => {
    setUpdatingPaymentId(taskId);
    try {
      let realId = taskId;
      if (taskId.startsWith('ORD-')) {
        realId = taskId.replace('ORD-', '');
      }

      const res = await api.post("api/delivery/update_payment.php", {
        order_id: realId,
        task_id: taskId,
        payment_status: "paid",
        driver_id: user?.id,
      });

      if (res.data.status === "success") {
        setTasks((prev) =>
          prev.map((t) => (t.task_id === taskId ? { ...t, payment_status: "paid" } : t))
        );
        if (selectedTask && selectedTask.task_id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, payment_status: "paid" } : null));
        }
      } else {
        Alert.alert("Payment Update Failed", res.data.message || "Could not record payment.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Unable to verify payment update with server.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Dynamic Delivery confirmation dialog logic
  const confirmDelivery = (task: Task) => {
    const isCOD = task.payment_method?.toLowerCase() === "cod";
    const isPaid = task.payment_status?.toLowerCase() === "paid" || task.payment_status?.toLowerCase() === "completed";

    if (isCOD && !isPaid) {
      Alert.alert(
        "Cash on Delivery Required",
        `Please collect NPR ${task.amount} from ${task.customer} before finishing delivery.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Collect Cash & Deliver",
            onPress: async () => {
              await handleUpdatePayment(task.task_id);
              await handleUpdateStatus(task.task_id, "Delivered");
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Delivery",
      `Mark Order ${task.task_id} as delivered to ${task.customer}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Mark Delivered",
          onPress: () => handleUpdateStatus(task.task_id, "Delivered"),
        },
      ]
    );
  };

  // Helper validation to ensure orders are assigned to the correct driver and payment is verified
  const isOrderValidForManifest = (t: Task) => {
    // If unassigned or wrong driver, skip
    if (t.driver_id == null || String(t.driver_id) !== String(user?.id)) {
      return false;
    }

    const payMethod = (t.payment_method || "cod").toLowerCase();
    const payStatus = (t.payment_status || "pending").toLowerCase();

    // 🔥 RULE: If it's a COD order, it's valid. If it's online payment, it MUST be paid/completed/success.
    if (payMethod === "cod" || payMethod === "cash on delivery") {
      return true;
    }

    const isOnlinePaid = ["paid", "completed", "success"].includes(payStatus);
    return isOnlinePaid;
  };

  // Calculated Summary Metrics based on Dynamic State
  const metrics = useMemo(() => {
    const typeFilteredTasks = tasks.filter((t) => {
      if (!isOrderValidForManifest(t)) return false;

      const isSub = t.type === "Routine Subscription" || t.task_id?.startsWith("SUB-");
      return deliveryType === "Normal" ? !isSub : isSub;
    });

    const total = typeFilteredTasks.length;
    const deliveredTasks = typeFilteredTasks.filter(
      (t) => t.status?.toLowerCase() === "delivered" || t.status?.toLowerCase() === "completed"
    );
    const delivered = deliveredTasks.length;
    const pending = total - delivered;
    const progress = total === 0 ? 0 : Math.round((delivered / total) * 100);

    let collectedCOD = 0;
    let remainingCOD = 0;
    let earnings = 0;

    typeFilteredTasks.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const isDone = t.status?.toLowerCase() === "delivered" || t.status?.toLowerCase() === "completed";
      const isPaid = t.payment_status?.toLowerCase() === "paid" || t.payment_status?.toLowerCase() === "completed";
      const isCOD = t.payment_method?.toLowerCase() === "cod";

      if (isDone) earnings += amt;

      if (isCOD) {
        if (isPaid || isDone) collectedCOD += amt;
        else remainingCOD += amt;
      } else if (isDone) {
        collectedCOD += amt;
      }
    });

    const depositedCOD = Math.round(collectedCOD * 0.85);

    const locations = Array.from(
      new Set(
        typeFilteredTasks.map((t) => {
          const parts = t.address ? t.address.split(",") : ["Central Dairy Depot"];
          return parts[0].trim();
        })
      )
    ).slice(0, 3);

    const routeString = locations.length > 0 ? locations.join(" → ") : "Route Syncing...";

    return {
      total,
      delivered,
      pending,
      progress,
      collectedCOD,
      remainingCOD,
      depositedCOD,
      earnings: earnings || 0,
      routeString,
    };
  }, [tasks, deliveryType, user?.id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!isOrderValidForManifest(t)) return false;

      const isSub = t.type === "Routine Subscription" || t.task_id?.startsWith("SUB-");
      if (deliveryType === "Normal" && isSub) return false;
      if (deliveryType === "Subscription" && !isSub) return false;

      const isDone = t.status?.toLowerCase() === "delivered" || t.status?.toLowerCase() === "completed";
      if (activeFilter === "Pending") return !isDone;
      if (activeFilter === "Delivered") return isDone;
      return true;
    });
  }, [tasks, activeFilter, deliveryType, user?.id]);

  const handleQuickAction = (type: string) => {
    if (type === "supervisor") {
      Alert.alert("Call Supervisor", "Dialing Central Dispatch & Depot Supervisor...", [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: () => Linking.openURL("tel:9800000000") },
      ]);
    } else if (type === "maps") {
      Linking.openURL("https://maps.google.com/?q=Kathmandu,Nepal");
    } else if (type === "issue") {
      Alert.alert("Report Route Issue", "Select an operational issue to log with Central Support:", [
        { text: "Vehicle Breakdown", onPress: () => { } },
        { text: "Customer Unreachable", onPress: () => { } },
        { text: "Traffic Delay", onPress: () => { } },
        { text: "Cancel", style: "cancel" },
      ]);
    } else if (type === "sos") {
      Alert.alert("🚨 Emergency SOS", "Are you currently facing a security or medical emergency on route?", [
        { text: "Cancel", style: "cancel" },
        { text: "Send Emergency Beacon", style: "destructive", onPress: () => { } },
      ]);
    }
  };

  // --- UI RENDERING COMPONENTS ---

  const renderHeader = () => (
    <View style={styles.headerBox}>
      <SafeAreaView>
        <View style={styles.headerRow}>
          <View style={styles.headerUserWrap}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={26} color={COLORS.white} />
              </View>
              <View style={styles.onlineStatusBadge} />
            </View>
            <View style={styles.greetingTextCol}>
              <Text style={styles.greetingText}>{getTimeOfDay()},</Text>
              <View style={styles.nameRow}>
                <Text style={styles.driverName}>
                  {user?.name ? user.name.split(" ")[0] : "Driver"}
                </Text>
                <Text style={styles.waveEmoji}>👋</Text>
              </View>
              <Text style={styles.driverIdText}>ID: DB{user?.id ? user.id : "----"}</Text>
            </View>
          </View>

          <View style={styles.headerRightCol}>
            <View style={{ backgroundColor: 'black', padding: 4, borderRadius: 4, marginBottom: 4 }}>
              <Text style={{ color: 'white', fontSize: 10 }}>User ID: {user?.id} | Raw API Tasks: {tasks.length} | T0 Driver: {String(tasks[0]?.driver_id)}</Text>
            </View>
            <TouchableOpacity
              style={styles.onlineDropdownBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert("Shift Status", "You are currently online and accepting live route telemetry.")}
            >
              <View style={styles.greenPillDot} />
              <Text style={styles.onlinePillText}>Online</Text>
              <Feather name="chevron-down" size={14} color={COLORS.textDark} />
            </TouchableOpacity>
            <View style={styles.timeWrap}>
              <View style={styles.timeRow}>
                <Feather name="calendar" size={11} color={COLORS.accent} />
                <Text style={styles.headerDateText}>{dateString}</Text>
              </View>
              <View style={styles.timeRow}>
                <Feather name="clock" size={11} color={COLORS.accent} />
                <Text style={styles.headerTimeText}>{timeString}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderMetricsGrid = () => (
    <View style={styles.metricsRow}>
      <View style={styles.metricCard}>
        <View style={[styles.metricIconCircle, { backgroundColor: "rgba(0,33,71,0.08)" }]}>
          <Feather name="clipboard" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.metricCardValue}>{metrics.total}</Text>
        <Text style={styles.metricCardTitle}>Assigned</Text>
        <Text style={styles.metricCardSub}>Total Orders</Text>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconCircle, { backgroundColor: COLORS.pendingBg }]}>
          <Feather name="clock" size={18} color={COLORS.pendingText} />
        </View>
        <Text style={[styles.metricCardValue, { color: COLORS.pendingText }]}>{metrics.pending}</Text>
        <Text style={styles.metricCardTitle}>Pending</Text>
        <Text style={styles.metricCardSub}>To Deliver</Text>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconCircle, { backgroundColor: COLORS.deliveredBg }]}>
          <Feather name="check-circle" size={18} color={COLORS.deliveredText} />
        </View>
        <Text style={[styles.metricCardValue, { color: COLORS.deliveredText }]}>{metrics.delivered}</Text>
        <Text style={styles.metricCardTitle}>Delivered</Text>
        <Text style={styles.metricCardSub}>Completed</Text>
      </View>

      <View style={styles.metricCard}>
        <View style={[styles.metricIconCircle, { backgroundColor: COLORS.accentLight }]}>
          <Feather name="dollar-sign" size={18} color={COLORS.accent} />
        </View>
        <Text style={styles.metricCardValue}>Rs{metrics.earnings}</Text>
        <Text style={styles.metricCardTitle}>Earnings</Text>
        <Text style={styles.metricCardSub}>Today</Text>
      </View>
    </View>
  );

  const renderRouteProgress = () => (
    <View style={styles.routeCard}>
      <View style={styles.routeLeftCol}>
        <Text style={styles.routeCardTitle}>Route Progress</Text>
        <Text style={styles.routePathText} numberOfLines={1}>
          {metrics.routeString}
        </Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${metrics.progress}%` }]} />
          </View>
          <Text style={styles.progressPercentText}>{metrics.progress}%</Text>
        </View>
        <Text style={styles.progressStatusText}>
          {metrics.delivered} of {metrics.total} Deliveries Completed
        </Text>
      </View>

      <View style={styles.routeVerticalDivider} />

      <View style={styles.routeRightCol}>
        <View style={styles.routeStatItem}>
          <View style={styles.routeStatIcon}>
            <Feather name="map-pin" size={15} color={COLORS.infoText} />
          </View>
          <View>
            <Text style={styles.routeStatValue}>Active</Text>
            <Text style={styles.routeStatLabel}>Route Status</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSplitSummaryCards = () => (
    <View style={styles.splitCardsWrap}>
      <View style={styles.summarySplitCard}>
        <View style={styles.summaryCardHeader}>
          <View style={[styles.summaryHeaderIcon, { backgroundColor: COLORS.deliveredBg }]}>
            <Feather name="dollar-sign" size={15} color={COLORS.deliveredText} />
          </View>
          <Text style={styles.summaryCardHeading}>COD Collection</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>Collected</Text>
          <Text style={[styles.summaryValText, { color: COLORS.deliveredText }]}>Rs{metrics.collectedCOD}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>Remaining</Text>
          <Text style={[styles.summaryValText, { color: COLORS.codText }]}>Rs{metrics.remainingCOD}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>Deposited</Text>
          <Text style={styles.summaryValText}>Rs{metrics.depositedCOD}</Text>
        </View>
      </View>

      <View style={styles.summarySplitCard}>
        <View style={styles.summaryCardHeader}>
          <View style={[styles.summaryHeaderIcon, { backgroundColor: COLORS.accentLight }]}>
            <Feather name="award" size={15} color={COLORS.accent} />
          </View>
          <Text style={styles.summaryCardHeading}>Performance</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>On-time</Text>
          <Text style={[styles.summaryValText, { color: COLORS.actionGreen }]}>96%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>Avg. Time</Text>
          <Text style={styles.summaryValText}>12 min</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelText}>Rating</Text>
          <View style={styles.ratingInline}>
            <Text style={styles.summaryValText}>4.8 </Text>
            <Text style={styles.starEmoji}>⭐</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFilterControls = () => (
    <View style={styles.deliveriesSectionHeader}>
      <View style={styles.typeToggleGroup}>
        <TouchableOpacity
          style={[styles.typeToggleBtn, deliveryType === "Normal" && styles.typeToggleBtnActive]}
          onPress={() => setDeliveryType("Normal")}
        >
          <Text style={[styles.typeToggleText, deliveryType === "Normal" && styles.typeToggleTextActive]}>Normal Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeToggleBtn, deliveryType === "Subscription" && styles.typeToggleBtnActive]}
          onPress={() => setDeliveryType("Subscription")}
        >
          <Text style={[styles.typeToggleText, deliveryType === "Subscription" && styles.typeToggleTextActive]}>Subscriptions</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Today's {deliveryType === "Normal" ? "Deliveries" : "Subscriptions"}</Text>
      <View style={styles.filterControlsRow}>
        <View style={styles.pillTabsGroup}>
          {(["All", "Pending", "Delivered"] as FilterTab[]).map((tab) => {
            const isActive = activeFilter === tab;
            let count = metrics.total;
            if (tab === "Pending") count = metrics.pending;
            if (tab === "Delivered") count = metrics.delivered;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab} <Text style={isActive ? styles.countSpanActive : styles.countSpan}>({count})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.sortButton} onPress={fetchTasks}>
          <Text style={styles.sortText}>Sync</Text>
          <Feather name="rotate-cw" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTaskCard = useCallback(({ item }: { item: Task }) => {
    const isCompleted = item.status?.toLowerCase() === "delivered" || item.status?.toLowerCase() === "completed";
    const isPaid = item.payment_status?.toLowerCase() === "paid" || item.payment_status?.toLowerCase() === "completed";
    const isCOD = item.payment_method?.toLowerCase() === "cod";
    const isSub = item.type === "Routine Subscription";
    const isUpdatingStatus = updatingTaskId === item.task_id;
    const isUpdatingPayment = updatingPaymentId === item.task_id;

    return (
      <View style={styles.taskCard}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedTask(item)}
          style={styles.cardInteractiveArea}
        >
          <View style={styles.taskCardHeader}>
            <View style={styles.taskHeaderLeft}>
              <Text style={styles.taskOrderId}>Order #{item.task_id}</Text>
              {isSub && (
                <View style={styles.subTagPill}>
                  <Feather name="refresh-cw" size={10} color={COLORS.deliveredText} style={{ marginRight: 4 }} />
                  <Text style={styles.subTagText}>Subscription</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRightColCard}>
              <View style={[styles.statusChip, { backgroundColor: isCompleted ? COLORS.deliveredBg : COLORS.pendingBg }]}>
                <Text style={[styles.statusChipText, { color: isCompleted ? COLORS.deliveredText : COLORS.pendingText }]}>
                  {isCompleted ? "DELIVERED" : "PENDING"}
                </Text>
              </View>
              <View style={styles.detailsChevronBtn}>
                <Text style={styles.detailsChevronText}>Details</Text>
                <Feather name="chevron-right" size={12} color={COLORS.textMuted} />
              </View>
            </View>
          </View>

          <View style={styles.taskCardBody}>
            <View style={styles.taskCardMainRow}>
              <View style={styles.taskProductAvatar}>
                <Feather name="shopping-bag" size={26} color={COLORS.infoText} />
                {isSub && (
                  <View style={styles.subMiniDot}>
                    <Feather name="repeat" size={8} color={COLORS.white} />
                  </View>
                )}
              </View>

              <View style={styles.taskCustomerCol}>
                <Text style={styles.taskCustomerName} numberOfLines={1}>{item.customer}</Text>
                <View style={styles.taskContactRow}>
                  <Feather name="map-pin" size={13} color={COLORS.textMuted} />
                  <Text style={styles.taskAddressText} numberOfLines={1}>{item.address}</Text>
                </View>
                <View style={styles.taskContactRow}>
                  <Feather name="phone" size={13} color={COLORS.textMuted} />
                  <Text style={styles.taskPhoneText}>{item.phone}</Text>
                </View>
              </View>

              <View style={styles.taskItemsCol}>
                <View style={styles.itemsDivider} />
                <View style={styles.itemsContent}>
                  {item.items && item.items.length > 0 ? (
                    item.items.map((prod, idx) => (
                      <View key={idx} style={styles.taskItemRow}>
                        <Text style={styles.itemQtyBold}>{prod.qty} x </Text>
                        <Text style={styles.itemNameText} numberOfLines={1}>{prod.name}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.taskItemRow}>
                      <Text style={styles.itemQtyBold}>1 x </Text>
                      <Text style={styles.itemNameText}>Dairy Package</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.taskPriceCol}>
                <Text style={styles.taskPriceText}>Rs {item.amount}</Text>
                <View style={[styles.paymentBadge, { backgroundColor: isPaid ? COLORS.deliveredBg : isCOD ? COLORS.codBg : COLORS.infoBg }]}>
                  <Text style={[styles.paymentBadgeText, { color: isPaid ? COLORS.deliveredText : isCOD ? COLORS.codText : COLORS.infoText }]}>
                    {item.payment_method?.toUpperCase() || "COD"} {isPaid ? "✓" : isCOD ? "💵" : "💳"}
                  </Text>
                </View>
              </View>
            </View>

            {!isCompleted && isCOD && !isPaid && (
              <View style={styles.unpaidWarningStrip}>
                <Text style={styles.unpaidWarningText}>⚠️ Cash collection required on arrival</Text>
                <TouchableOpacity
                  style={styles.markPaidMiniBtn}
                  disabled={isUpdatingPayment}
                  onPress={() => handleUpdatePayment(item.task_id)}
                >
                  {isUpdatingPayment ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Feather name="check" size={12} color={COLORS.white} />
                      <Text style={styles.markPaidMiniText}>Mark Paid</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.taskCardFooter}>
          {isCompleted ? (
            <View style={styles.completedSummaryStrip}>
              <View style={styles.completedTimeWrap}>
                <Feather name="check" size={14} color={COLORS.deliveredText} />
                <Text style={styles.completedTimeText}>Delivered Successfully</Text>
              </View>
              <View style={styles.paymentCollectedWrap}>
                <Text style={styles.paymentCollectedText}>{isPaid ? "Payment Collected" : "Online Verified"}</Text>
                <View style={styles.checkedCircle}>
                  <Feather name="check" size={10} color={COLORS.white} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.pendingActionButtonsRow}>
              <TouchableOpacity
                style={styles.btnActionSecondary}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                activeOpacity={0.7}
              >
                <Feather name="phone-call" size={15} color={COLORS.infoText} />
                <Text style={styles.btnSecondaryText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnActionSecondary, { flex: 1.3 }]}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`)}
                activeOpacity={0.7}
              >
                <Feather name="map-pin" size={15} color={COLORS.infoText} />
                <Text style={styles.btnSecondaryText}>View Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnActionPrimary, { flex: 1.5 }]}
                disabled={isUpdatingStatus}
                onPress={() => confirmDelivery(item)}
                activeOpacity={0.8}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Feather name="check-circle" size={16} color={COLORS.white} />
                    <Text style={styles.btnPrimaryText}>Mark Delivered</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }, [updatingTaskId, updatingPaymentId]);

  const renderMilestoneBanner = () => (
    <View style={styles.milestoneBanner}>
      <View style={styles.milestoneIconWrap}>
        <Feather name="gift" size={20} color={COLORS.white} />
      </View>
      <View style={styles.milestoneTextWrap}>
        <View style={styles.milestoneTitleRow}>
          <Text style={styles.milestoneTitle}>Great Job! </Text>
          <Text style={styles.tadaEmoji}>🎉</Text>
        </View>
        <Text style={styles.milestoneSubtitle}>You are doing great today. Keep it up!</Text>
      </View>
    </View>
  );

  const renderQuickActionStrip = () => (
    <View style={styles.quickActionBar}>
      <TouchableOpacity style={styles.quickActionItem} onPress={() => handleQuickAction("supervisor")}>
        <View style={[styles.quickIconBox, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
          <Feather name="phone-call" size={18} color={COLORS.actionGreen} />
        </View>
        <Text style={styles.quickActionText}>Call Supervisor</Text>
      </TouchableOpacity>
      <View style={styles.quickDivider} />
      <TouchableOpacity style={styles.quickActionItem} onPress={() => handleQuickAction("maps")}>
        <View style={[styles.quickIconBox, { backgroundColor: "rgba(29,78,216,0.12)" }]}>
          <Feather name="map" size={18} color={COLORS.infoText} />
        </View>
        <Text style={styles.quickActionText}>Open Maps</Text>
      </TouchableOpacity>
      <View style={styles.quickDivider} />
      <TouchableOpacity style={styles.quickActionItem} onPress={() => handleQuickAction("issue")}>
        <View style={[styles.quickIconBox, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
          <Feather name="alert-triangle" size={18} color={COLORS.pendingText} />
        </View>
        <Text style={styles.quickActionText}>Report Issue</Text>
      </TouchableOpacity>
      <View style={styles.quickDivider} />
      <TouchableOpacity style={styles.quickActionItem} onPress={() => handleQuickAction("sos")}>
        <View style={styles.sosBadgeBox}>
          <Text style={styles.sosBadgeText}>SOS</Text>
        </View>
        <Text style={styles.quickActionText}>Emergency</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLogoutModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLogoutModal}
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
        <View style={styles.modalBackdropCenter}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.logoutDialogCard}>
              <View style={styles.logoutIconCircle}>
                <Feather name="log-out" size={30} color={COLORS.unpaidText} />
              </View>
              <Text style={styles.logoutDialogTitle}>End Driver Shift?</Text>
              <Text style={styles.logoutDialogSubtext}>
                Are you sure you want to log out of your active delivery account? You will need to sign back in to access route telemetry.
              </Text>

              <View style={styles.logoutButtonsRow}>
                <TouchableOpacity
                  style={styles.logoutCancelBtn}
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutConfirmBtn}
                  onPress={async () => {
                    setShowLogoutModal(false);
                    await logout();
                    try {
                      router.replace("/auth/login");
                    } catch (e) { }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutConfirmText}>Yes, Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderOrderDetailsModal = () => {
    if (!selectedTask) return null;
    const isCompleted = selectedTask.status?.toLowerCase() === "delivered" || selectedTask.status?.toLowerCase() === "completed";
    const isPaid = selectedTask.payment_status?.toLowerCase() === "paid" || selectedTask.payment_status?.toLowerCase() === "completed";
    const isCOD = selectedTask.payment_method?.toLowerCase() === "cod";
    const isSub = selectedTask.type === "Routine Subscription";
    const isUpdatingThisStatus = updatingTaskId === selectedTask.task_id;
    const isUpdatingThisPayment = updatingPaymentId === selectedTask.task_id;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedTask}
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedTask(null)}
          />

          <View style={styles.modalBottomSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleCol}>
                <Text style={styles.modalSubTitle}>ORDER MANIFEST & LOGISTICS</Text>
                <View style={styles.modalIdRow}>
                  <Text style={styles.modalTitleText}>Order #{selectedTask.task_id}</Text>
                  {isSub && (
                    <View style={styles.subTagPill}>
                      <Feather name="refresh-cw" size={10} color={COLORS.deliveredText} style={{ marginRight: 4 }} />
                      <Text style={styles.subTagText}>Subscription</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedTask(null)}>
                <Feather name="x" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.modalStatusBanner, { backgroundColor: isCompleted ? COLORS.deliveredBg : COLORS.pendingBg }]}>
                <Feather name={isCompleted ? "check-circle" : "clock"} size={22} color={isCompleted ? COLORS.deliveredText : COLORS.pendingText} />
                <View style={styles.modalStatusTextCol}>
                  <Text style={[styles.modalStatusLabel, { color: isCompleted ? COLORS.deliveredText : COLORS.pendingText }]}>
                    {isCompleted ? "Delivered & Completed" : "Pending Delivery Route"}
                  </Text>
                  <Text style={styles.modalStatusSubText}>
                    {isCompleted ? "This order has been successfully delivered and verified." : "Scheduled for today's active driver delivery routine."}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionHeader}>CUSTOMER DETAILS</Text>
                <View style={styles.modalCustomerHeaderRow}>
                  <View style={[styles.taskProductAvatar, { width: 46, height: 46, borderRadius: 23 }]}>
                    <Feather name="user" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.modalCustomerName}>{selectedTask.customer}</Text>
                    <Text style={styles.modalCustomerRole}>Delivery Recipient</Text>
                  </View>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalContactItem}>
                  <View style={styles.modalContactIcon}>
                    <Feather name="map-pin" size={16} color={COLORS.infoText} />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.modalContactLabel}>Delivery Address</Text>
                    <Text style={styles.modalContactValue}>{selectedTask.address}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalActionMiniBtn}
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(selectedTask.address)}`)}
                  >
                    <Feather name="navigation" size={13} color={COLORS.white} style={{ marginRight: 4 }} />
                    <Text style={styles.modalActionMiniText}>Map</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.modalContactItem, { marginTop: 14 }]}>
                  <View style={[styles.modalContactIcon, { backgroundColor: COLORS.deliveredBg }]}>
                    <Feather name="phone" size={16} color={COLORS.deliveredText} />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.modalContactLabel}>Contact Phone</Text>
                    <Text style={styles.modalContactValue}>{selectedTask.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.modalActionMiniBtn, { backgroundColor: COLORS.deliveredText }]}
                    onPress={() => Linking.openURL(`tel:${selectedTask.phone}`)}
                  >
                    <Feather name="phone-call" size={13} color={COLORS.white} style={{ marginRight: 4 }} />
                    <Text style={styles.modalActionMiniText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionHeader}>PAYMENT & BILLING</Text>
                <View style={styles.modalPaymentGrid}>
                  <View style={styles.modalPaymentBox}>
                    <Text style={styles.modalContactLabel}>Total Amount Due</Text>
                    <Text style={styles.modalPaymentAmount}>Rs {selectedTask.amount}</Text>
                  </View>
                  <View style={styles.modalPaymentBox}>
                    <Text style={styles.modalContactLabel}>Payment Method</Text>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                      <View style={[styles.paymentBadge, { backgroundColor: isCOD ? COLORS.codBg : COLORS.infoBg }]}>
                        <Text style={[styles.paymentBadgeText, { color: isCOD ? COLORS.codText : COLORS.infoText }]}>
                          {selectedTask.payment_method?.toUpperCase() || "ONLINE"} {isCOD ? "💵" : "💳"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.modalPaymentGrid, { marginTop: 12 }]}>
                  <View style={styles.modalPaymentBox}>
                    <Text style={styles.modalContactLabel}>Payment Verification</Text>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                      <View style={[styles.paymentBadge, { backgroundColor: isPaid ? COLORS.deliveredBg : COLORS.unpaidBg }]}>
                        <Text style={[styles.paymentBadgeText, { color: isPaid ? COLORS.deliveredText : COLORS.unpaidText }]}>
                          {isPaid ? "PAID ✓" : "UNPAID ⚠️"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {!isPaid && isCOD && !isCompleted && (
                  <View style={styles.modalUnpaidBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unpaidWarningText}>⚠️ Cash Collection Required</Text>
                      <Text style={styles.modalUnpaidSubText}>
                        Collect NPR {selectedTask.amount} from customer upon arrival.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.markPaidMiniBtn}
                      disabled={isUpdatingThisPayment}
                      onPress={() => handleUpdatePayment(selectedTask.task_id)}
                    >
                      {isUpdatingThisPayment ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Feather name="check" size={14} color={COLORS.white} />
                          <Text style={styles.markPaidMiniText}>Mark Paid</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.modalSectionCard}>
                <View style={styles.modalItemsHeaderRow}>
                  <Text style={styles.modalSectionHeader}>ITEMIZED PACKAGE BREAKDOWN</Text>
                  <View style={styles.modalItemCountBadge}>
                    <Text style={styles.modalItemCountText}>
                      {selectedTask.items ? selectedTask.items.length : 1} {selectedTask.items?.length === 1 ? "Item" : "Items"}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalItemsList}>
                  {selectedTask.items && selectedTask.items.length > 0 ? (
                    selectedTask.items.map((prod, idx) => (
                      <View key={idx} style={styles.modalProductRow}>
                        <View style={styles.modalProductQtyBox}>
                          <Text style={styles.modalProductQty}>{prod.qty}x</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.modalProductName}>{prod.name}</Text>
                          <Text style={styles.modalProductSize}>{prod.size || "Standard Packaging"}</Text>
                        </View>
                        <Feather name="check-circle" size={18} color={COLORS.deliveredText} />
                      </View>
                    ))
                  ) : (
                    <View style={styles.modalProductRow}>
                      <View style={styles.modalProductQtyBox}>
                        <Text style={styles.modalProductQty}>1x</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.modalProductName}>Dairy Products Bundle</Text>
                        <Text style={styles.modalProductSize}>Standard Route Package</Text>
                      </View>
                      <Feather name="check-circle" size={18} color={COLORS.deliveredText} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modalGuidanceBox}>
                <Feather name="info" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalGuidanceText}>
                  Ensure dairy contents are handed over chilled. Ask customer to inspect quantities before leaving departure point.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {isCompleted ? (
                <TouchableOpacity style={styles.modalDoneCloseBtn} onPress={() => setSelectedTask(null)}>
                  <Feather name="check" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalDoneCloseText}>Order Delivered • Close Details</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.modalFooterActionsRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSelectedTask(null)}>
                    <Text style={styles.modalCancelText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnActionPrimary, { flex: 2, paddingVertical: 14 }]}
                    disabled={isUpdatingThisStatus}
                    onPress={() => confirmDelivery(selectedTask)}
                  >
                    {isUpdatingThisStatus ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Feather name="check-circle" size={18} color={COLORS.white} />
                        <Text style={[styles.btnPrimaryText, { fontSize: 15 }]}>Mark as Delivered</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const headerComponent = useMemo(() => (
    <View>
      {activeNav === "Dashboard" && (
        <>
          {renderMetricsGrid()}
          {renderRouteProgress()}
          {renderSplitSummaryCards()}
        </>
      )}
      {renderFilterControls()}
    </View>
  ), [activeNav, metrics, activeFilter, loading]);

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyStateBox}>
      <View style={styles.emptyIconCircle}>
        <Feather name={activeFilter === "Pending" ? "check-circle" : "inbox"} size={42} color={activeFilter === "Pending" ? COLORS.deliveredText : COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>
        {loading ? "Syncing Manifest..." : activeFilter === "Pending" ? "All Caught Up!" : "No Deliveries Assigned"}
      </Text>
      <Text style={styles.emptySubtext}>
        {loading
          ? "Connecting to central dispatch to retrieve your deliveries."
          : activeFilter === "Pending"
            ? "You have successfully finished all pending delivery orders for this filter."
            : `There are currently no ${activeFilter.toLowerCase()} tasks in your active manifest.`}
      </Text>
    </View>
  ), [activeFilter, loading]);

  const footerComponent = useMemo(() => (
    <View style={styles.listFooterWrap}>
      {filteredTasks.length > 0 && renderMilestoneBanner()}
      {renderQuickActionStrip()}
    </View>
  ), [filteredTasks.length]);

  const renderTabContent = () => {
    if (activeNav === "Profile") {
      return (
        <ScrollView style={styles.profileContent} contentContainerStyle={styles.profileScrollBottom}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarBig}>
              <Feather name="user" size={40} color={COLORS.accent} />
            </View>
            <Text style={styles.profileNameTitle}>{user?.name || "Ramesh Kumar"}</Text>
            <Text style={styles.profileRoleTitle}>Senior Delivery Specialist • Route Staff</Text>
            <View style={styles.profileOnlineChip}>
              <View style={[styles.greenPillDot, { marginRight: 6 }]} />
              <Text style={styles.profileOnlineChipText}>Telemetry Active & Online</Text>
            </View>
            <View style={styles.profileStatsContainer}>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatNumber}>{metrics.total}</Text>
                <Text style={styles.profileStatLabel}>Assigned</Text>
              </View>
              <View style={styles.profileVerticalLine} />
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatNumber}>{metrics.delivered}</Text>
                <Text style={styles.profileStatLabel}>Completed</Text>
              </View>
              <View style={styles.profileVerticalLine} />
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatNumber}>{metrics.progress}%</Text>
                <Text style={styles.profileStatLabel}>Success Rate</Text>
              </View>
            </View>
            <View style={styles.profileActionSection}>
              <TouchableOpacity style={styles.profileActionBtn} onPress={fetchTasks}>
                <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                <Text style={styles.profileActionBtnText}>Force Sync Route Database</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileActionBtn, { borderColor: "#FECACA", backgroundColor: COLORS.unpaidBg }]}
                onPress={() => setShowLogoutModal(true)}
              >
                <Feather name="log-out" size={18} color={COLORS.unpaidText} />
                <Text style={[styles.profileActionBtnText, { color: COLORS.unpaidText }]}>
                  Log Out of Driver Shift
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.mainContentWrapper}>
        <FlatList
          key={activeNav}
          data={filteredTasks}
          keyExtractor={(item) => item.task_id}
          renderItem={renderTaskCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mainScrollContent}
          removeClippedSubviews={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.white} colors={[COLORS.primary, COLORS.accent]} />}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={footerComponent}
        />
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      {renderHeader()}
      <View style={styles.curvedBodyContainer}>{renderTabContent()}</View>
      {renderOrderDetailsModal()}
      {renderLogoutModal()}

      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveNav("Dashboard")} activeOpacity={0.8}>
          <Feather name="grid" size={22} color={activeNav === "Dashboard" ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.bottomNavText, activeNav === "Dashboard" && styles.bottomNavTextActive]}>Dashboard</Text>
          {activeNav === "Dashboard" && <View style={styles.navActiveBar} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveNav("Deliveries")} activeOpacity={0.8}>
          <View>
            <Feather name="truck" size={22} color={activeNav === "Deliveries" ? COLORS.primary : COLORS.textLight} />
            {metrics.pending > 0 && (
              <View style={styles.bottomNavBadge}>
                <Text style={styles.bottomNavBadgeText}>{metrics.pending}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.bottomNavText, activeNav === "Deliveries" && styles.bottomNavTextActive]}>Deliveries</Text>
          {activeNav === "Deliveries" && <View style={styles.navActiveBar} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveNav("Profile")} activeOpacity={0.8}>
          <Feather name="user" size={22} color={activeNav === "Profile" ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.bottomNavText, activeNav === "Profile" && styles.bottomNavTextActive]}>Profile</Text>
          {activeNav === "Profile" && <View style={styles.navActiveBar} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: COLORS.primary },
  headerBox: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 36 : 14, paddingBottom: 28, zIndex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerUserWrap: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { marginRight: 12 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255, 255, 255, 0.15)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255, 255, 255, 0.3)" },
  onlineStatusBadge: { position: "absolute", right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.actionGreen, borderWidth: 2, borderColor: COLORS.primary },
  greetingTextCol: { justifyContent: "center" },
  greetingText: { fontSize: 13, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)" },
  nameRow: { flexDirection: "row", alignItems: "center" },
  driverName: { fontSize: 22, fontWeight: "800", color: COLORS.white, letterSpacing: 0.3 },
  waveEmoji: { fontSize: 18, marginLeft: 6 },
  driverIdText: { fontSize: 11, fontWeight: "700", color: COLORS.accent, marginTop: 2, letterSpacing: 0.5 },
  headerRightCol: { alignItems: "flex-end" },
  onlineDropdownBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8, gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  greenPillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.actionGreen },
  onlinePillText: { fontSize: 12, fontWeight: "800", color: COLORS.textDark },
  timeWrap: { alignItems: "flex-end" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerDateText: { fontSize: 11, fontWeight: "600", color: "rgba(255, 255, 255, 0.85)" },
  headerTimeText: { fontSize: 11, fontWeight: "700", color: COLORS.accent, marginTop: 2 },
  curvedBodyContainer: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, zIndex: 2, overflow: "hidden" },
  mainContentWrapper: { flex: 1 },
  mainScrollContent: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 90 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 8 },
  metricCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  metricIconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  metricCardValue: { fontSize: 17, fontWeight: "900", color: COLORS.textDark },
  metricCardTitle: { fontSize: 11, fontWeight: "800", color: COLORS.textDark, marginTop: 2 },
  metricCardSub: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  routeCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, flexDirection: "row", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  routeLeftCol: { flex: 2.2, paddingRight: 10 },
  routeCardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  routePathText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 12 },
  progressWrap: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  progressBarBackground: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: "hidden", marginRight: 8 },
  progressBarFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 4 },
  progressPercentText: { fontSize: 13, fontWeight: "900", color: COLORS.infoText },
  progressStatusText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  routeVerticalDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
  routeRightCol: { flex: 1.1, justifyContent: "center" },
  routeStatItem: { flexDirection: "row", alignItems: "center" },
  routeStatIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.infoBg, alignItems: "center", justifyContent: "center", marginRight: 8 },
  routeStatValue: { fontSize: 13, fontWeight: "900", color: COLORS.textDark },
  routeStatLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted },
  splitCardsWrap: { flexDirection: "row", marginBottom: 20, gap: 12 },
  summarySplitCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, justifyContent: "space-between" },
  summaryCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  summaryHeaderIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  summaryCardHeading: { fontSize: 13, fontWeight: "800", color: COLORS.textDark },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryLabelText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  summaryValText: { fontSize: 12, fontWeight: "800", color: COLORS.textDark },
  ratingInline: { flexDirection: "row", alignItems: "center" },
  starEmoji: { fontSize: 11 },
  deliveriesSectionHeader: { marginBottom: 14 },
  typeToggleGroup: { flexDirection: "row", backgroundColor: COLORS.border, padding: 4, borderRadius: 12, marginBottom: 16 },
  typeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  typeToggleBtnActive: { backgroundColor: COLORS.white, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  typeToggleText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  typeToggleTextActive: { fontWeight: "800", color: COLORS.primary },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 10 },
  filterControlsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pillTabsGroup: { flexDirection: "row", backgroundColor: COLORS.white, padding: 3, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, flex: 1, marginRight: 10 },
  filterPill: { flex: 1, paddingVertical: 7, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterPillText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  filterPillTextActive: { color: COLORS.white },
  countSpan: { fontSize: 10, color: COLORS.textMuted },
  countSpanActive: { fontSize: 10, color: COLORS.accent },
  sortButton: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  sortText: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  taskCard: { backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, overflow: "hidden" },
  cardInteractiveArea: { backgroundColor: COLORS.white },
  taskCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  taskHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  taskOrderId: { fontSize: 15, fontWeight: "900", color: COLORS.textDark },
  subTagPill: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.deliveredBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subTagText: { fontSize: 10, fontWeight: "800", color: COLORS.deliveredText },
  headerRightColCard: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailsChevronBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  detailsChevronText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, marginRight: 2 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  taskCardBody: { paddingHorizontal: 16, paddingBottom: 14 },
  taskCardMainRow: { flexDirection: "row", alignItems: "center" },
  taskProductAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.infoBg, alignItems: "center", justifyContent: "center", position: "relative", borderWidth: 1, borderColor: "rgba(29, 78, 216, 0.1)" },
  subMiniDot: { position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.deliveredText, alignItems: "center", justifyContent: "center" },
  taskCustomerCol: { flex: 1.5, marginLeft: 12 },
  taskCustomerName: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  taskContactRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 },
  taskAddressText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, flex: 1 },
  taskPhoneText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  taskItemsCol: { flex: 1.2, flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  itemsDivider: { width: 1, height: 36, backgroundColor: COLORS.border, marginRight: 8 },
  itemsContent: { flex: 1 },
  taskItemRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  itemQtyBold: { fontSize: 12, fontWeight: "800", color: COLORS.textDark },
  itemNameText: { fontSize: 12, fontWeight: "700", color: COLORS.textDark, flex: 1 },
  taskPriceCol: { alignItems: "flex-end", marginLeft: 6 },
  taskPriceText: { fontSize: 17, fontWeight: "900", color: COLORS.textDark, marginBottom: 4 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paymentBadgeText: { fontSize: 10, fontWeight: "800" },
  unpaidWarningStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.unpaidBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: "#FECACA" },
  unpaidWarningText: { fontSize: 11, fontWeight: "700", color: COLORS.unpaidText },
  markPaidMiniBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.deliveredText, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  markPaidMiniText: { fontSize: 11, fontWeight: "800", color: COLORS.white },
  taskCardFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.background },
  pendingActionButtonsRow: { flexDirection: "row", gap: 8 },
  btnActionSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  btnSecondaryText: { fontSize: 12, fontWeight: "800", color: COLORS.infoText },
  btnActionPrimary: { flex: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.actionGreen, paddingVertical: 10, borderRadius: 12, gap: 6, shadowColor: COLORS.actionGreen, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  btnPrimaryText: { fontSize: 12, fontWeight: "800", color: COLORS.white },
  completedSummaryStrip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  completedTimeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  completedTimeText: { fontSize: 12, fontWeight: "700", color: COLORS.deliveredText },
  paymentCollectedWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  paymentCollectedText: { fontSize: 12, fontWeight: "800", color: COLORS.textDark },
  checkedCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.actionGreen, alignItems: "center", justifyContent: "center" },
  listFooterWrap: { marginTop: 8 },
  milestoneBanner: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.infoBg, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "rgba(29, 78, 216, 0.15)", marginBottom: 20 },
  milestoneIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.infoText, alignItems: "center", justifyContent: "center", marginRight: 12 },
  milestoneTextWrap: { flex: 1 },
  milestoneTitleRow: { flexDirection: "row", alignItems: "center" },
  milestoneTitle: { fontSize: 15, fontWeight: "900", color: COLORS.infoText },
  tadaEmoji: { fontSize: 14 },
  milestoneSubtitle: { fontSize: 11, fontWeight: "600", color: COLORS.textDark, marginTop: 2 },
  quickActionBar: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, marginBottom: 24 },
  quickActionItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  quickIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  sosBadgeBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", marginBottom: 6, shadowColor: "#DC2626", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  sosBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  quickActionText: { fontSize: 11, fontWeight: "700", color: COLORS.textDark },
  quickDivider: { width: 1, height: 36, backgroundColor: COLORS.border, alignSelf: "center" },
  profileContent: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  profileScrollBottom: { paddingBottom: 80 },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  profileAvatarBig: { width: 86, height: 86, borderRadius: 43, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.accent, marginBottom: 16 },
  profileNameTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },
  profileRoleTitle: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginTop: 4 },
  profileOnlineChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.deliveredBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 14 },
  profileOnlineChipText: { fontSize: 12, fontWeight: "800", color: COLORS.deliveredText },
  profileStatsContainer: { flexDirection: "row", backgroundColor: COLORS.background, borderRadius: 16, paddingVertical: 18, width: "100%", marginTop: 24, borderWidth: 1, borderColor: COLORS.border },
  profileStatBox: { flex: 1, alignItems: "center" },
  profileStatNumber: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  profileStatLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  profileVerticalLine: { width: 1, backgroundColor: COLORS.border },
  profileActionSection: { width: "100%", marginTop: 24, gap: 12 },
  profileActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, borderRadius: 16, gap: 8 },
  profileActionBtnText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  emptyStateBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  emptySubtext: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted, textAlign: "center", lineHeight: 18 },
  bottomNavContainer: { flexDirection: "row", backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 28 : 12, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 16 },
  bottomNavTab: { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  bottomNavText: { fontSize: 11, fontWeight: "600", color: COLORS.textLight, marginTop: 4 },
  bottomNavTextActive: { color: COLORS.primary, fontWeight: "800" },
  navActiveBar: { position: "absolute", top: -10, width: 24, height: 3, backgroundColor: COLORS.accent, borderRadius: 2 },
  bottomNavBadge: { position: "absolute", top: -6, right: -10, backgroundColor: "#DC2626", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: "center" },
  bottomNavBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)", justifyContent: "flex-end" },
  modalBackdropCenter: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)", justifyContent: "center", alignItems: "center" },
  modalBottomSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: "90%", minHeight: "65%", shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 20, overflow: "hidden" },
  modalHandleBar: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.textLight, alignSelf: "center", marginTop: 10, marginBottom: 8, opacity: 0.6 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitleCol: { flex: 1 },
  modalSubTitle: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  modalIdRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitleText: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },
  modalCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  modalScrollBody: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  modalStatusBanner: { flexDirection: "row", alignItems: "flex-start", padding: 16, borderRadius: 18, marginBottom: 16, gap: 14 },
  modalStatusTextCol: { flex: 1 },
  modalStatusLabel: { fontSize: 16, fontWeight: "900", marginBottom: 4 },
  modalStatusSubText: { fontSize: 12, fontWeight: "600", color: COLORS.textDark, opacity: 0.85, lineHeight: 17 },
  modalSectionCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  modalSectionHeader: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 },
  modalCustomerHeaderRow: { flexDirection: "row", alignItems: "center" },
  modalCustomerName: { fontSize: 18, fontWeight: "900", color: COLORS.textDark },
  modalCustomerRole: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  modalDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  modalContactItem: { flexDirection: "row", alignItems: "center" },
  modalContactIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.infoBg, alignItems: "center", justifyContent: "center", marginRight: 12 },
  modalContactLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase" },
  modalContactValue: { fontSize: 14, fontWeight: "800", color: COLORS.textDark, marginTop: 2 },
  modalActionMiniBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  modalActionMiniText: { fontSize: 12, fontWeight: "800", color: COLORS.white },
  modalPaymentGrid: { flexDirection: "row", justifyContent: "space-between" },
  modalPaymentBox: { flex: 1 },
  modalPaymentAmount: { fontSize: 20, fontWeight: "900", color: COLORS.primary, marginTop: 4 },
  modalUnpaidBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.unpaidBg, padding: 14, borderRadius: 14, marginTop: 16, borderWidth: 1, borderColor: "#FECACA" },
  modalUnpaidSubText: { fontSize: 12, fontWeight: "600", color: COLORS.textDark, marginTop: 2 },
  modalItemsHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalItemCountBadge: { backgroundColor: COLORS.infoBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  modalItemCountText: { fontSize: 11, fontWeight: "800", color: COLORS.infoText },
  modalItemsList: { gap: 12 },
  modalProductRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  modalProductQtyBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  modalProductQty: { fontSize: 13, fontWeight: "900", color: COLORS.primary },
  modalProductName: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  modalProductSize: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, marginTop: 2 },
  modalGuidanceBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,33,71,0.06)", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,33,71,0.1)" },
  modalGuidanceText: { flex: 1, fontSize: 12, fontWeight: "600", color: COLORS.primaryDark, lineHeight: 18 },
  modalFooter: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 34 : 20, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  modalFooterActionsRow: { flexDirection: "row", gap: 12 },
  modalCancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  modalCancelText: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  modalDoneCloseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.deliveredText, paddingVertical: 16, borderRadius: 16 },
  modalDoneCloseText: { fontSize: 15, fontWeight: "800", color: COLORS.white },
  logoutDialogCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, marginHorizontal: 28, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15, marginBottom: Platform.OS === "web" ? 0 : 40, maxWidth: 400 },
  logoutIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.unpaidBg, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: "#FECACA" },
  logoutDialogTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark, marginBottom: 8 },
  logoutDialogSubtext: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  logoutButtonsRow: { flexDirection: "row", gap: 12, width: "100%" },
  logoutCancelBtn: { flex: 1, paddingVertical: 14, backgroundColor: COLORS.background, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  logoutCancelText: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  logoutConfirmBtn: { flex: 1.2, paddingVertical: 14, backgroundColor: COLORS.unpaidText, borderRadius: 14, alignItems: "center" },
  logoutConfirmText: { fontSize: 15, fontWeight: "800", color: COLORS.white },
});