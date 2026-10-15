import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import AddAddressModal from "../../components/common/AddAddressModal";

import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";
import { useDeliverySettings } from "../../hooks/useDeliverySettings";

const HUBS = [
  { name: 'Patan', latitude: 27.6742, longitude: 85.3181 },
  { name: 'Kuleshwor', latitude: 27.6970, longitude: 85.2970 }
];
const MAX_RADIUS_KM = 5;

// Haversine formula to get distance in km
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, cartTotal, placeOrder, walletBalance } = useCart();
  const { user } = useAuth();
  const { settings: deliveryConfig, refreshSettings } = useDeliverySettings();
  
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);

  // SAFETY FALLBACKS & CALCULATIONS
  const safeItems = items || [];
  const safeTotal = cartTotal || 0; // Subtotal

  // Check if cart has subscription items
  const hasSubscriptionItems = safeItems.some(
    (i) => i.plan && !i.plan.includes("One Time"),
  );

  // Payment & Loading States
  const [paymentMethod, setPaymentMethod] = useState(hasSubscriptionItems ? "wallet" : "cod");
  const [isProcessing, setIsProcessing] = useState(false);

  // Address & GIS states
  // --- Address Book States ---
  const [phone, setPhone] = useState(user?.phone || "");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const fetchAddresses = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/user/mobile-profile.php?user_id=${user.id}&_t=${Date.now()}`);
      if (res.data?.status === "success" && res.data.data.saved_addresses) {
        const addresses = res.data.data.saved_addresses;
        setSavedAddresses(addresses);
        if (addresses.length > 0 && !selectedAddressId) {
          setSelectedAddressId(addresses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleDeleteAddress = (addressId: string | number) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.post("/api/user/delete_address.php", {
                user_id: user?.id ? Number(user.id) : null,
                address_id: addressId,
              });
              if (res.data?.status?.toLowerCase() === "success") {
                if (selectedAddressId === addressId) {
                  setSelectedAddressId(null);
                }
                fetchAddresses();
              } else {
                Alert.alert("Failed", res.data?.message || "Could not delete address.");
              }
            } catch (err) {
              console.error("Delete failed:", err);
              Alert.alert("Network Error", "Could not reach the server.");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    refreshSettings();
    fetchAddresses();
    
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
  }, [user]);

  // Dynamic Delivery Configuration
  const isOfferActive = Boolean(Number(deliveryConfig.free_delivery_enabled));
  const offerThreshold = Number(deliveryConfig.offer_free_threshold) || 500;
  const originalThreshold = Number(deliveryConfig.original_free_threshold) || 1000;
  const feePerKm = Number(deliveryConfig.fee_per_km) || 20;
  const offerName = deliveryConfig.offer_name || "Dashain Offer";

  // Check if order qualifies for promotional or standard free delivery
  const qualifiesFreeDelivery = isOfferActive
    ? safeTotal >= offerThreshold
    : originalThreshold > 0 && safeTotal >= originalThreshold;

  // Calculate Distance & Raw Delivery Fee
  let distanceInKm = 0;
  let rawDeliveryFee = 0;
  if (selectedAddressId) {
    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (selectedAddr && selectedAddr.latitude && selectedAddr.longitude) {
      const lat = Number(selectedAddr.latitude);
      const lng = Number(selectedAddr.longitude);
      let shortestDistance = Infinity;

      HUBS.forEach((hub) => {
        const distance = getDistanceKm(lat, lng, hub.latitude, hub.longitude);
        if (distance < shortestDistance) shortestDistance = distance;
      });

      if (shortestDistance !== Infinity) {
        distanceInKm = Math.max(1, Math.ceil(shortestDistance));
        rawDeliveryFee = distanceInKm * feePerKm;
      }
    }
  }

  // Final delivery fee
  const deliveryFee = qualifiesFreeDelivery ? 0 : rawDeliveryFee;
  const grandTotal = safeTotal + deliveryFee;
  const amountNeeded = Math.max(0, offerThreshold - safeTotal);
  const safeWalletBalance = walletBalance || 0;

  // Validations
  const isWalletSufficient = safeWalletBalance >= grandTotal;
  const isAddressValid = !!selectedAddressId && phone.trim();
  const needsTopUp = paymentMethod === "wallet" && !isWalletSufficient;

  const isCheckoutDisabled =
    isProcessing ||
    (!isAddressValid && !needsTopUp);

  const handlePlaceOrder = async () => {
    if (needsTopUp) {
      router.push("/(tabs)/wallet");
      return;
    }

    if (safeItems.length === 0) {
      Alert.alert("Empty Cart", "Add some items before checking out.");
      return;
    }

    if (!selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery address.");
      return;
    }

    setIsProcessing(true);

    try {
      const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
      const fullAddress = selectedAddr
        ? `[GPS: ${Number(selectedAddr.latitude).toFixed(5)}, ${Number(selectedAddr.longitude).toFixed(5)}] ${selectedAddr.label} - ${selectedAddr.address}`
        : "No Address Selected";

      if (hasSubscriptionItems) {
        // 🔥 HANDLE SUBSCRIPTION ROUTINE CHECKOUT (Matches web create_sub.php)
        // Group items into schedules if needed or submit cart routine
        const planType = safeItems[0]?.plan?.toLowerCase().includes("daily")
          ? "daily"
          : "weekly";

        const schedulePayload = [
          {
            day: "Tuesday", // Default or parsed from item plans
            items: safeItems.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              qty: item.quantity,
              size: item.size,
            })),
          },
        ];

        const createRes = await api.post("/api/orders/create_sub.php", {
          user_id: user?.id ? Number(user.id) : null,
          plan_type: planType,
          delivery_time: deliveryInfo?.time_range || "7:00 AM - 10:00 AM",
          estimated_delivery_date: deliveryInfo?.delivery_date || "",
          location: fullAddress,
          weekly_total_cost: Number(grandTotal),
          schedule: schedulePayload,
        });

        if (createRes.data?.status === "success") {
          const subDbId = createRes.data.id;

          if (paymentMethod === "wallet") {
            // Deduct via wallet or verify
            handleSuccess(subDbId);
          }
        } else {
          Alert.alert(
            "Subscription Error",
            createRes.data?.message || "Failed to create subscription.",
          );
          setIsProcessing(false);
        }
      } else {
        // 🔥 STANDARD ONE-TIME ORDER CHECKOUT
        const payload = {
          user_id: user?.id ? Number(user.id) : null,
          customer_name: user?.name || "Customer",
          phone: phone,
          address: fullAddress,
          total_amount: Number(grandTotal),
          delivery_fee: Number(deliveryFee),
          payment_method: paymentMethod,
          delivery_time: deliveryInfo?.time_range || "7:00 AM - 10:00 AM",
          estimated_delivery_date: deliveryInfo?.delivery_date || "",
          items: safeItems.map((item) => ({
            id: Number(item.id || 0),
            variant_id: null,
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
          })),
        };

        const orderRes = await api.post("/api/orders/verify.php", payload);

        if (orderRes.data?.status === "success") {
          handleSuccess(orderRes.data.order_id);
        } else {
          Alert.alert(
            "Order Failed",
            orderRes.data?.message || "Could not create order.",
          );
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      console.error("Checkout Error:", error.response?.data || error);
      Alert.alert(
        "Checkout Failed",
        "Something went wrong while processing your order.",
      );
      setIsProcessing(false);
    }
  };

  const handleSuccess = (orderId: string | number) => {
    setIsProcessing(false);
    placeOrder(grandTotal, paymentMethod);

    if (Platform.OS === "web") {
      alert(`Order Confirmed! 🎉 Order #${orderId} placed successfully.`);
      router.replace("/(tabs)/orders");
    } else {
      Alert.alert(
        "Order Confirmed! 🎉",
        `Your order #${orderId} has been placed successfully.`,
        [
          {
            text: "View Orders",
            onPress: () => router.replace("/(tabs)/orders"),
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          disabled={isProcessing}
        >
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        <View style={styles.addressSectionHeader}>
          <Text style={styles.sectionTitle}>Delivery Address *</Text>
          <TouchableOpacity onPress={() => setShowAddressModal(true)} style={styles.addBtn}>
            <Feather name="plus" size={16} color={COLORS.primary} />
            <Text style={styles.addBtnText}>New Address</Text>
          </TouchableOpacity>
        </View>

        {isLoadingAddresses ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : savedAddresses.length === 0 ? (
          <View style={styles.emptyAddressCard}>
            <Feather name="map-pin" size={32} color="#ccc" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyAddressTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyAddressSub}>Add a delivery location to checkout.</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)} style={styles.addAddressBigBtn}>
              <Text style={styles.addAddressBigBtnText}>+ Add New Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: SPACING.m, paddingBottom: SPACING.m }}>
            {savedAddresses.map((addr: any) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.savedAddressCard,
                  selectedAddressId === addr.id && styles.savedAddressCardActive
                ]}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <View style={styles.addressIconWrapper}>
                  <Feather 
                    name={addr.label.toLowerCase().includes('home') ? 'home' : addr.label.toLowerCase().includes('work') ? 'briefcase' : 'map-pin'} 
                    size={20} 
                    color={selectedAddressId === addr.id ? COLORS.primary : "#666"} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, selectedAddressId === addr.id && { color: COLORS.primary }]}>
                    {addr.label}
                  </Text>
                  <Text style={styles.addressDetail} numberOfLines={2}>{addr.address}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleDeleteAddress(addr.id)}
                    style={{ padding: 4 }}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                  
                  <View style={[styles.radioCircle, selectedAddressId === addr.id && styles.radioCircleActive]}>
                    {selectedAddressId === addr.id && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>
          Order Summary ({safeItems.length} Items)
        </Text>
        <View style={styles.card}>
          {safeItems.map((item, index) => (
            <View
              key={item.cartItemId || index.toString()}
              style={styles.summaryItem}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.summaryImage} 
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.summaryQty}>
                  Qty: {item.quantity} {item.size ? `• ${item.size}` : ""}
                  {item.plan ? `\n${item.plan}` : ""}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>
                NPR {(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.paymentOption}
            activeOpacity={0.7}
            onPress={() => setPaymentMethod("wallet")}
            disabled={isProcessing}
          >
            <View style={styles.paymentLeft}>
              <Ionicons
                name="wallet"
                size={24}
                color={paymentMethod === "wallet" ? COLORS.primary : "#666"}
              />
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.paymentName,
                    paymentMethod === "wallet" && { color: COLORS.primary },
                  ]}
                >
                  Wallet Balance
                </Text>
                <Text style={styles.paymentSub}>
                  Available: NPR {safeWalletBalance.toLocaleString()}
                </Text>
                {!isWalletSufficient && paymentMethod === "wallet" && (
                  <Text style={{ fontSize: 11, color: "red", marginTop: 2, fontWeight: "600" }}>
                    Insufficient Balance (Tap to Top Up)
                  </Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                paymentMethod === "wallet" && styles.radioCircleActive,
              ]}
            >
              {paymentMethod === "wallet" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {!hasSubscriptionItems && (
            <TouchableOpacity
              style={styles.paymentOption}
              activeOpacity={0.7}
              onPress={() => setPaymentMethod("cod")}
              disabled={isProcessing}
            >
              <View style={styles.paymentLeft}>
                <MaterialCommunityIcons
                  name="cash"
                  size={24}
                  color={paymentMethod === "cod" ? COLORS.primary : "#666"}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.paymentName,
                      paymentMethod === "cod" && { color: COLORS.primary },
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                  <Text style={styles.paymentSub}>Pay when you receive</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === "cod" && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === "cod" && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Bill Details</Text>
        <View style={styles.card}>
          {/* Promotional Banner */}
          {isOfferActive ? (
            qualifiesFreeDelivery ? (
              <View style={styles.checkoutPromoBannerSuccess}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 20, marginRight: 8, marginTop: 1 }}>🎉</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkoutPromoSuccessTitle}>
                      <Text style={{ fontWeight: "900" }}>{offerName} Applied:</Text> You got{" "}
                      <Text style={{ fontWeight: "900" }}>FREE Delivery</Text> on orders over NPR {offerThreshold}{" "}
                      (<Text style={{ textDecorationLine: "line-through", color: "#047857" }}>NPR {originalThreshold}</Text>)!
                    </Text>
                    {rawDeliveryFee > 0 && (
                      <Text style={styles.checkoutPromoSuccessSavings}>
                        (Saved NPR {rawDeliveryFee.toLocaleString()})
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.checkoutPromoBannerPending}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 20, marginRight: 8, marginTop: 1 }}>🎁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkoutPromoPendingTitle}>
                      <Text style={{ fontWeight: "900" }}>{offerName}:</Text> Add{" "}
                      <Text style={{ fontWeight: "900", color: "#B45309" }}>
                        NPR {amountNeeded.toLocaleString()}
                      </Text>{" "}
                      more to unlock <Text style={{ fontWeight: "900" }}>FREE Delivery</Text>! (Special:{" "}
                      <Text style={{ textDecorationLine: "line-through", color: "#9CA3AF" }}>
                        NPR {originalThreshold}
                      </Text>{" "}
                      <Text style={{ fontWeight: "900", color: "#B45309" }}>
                        NPR {offerThreshold}
                      </Text>).
                    </Text>
                  </View>
                </View>
              </View>
            )
          ) : (
            safeTotal < originalThreshold ? (
              <View style={{ backgroundColor: '#F0F9FF', padding: 10, borderRadius: RADIUS.medium, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="info" size={14} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={{ color: '#0369A1', fontSize: 12, fontWeight: '700' }}>
                  Free delivery on orders above Rs. {originalThreshold}
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#ECFDF5', padding: 10, borderRadius: RADIUS.medium, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="check-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
                <Text style={{ color: '#047857', fontSize: 12, fontWeight: '700' }}>
                  Free delivery unlocked!
                </Text>
              </View>
            )
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>
              NPR {safeTotal.toLocaleString()}
            </Text>
          </View>
          <View style={{ marginVertical: 2 }}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>
                {qualifiesFreeDelivery
                  ? "Delivery Fee"
                  : distanceInKm > 0
                  ? `Delivery Fee (${distanceInKm} km @ NPR ${feePerKm}/km)`
                  : `Delivery Fee (@ NPR ${feePerKm}/km)`}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {qualifiesFreeDelivery ? (
                  <>
                    {rawDeliveryFee > 0 && (
                      <Text style={styles.strikethroughFee}>
                        NPR {rawDeliveryFee.toLocaleString()}
                      </Text>
                    )}
                    <Text style={styles.freeFeeText}>FREE</Text>
                  </>
                ) : (
                  <Text style={styles.billValue}>
                    {distanceInKm > 0 ? `NPR ${deliveryFee.toLocaleString()}` : "Select Address"}
                  </Text>
                )}
              </View>
            </View>
            {qualifiesFreeDelivery && (
              <View style={styles.offerAppliedTag}>
                <Feather name="check" size={12} color="#047857" style={{ marginRight: 4 }} />
                <Text style={styles.offerAppliedTagText}>
                  {isOfferActive ? `✓ ${offerName} Free Delivery Applied` : "✓ Free Delivery Applied"}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.divider, { marginVertical: 12 }]} />
          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>
              NPR {grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            {qualifiesFreeDelivery && (
              <View style={styles.freeBadgePill}>
                <Text style={styles.freeBadgePillText}>FREE DELIVERY</Text>
              </View>
            )}
          </View>
          <Text style={styles.totalPrice}>
            NPR {grandTotal.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            isCheckoutDisabled && { opacity: 0.5, backgroundColor: "#A0A0A0" },
          ]}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
          disabled={isCheckoutDisabled}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.checkoutText}>
                {needsTopUp 
                  ? "Top Up Wallet" 
                  : hasSubscriptionItems 
                  ? "Confirm Subscription" 
                  : "Place Order"}
              </Text>
              <Feather name={needsTopUp ? "plus-circle" : "check-circle"} size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <AddAddressModal 
        visible={showAddressModal} 
        onClose={() => setShowAddressModal(false)}
        onSuccess={() => {
          setShowAddressModal(false);
          fetchAddresses();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
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
  content: { padding: SPACING.m },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    marginLeft: 4,
    marginTop: SPACING.m,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: SPACING.s,
  },
  inputFieldBlock: { marginBottom: 12 },
  inputRowBlock: { flexDirection: "row", justifyContent: "space-between" },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  inputBox: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: RADIUS.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  summaryItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  summaryImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.small,
    backgroundColor: "#F8F8F8",
    marginRight: 12,
  },
  summaryDetails: { flex: 1 },
  summaryName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  summaryQty: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    lineHeight: 15,
  },
  summaryPrice: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  paymentLeft: { flexDirection: "row", alignItems: "center" },
  paymentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  paymentSub: { fontSize: 12, color: "#666", fontWeight: "500" },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: { borderColor: COLORS.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 12 },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  billLabel: { fontSize: 14, color: "#666", fontWeight: "600" },
  billValue: { fontSize: 14, color: "#1A1A1A", fontWeight: "700" },
  grandTotalLabel: { fontSize: 16, color: "#1A1A1A", fontWeight: "900" },
  grandTotalValue: { fontSize: 18, color: COLORS.primary, fontWeight: "900" },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: SPACING.m,
    paddingBottom: Platform.OS === "ios" ? 0 : SPACING.m,
    borderTopWidth: 1,
    borderColor: "#EAEAEA",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    backgroundColor: COLORS.primary,
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
  searchOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  searchIconBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderLeftWidth: 1,
    borderLeftColor: '#EAEAEA'
  },
  searchResultsDropdown: {
    backgroundColor: '#FFF',
    marginTop: 8,
    borderRadius: RADIUS.medium,
    maxHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchResultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  searchResultText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500'
  },
  mapHintBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  mapHintText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A'
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    gap: 8
  },
  successAlertText: {
    color: '#065f46',
    fontWeight: '800',
    fontSize: 13
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    gap: 10
  },
  errorAlertTitle: {
    color: '#991b1b',
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  errorAlertText: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 18
  },
  addressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
    marginTop: SPACING.m,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  emptyAddressCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    marginBottom: SPACING.m,
  },
  emptyAddressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emptyAddressSub: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  addAddressBigBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
  },
  addAddressBigBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginRight: SPACING.m,
    width: 280,
  },
  savedAddressCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF0F0',
  },
  addressIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  addressDetail: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  checkoutPromoBannerSuccess: {
    backgroundColor: "#ECFDF5",
    borderRadius: RADIUS.medium,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  checkoutPromoSuccessTitle: {
    color: "#065F46",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  checkoutPromoSuccessSavings: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "800",
    fontStyle: "italic",
    marginTop: 3,
  },
  checkoutPromoBannerPending: {
    backgroundColor: "#FFFBEB",
    borderRadius: RADIUS.medium,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  checkoutPromoPendingTitle: {
    color: "#78350F",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  strikethroughFee: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
    fontSize: 13,
    marginRight: 6,
    fontWeight: "600",
  },
  freeFeeText: {
    color: "#059669",
    fontWeight: "900",
    fontSize: 14,
  },
  offerAppliedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  offerAppliedTagText: {
    color: "#047857",
    fontSize: 11,
    fontWeight: "800",
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
