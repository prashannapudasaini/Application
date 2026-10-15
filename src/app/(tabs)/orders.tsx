import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";
// 🔥 FIXED: Imported from AuthContext instead of layout
import { useAuth } from "../../context/AuthContext";

const FILTERS = ["All", "Processing", "Pending", "Delivered", "Cancelled"];

interface OrderItem {
  id: string | number;
  created_at: string;
  total_amount: string | number;
  payment_status: string;
  order_status: string;
  payment_method: string;
  delivery_date?: string;
  delivery_slot?: string;
  items: {
    quantity: number;
    price: string | number;
    name: string;
    image?: string;
  }[];
}

export default function OrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState("All");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const horizontalListRef = useRef<FlatList>(null);
  const SCREEN_WIDTH = Dimensions.get("window").width;

  useEffect(() => {
    if (params.cancelledId) {
      setActiveFilter("Cancelled");
      const index = FILTERS.indexOf("Cancelled");
      if (index !== -1) {
        setTimeout(() => horizontalListRef.current?.scrollToIndex({ index, animated: false }), 100);
      }
    }
  }, [params.cancelledId]);

  const fetchOrders = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get(`/api/user/my-orders.php?user_id=${user.id}&_t=${Date.now()}`);
      if (res.data.status === "success" && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "All") return true;
    return (
      order.order_status?.toLowerCase().trim() ===
      activeFilter.toLowerCase().trim()
    );
  });

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().trim();
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    return new Date(dateString.replace(" ", "T")).toLocaleDateString(
      "en-GB",
      options,
    );
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
          {FILTERS.map((filter, index) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => {
                  setActiveFilter(filter);
                  horizontalListRef.current?.scrollToIndex({ index, animated: true });
                }}
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching your orders...</Text>
        </View>
      ) : (
        <FlatList
          ref={horizontalListRef}
          data={FILTERS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SCREEN_WIDTH);
            if (FILTERS[index] && FILTERS[index] !== activeFilter) {
              setActiveFilter(FILTERS[index]);
            }
          }}
          renderItem={({ item: filterName }) => {
            const pageOrders = orders.filter((order) => {
              if (filterName === "All") return true;
              return (
                order.order_status?.toLowerCase().trim() ===
                filterName.toLowerCase().trim()
              );
            });

            return (
              <View style={{ width: SCREEN_WIDTH }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={onRefresh}
                      colors={[COLORS.primary]}
                    />
                  }
                >
                  {pageOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconCircle}>
                        <Feather name="package" size={40} color={COLORS.primary} />
                      </View>
                      <Text style={styles.emptyTitle}>No Orders Found</Text>
                      <Text style={styles.emptySubtitle}>
                        You don't have any orders in the '{filterName}' category.
                      </Text>
                    </View>
                  ) : (
                    pageOrders.map((order) => {
                      const safeStatus = order.order_status || "Unknown";

                      const itemWithImage = order.items?.find(
                        (item) => item.image && item.image.trim() !== "",
                      );
                      const imageUrl = itemWithImage?.image
                        ? getImageUrl(itemWithImage.image)
                        : null;

                      const itemsSummary =
                        order.items && order.items.length > 0
                          ? order.items
                              .map((item) => `${item.name} (${item.quantity})`)
                              .join(", ")
                          : "No items listed";

                      return (
                        <View key={order.id} style={styles.compactCard}>
                          {/* Compact Header */}
                          <View style={styles.cardTopRow}>
                            <Text style={styles.orderId}>Order #{order.id}</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(safeStatus) + "18" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: getStatusColor(safeStatus) },
                                ]}
                              >
                                {safeStatus.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          {/* Compact Content Body */}
                          <View style={styles.cardMainRow}>
                            <View style={styles.imageBox}>
                              {imageUrl ? (
                                <Image
                                  source={{ uri: imageUrl }}
                                  style={styles.productImg}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.fallbackBox}>
                                  <Feather name="package" size={20} color="#888" />
                                </View>
                              )}
                            </View>

                            <View style={styles.infoCol}>
                              <Text style={styles.itemsText} numberOfLines={1}>
                                {itemsSummary}
                              </Text>
                              {order.delivery_date ? (
                                <Text style={styles.dateText}>
                                  Delivery: {formatDate(order.delivery_date)} • {order.delivery_slot}
                                </Text>
                              ) : (
                                <Text style={styles.dateText}>
                                  Ordered: {formatDate(order.created_at)}
                                </Text>
                              )}
                              <Text style={styles.priceText}>
                                NPR {order.total_amount}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.compactBtn}
                              activeOpacity={0.85}
                              onPress={() => router.push(`/order/${order.id}`)}
                            >
                              <Text style={styles.btnText}>Details</Text>
                              <Feather name="chevron-right" size={14} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  placeholder: { width: 24 },
  filterContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  filterScroll: {
    paddingHorizontal: SPACING.m,
    paddingBottom: 8,
    gap: 16,
    paddingTop: 6,
  },
  filterTab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: { borderBottomColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.primary, fontWeight: "900" },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  compactCard: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.medium,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },

  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  productImg: { width: "100%", height: "100%" },
  fallbackBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  itemsText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },
  compactBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
