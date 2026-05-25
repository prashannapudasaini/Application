import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useCart } from "../../context/CartContext";

const FILTERS = ["All", "Processing", "Delivered", "Cancelled"];

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orderHistory } = useCart();
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (params.cancelledId) {
      setActiveFilter("Cancelled");
    }
  }, [params.cancelledId]);

  const filteredOrders = orderHistory.filter((order) =>
    activeFilter === "All" ? true : order.status === activeFilter,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return COLORS.success;
      case "Processing":
        return "#F5A623";
      case "Cancelled":
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="package" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any orders in the '{activeFilter}' category.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) },
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <View style={styles.orderBody}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: order.image }}
                    style={styles.orderImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderItems} numberOfLines={1}>
                    {order.items}
                  </Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                  <Text style={styles.orderAmount}>NPR {order.amount}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.orderFooter}>
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => router.push(`/order/${order.id}`)}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Feather name="chevron-right" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  placeholder: { width: 24 },
  filterContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.s,
    gap: SPACING.l,
    paddingTop: SPACING.xs,
  },
  filterTab: {
    paddingBottom: SPACING.s,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: { borderBottomColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary, fontWeight: "900" },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  orderId: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  orderBody: { flexDirection: "row", alignItems: "center" },
  imageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    overflow: "hidden",
    marginRight: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderImage: { width: "100%", height: "100%" },
  orderInfo: { flex: 1 },
  orderItems: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 6,
  },
  orderAmount: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.medium,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
