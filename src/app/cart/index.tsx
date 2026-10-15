import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import { RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { useDeliverySettings } from "../../hooks/useDeliverySettings";

export default function CartScreen() {
  const router = useRouter();

  // 🔥 FIX: Pulled `removeFromCart` to exactly match your context
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { settings: deliveryConfig, refreshSettings } = useDeliverySettings();

  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);

  useEffect(() => {
    refreshSettings();
    const fetchDeliveryPreview = async () => {
      try {
        const res = await api.get('/api/orders/delivery_preview.php');
        if (res.data?.status === 'success') {
          setDeliveryInfo(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch delivery preview:", err);
      }
    };
    fetchDeliveryPreview();
  }, [refreshSettings]);

  // Dynamic Free Delivery Offer Calculations
  const isOfferActive = Boolean(Number(deliveryConfig.free_delivery_enabled));
  const offerThreshold = Number(deliveryConfig.offer_free_threshold) || 500;
  const originalThreshold = Number(deliveryConfig.original_free_threshold) || 1000;
  const offerName = deliveryConfig.offer_name || "Dashain Offer";

  const effectiveThreshold = isOfferActive ? offerThreshold : originalThreshold;
  const qualifiesFreeDelivery = isOfferActive
    ? (cartTotal || 0) >= offerThreshold
    : originalThreshold > 0 && (cartTotal || 0) >= originalThreshold;

  const amountNeeded = Math.max(0, effectiveThreshold - (cartTotal || 0));
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      effectiveThreshold > 0 ? ((cartTotal || 0) / effectiveThreshold) * 100 : 100,
    ),
  );

  // Safety fallback
  const safeItems = items || [];

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productSize}>
          {item.size} {item.plan ? `• ${item.plan}` : ""}
        </Text>
        <Text style={styles.productPrice}>NPR {item.price}</Text>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity
          // 🔥 FIX: Passed the specific cartItemId instead of id/size
          onPress={() => removeFromCart(item.cartItemId)}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={18} color="#FF3B30" />
        </TouchableOpacity>

        <View style={styles.quantityController}>
          <TouchableOpacity
            style={styles.qtyBtn}
            // 🔥 FIX: Passed the exact new quantity (current - 1)
            onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
          >
            <Feather name="minus" size={16} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            // 🔥 FIX: Passed the exact new quantity (current + 1)
            onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
          >
            <Feather name="plus" size={16} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {safeItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="shopping-cart" size={40} color="#800000" />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't added any dairy products to your cart yet.
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              activeOpacity={0.8}
              onPress={handleGoBack}
            >
              <Text style={styles.shopNowText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={safeItems}
              // 🔥 FIX: Use cartItemId for the key extractor
              keyExtractor={(item) => item.cartItemId}
              renderItem={renderCartItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={{ marginBottom: SPACING.m }}>
                  {/* Dynamic Free Delivery Progress Banner */}
                  {isOfferActive && (
                    <View
                      style={[
                        styles.promoBannerContainer,
                        qualifiesFreeDelivery
                          ? styles.promoBannerSuccess
                          : styles.promoBannerPending,
                      ]}
                    >
                      <View style={styles.promoBannerHeader}>
                        <Text style={styles.promoEmoji}>
                          {qualifiesFreeDelivery ? "🎉" : "🎁"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          {qualifiesFreeDelivery ? (
                            <Text style={styles.promoBannerSuccessText}>
                              <Text style={{ fontWeight: "900" }}>{offerName}:</Text> You've unlocked{" "}
                              <Text style={{ fontWeight: "900" }}>FREE Delivery</Text>!
                            </Text>
                          ) : (
                            <Text style={styles.promoBannerPendingText}>
                              Add{" "}
                              <Text style={{ fontWeight: "900", color: "#B45309" }}>
                                NPR {amountNeeded.toLocaleString()}
                              </Text>{" "}
                              more for <Text style={{ fontWeight: "900" }}>FREE Delivery</Text> under{" "}
                              <Text style={{ fontWeight: "900" }}>{offerName}</Text>!
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Visual Progress Bar */}
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${progressPercent}%`,
                              backgroundColor: qualifiesFreeDelivery ? "#10B981" : "#F59E0B",
                            },
                          ]}
                        />
                      </View>

                      {/* Offer Info Subtitle */}
                      <View style={styles.promoBannerFooter}>
                        <Text style={styles.promoFooterText}>
                          {qualifiesFreeDelivery ? (
                            "✓ Free delivery applied to your cart"
                          ) : (
                            <>
                              Special:{" "}
                              <Text style={{ textDecorationLine: "line-through", color: "#9CA3AF" }}>
                                NPR {originalThreshold}
                              </Text>{" "}
                              <Text style={{ fontWeight: "800", color: "#B45309" }}>
                                NPR {offerThreshold}
                              </Text>
                            </>
                          )}
                        </Text>
                        <Text
                          style={[
                            styles.promoPercentBadge,
                            qualifiesFreeDelivery && { color: "#059669", fontWeight: "900" },
                          ]}
                        >
                          {qualifiesFreeDelivery ? "UNLOCKED" : `${Math.round(progressPercent)}%`}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Standard Morning Delivery Banner */}
                  <View style={styles.deliveryBanner}>
                    <View style={styles.deliveryBannerHeader}>
                      <Text style={styles.deliveryBannerTitle}>
                        🌅 Morning Delivery (7:00 AM - 10:00 AM)
                      </Text>
                    </View>
                    <Text style={styles.deliveryBannerDisplay}>
                      {deliveryInfo 
                        ? `Your order will be delivered on ${deliveryInfo.formatted_date} between ${deliveryInfo.time_range}.`
                        : "Calculating delivery time..."}
                    </Text>
                    <Text style={styles.deliveryBannerNote}>
                      {deliveryInfo ? `* ${deliveryInfo.description}` : "* Orders must be placed at least 12 hours in advance."}
                    </Text>
                  </View>
                </View>
              }
            />

            {/* Bottom Checkout Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.totalContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  {qualifiesFreeDelivery && (
                    <View style={styles.freeBadgePill}>
                      <Text style={styles.freeBadgePillText}>FREE DELIVERY</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.totalPrice}>
                  {/* 🔥 FIX: Safely render toLocaleString */}
                  NPR {cartTotal?.toLocaleString() || 0}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutBtn}
                activeOpacity={0.9}
                onPress={() => router.push("/cart/checkout")}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
                <Feather name="chevron-right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
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

  content: { flex: 1 },
  listContent: { padding: SPACING.m, paddingBottom: 100 },
  
  // Delivery Banner
  deliveryBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  deliveryBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  deliveryBannerDisplay: {
    fontSize: 13,
    color: '#1B5E20',
    fontWeight: '700',
    marginBottom: 4,
  },
  deliveryBannerNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Cart Item Card
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageContainer: {
    width: 70,
    height: 70,
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
    padding: 5,
  },
  productImage: { width: "100%", height: "100%" },
  itemDetails: { flex: 1, justifyContent: "center" },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  productSize: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  productPrice: { fontSize: 15, fontWeight: "900", color: "#800000" },

  // Controls
  actionColumn: { justifyContent: "space-between", alignItems: "flex-end" },
  deleteBtn: { padding: 4 },
  quantityController: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  qtyBtn: { padding: 8 },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
    minWidth: 20,
    textAlign: "center",
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: SPACING.m,
    paddingBottom: Platform.OS === "ios" ? 0 : SPACING.m,
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
    backgroundColor: "#800000",
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

  // Empty State
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
    marginBottom: SPACING.l,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  shopNowBtn: {
    backgroundColor: "#800000",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
  },
  shopNowText: { color: "#FFF", fontSize: 15, fontWeight: "800" },

  // Promo Banner Styles
  promoBannerContainer: {
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  promoBannerPending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  promoBannerSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  promoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  promoEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  promoBannerPendingText: {
    fontSize: 13,
    color: "#78350F",
    fontWeight: "600",
    lineHeight: 18,
  },
  promoBannerSuccessText: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "700",
    lineHeight: 18,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  promoBannerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoFooterText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  promoPercentBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
  freeBadgePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },
});
