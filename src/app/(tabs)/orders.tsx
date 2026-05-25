import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router"; // <-- Added useLocalSearchParams
import { useState, useEffect } from "react";
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

const INITIAL_ORDERS = [
  { id: "#12345", date: "10 May 2024", status: "Delivered", amount: 456, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80" },
  { id: "#12344", date: "09 May 2024", status: "Processing", amount: 320, image: "https://images.unsplash.com/photo-1605297833075-84ab8e833441?auto=format&fit=crop&w=150&q=80" },
  { id: "#12343", date: "08 May 2024", status: "Delivered", amount: 160, image: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=150&q=80" },
];

const FILTERS = ["All", "Processing", "Delivered", "Cancelled"];

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // <-- Capture return parameters
  
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeFilter, setActiveFilter] = useState("All");

  // 🔥 LISTEN FOR CANCELLATIONS: Watch if an ID comes back from the details screen
  useEffect(() => {
    if (params.cancelledId) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === `#${params.cancelledId}` ? { ...order, status: "Cancelled" } : order
        )
      );
      // Automatically switch the user's view tab to the Cancelled filter section to see it change!
      setActiveFilter("Cancelled");
    }
  }, [params.cancelledId]);

  const filteredOrders = orders.filter((order) =>
    activeFilter === "All" ? true : order.status === activeFilter,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return COLORS.success;
      case "Processing": return "#F5A623";
      case "Cancelled": return COLORS.primary; // Red theme color for Cancelled
      default: return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Top Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity key={filter} style={[styles.filterTab, isActive && styles.filterTabActive]} onPress={() => setActiveFilter(filter)} activeOpacity={0.8}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="box" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No orders found in {activeFilter}.</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: order.image }} style={styles.orderImage} resizeMode="contain" />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order {order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderStatusContainer}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                <Text style={styles.orderAmount}>₹{order.amount}</Text>
                
                <TouchableOpacity 
                  style={styles.viewDetailsBtn}
                  onPress={() => router.push({
                    pathname: `/order/${order.id.replace('#', '')}`,
                    params: { date: order.date, status: order.status, amount: order.amount, image: order.image }
                  })}
                >
                  <Text style={styles.viewDetailsText}>View Details ›</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, backgroundColor: COLORS.card },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  placeholder: { width: 24 },
  filterContainer: { backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterScroll: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m, gap: SPACING.l },
  filterTab: { paddingBottom: SPACING.xs, borderBottomWidth: 2, borderBottomColor: "transparent" },
  filterTabActive: { borderBottomColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary, fontWeight: "800" },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },
  orderCard: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: RADIUS.large, padding: SPACING.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  imageContainer: { width: 50, height: 50, backgroundColor: COLORS.background, borderRadius: RADIUS.medium, justifyContent: "center", alignItems: "center", padding: SPACING.xs, marginRight: SPACING.m },
  orderImage: { width: "100%", height: "100%" },
  orderInfo: { flex: 1, justifyContent: "center" },
  orderId: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  orderDate: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },
  orderStatusContainer: { alignItems: "flex-end", justifyContent: "center" },
  statusText: { fontSize: 11, fontWeight: "800", marginBottom: 4 },
  orderAmount: { fontSize: 14, fontWeight: "900", color: COLORS.text, marginBottom: 6 },
  viewDetailsBtn: { paddingVertical: 2 },
  viewDetailsText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { marginTop: SPACING.m, color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
});