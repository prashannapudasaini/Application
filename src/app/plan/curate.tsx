import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "../../components/MapComponent";
import { getImageUrl } from "../../constants/api";
import { COLORS, SPACING } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HUBS = [
  { name: 'Patan', latitude: 27.6742, longitude: 85.3181 },
  { name: 'Kuleshwor', latitude: 27.6970, longitude: 85.2970 }
];
const MAX_RADIUS_KM = 5;
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Haversine formula
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function CuratePlanScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- WIZARD STATES ---
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [activeDayTab, setActiveDayTab] = useState("");
  const [basket, setBasket] = useState<Record<string, Record<string, number>>>({});

  // --- 3 LINES (6 ITEMS) PAGINATION STATE ---
  const [visibleCount, setVisibleCount] = useState(6);

  // --- LOCATION STATES ---
  const [detailedAddress, setDetailedAddress] = useState(user?.address || "");
  const [landmark, setLandmark] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");

  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState({ available: false, fee: 0, distance: 0, hasChecked: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/products/index.php");
      if (res.data?.status === "success") {
        const formattedProducts = res.data.data.map((p: any) => {
          let cheapestVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
          if (p.variants && p.variants.length > 0) {
            cheapestVariant = p.variants.reduce((prev: any, curr: any) => {
              const prevPrice = Number(prev.price_npr || 0);
              const currPrice = Number(curr.price_npr || 0);
              if (prevPrice === 0) return curr;
              if (currPrice === 0) return prev;
              return prevPrice < currPrice ? prev : curr;
            }, p.variants[0]);
          }
          const lowestPrice = cheapestVariant ? parseFloat(cheapestVariant.price_npr) : parseFloat(p.price || 0);
          const originalPrice = cheapestVariant?.original_price ? parseFloat(cheapestVariant.original_price) : (p.original_price ? parseFloat(p.original_price) : null);

          const totalStock =
            p.variants && p.variants.length > 0
              ? p.variants.reduce(
                (acc: number, v: any) => acc + parseInt(String(v.stock_quantity || 0), 10),
                0
              )
              : parseInt(String(p.stock ?? p.stock_quantity ?? 0), 10);

          return {
            id: String(p.id),
            name: p.name,
            category: p.category || "",
            size: p.variants?.[0]?.size || "Standard",
            price: lowestPrice,
            original_price: originalPrice,
            stock: totalStock,
            img: getImageUrl(p.image),
          };
        });
        // --- REVERSE PRODUCTS SO LATEST UPLOADED ARE AT THE TOP ---
        setProducts(formattedProducts.reverse());
      }
    } catch (error) {
      console.error("Failed to load catalog", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter non-curd products for subscription grid
  const availableSubscriptionProducts = useMemo(() => {
    return products;
  }, [products]);

  const displayedProducts = useMemo(() => {
    return availableSubscriptionProducts.slice(0, visibleCount);
  }, [availableSubscriptionProducts, visibleCount]);

  const handlePlanSelect = (selectedPlan: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlan(selectedPlan);
    setBasket({});

    if (selectedPlan === "daily") {
      setSelectedDays(DAYS_OF_WEEK);
      setActiveDayTab("Monday");
      setStep(2);
    } else if (selectedPlan === "weekly") {
      setSelectedDays(["Tuesday", "Friday"]);
      setActiveDayTab("Tuesday");
      setStep(2);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setBasket(prev => {
      const currentDayBasket = prev[activeDayTab] || {};
      const currentQty = currentDayBasket[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newDayBasket = { ...currentDayBasket };

      if (newQty === 0) delete newDayBasket[productId];
      else newDayBasket[productId] = newQty;

      return { ...prev, [activeDayTab]: newDayBasket };
    });
  };

  const copyToAllDays = () => {
    const currentDayBasket = basket[activeDayTab];
    if (!currentDayBasket || Object.keys(currentDayBasket).length === 0) {
      Alert.alert("Empty Day", "Add some items to this day first!");
      return;
    }
    const newBasket = { ...basket };
    selectedDays.forEach(day => { newBasket[day] = { ...currentDayBasket }; });
    setBasket(newBasket);
    Alert.alert("Success", "Copied to all selected days!");
  };

  // --- GIS LOGIC ---
  const checkDeliveryZone = (lat: number, lng: number) => {
    setUserLocation({ latitude: lat, longitude: lng });
    let shortestDistance = Infinity;
    HUBS.forEach((hub) => {
      const distance = getDistanceKm(lat, lng, hub.latitude, hub.longitude);
      if (distance < shortestDistance) shortestDistance = distance;
    });

    if (shortestDistance <= MAX_RADIUS_KM) {
      setDeliveryInfo({ available: true, fee: 0, distance: Number(shortestDistance.toFixed(1)), hasChecked: true });
    } else {
      setDeliveryInfo({ available: false, fee: 0, distance: Number(shortestDistance.toFixed(1)), hasChecked: true });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=27.7172&lon=85.3240&limit=8`);
      const data = await res.json();
      const formattedResults = data.features.map((feature: any) => {
        const props = feature.properties;
        const nameParts = [props.name, props.street, props.district, props.city, props.state].filter(Boolean);
        return {
          display_name: Array.from(new Set(nameParts)).join(', '),
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0]
        };
      }).filter((res: any) => res.display_name);
      setSearchResults(formattedResults);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setIsSearchingMap(false);
  };

  const selectSearchResult = (result: any) => {
    checkDeliveryZone(result.lat, result.lon);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);
    mapRef.current?.animateToRegion({
      latitude: result.lat, longitude: result.lon, latitudeDelta: 0.02, longitudeDelta: 0.02,
    }, 1000);
  };

  // --- MATH & PRICING RULES ---
  const { dayCosts, weeklyCost, subTotal, discountAmount, finalCost } = useMemo(() => {
    let baseWeeklyCost = 0;
    const dayCostsMap: Record<string, number> = {};

    selectedDays.forEach(day => {
      let dailyTotal = 0;
      const dayItems = basket[day] || {};
      Object.entries(dayItems).forEach(([prodId, qty]) => {
        const prod = products.find(p => String(p.id) === String(prodId));
        if (prod) dailyTotal += (prod.price * qty);
      });
      dayCostsMap[day] = dailyTotal;
      baseWeeklyCost += dailyTotal;
    });

    const multiplier = 4; // 4 weeks
    const sub = baseWeeklyCost * multiplier;
    let discount = 0;
    if (plan === "daily") discount = sub * 0.05;

    return {
      dayCosts: dayCostsMap, weeklyCost: baseWeeklyCost, subTotal: sub, discountAmount: discount, finalCost: sub - discount
    };
  }, [selectedDays, basket, products, plan]);

  const isDailyMinMet = plan === "daily" ? finalCost >= 10000 : true;
  const isWeeklyMinMet = plan === "weekly" ? ((dayCosts["Tuesday"] || 0) >= 500 && (dayCosts["Friday"] || 0) >= 500) : true;
  const isBasketValid = useMemo(() => {
    if (selectedDays.length === 0) return false;
    const hasItemsEveryday = selectedDays.every(day => {
      return Object.values(basket[day] || {}).reduce((sum, qty) => sum + qty, 0) > 0;
    });
    return hasItemsEveryday && isDailyMinMet && isWeeklyMinMet;
  }, [selectedDays, basket, isDailyMinMet, isWeeklyMinMet]);

  const isAddressValid = Platform.OS === 'web'
    ? detailedAddress.trim() && phone.trim()
    : deliveryInfo.available && detailedAddress.trim() && phone.trim() && userLocation;

  const handleConnectIPSCheckout = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to subscribe.");
      return router.replace("/auth/login");
    }
    if (!isBasketValid || !isAddressValid) {
      Alert.alert("Incomplete", "Please complete all requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanWeeklySchedule = selectedDays.map(day => {
        const itemsForDay: any[] = [];
        Object.entries(basket[day] || {}).forEach(([productId, qty]) => {
          if (qty > 0) {
            const product = products.find(p => String(p.id) === String(productId));
            if (product) itemsForDay.push({ id: product.id, name: product.name, price: product.price, qty, size: product.size });
          }
        });
        return { day, items: itemsForDay };
      });

      const locationPrefix = userLocation ? `[GPS: ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}] ` : "";
      const fullAddress = `${locationPrefix}${detailedAddress.trim()}${landmark.trim() ? ` (Landmark: ${landmark.trim()})` : ""}`;

      const createRes = await api.post("/api/orders/create_sub.php", {
        user_id: user.id ? Number(user.id) : null,
        plan_type: plan,
        delivery_time: "morning",
        location: fullAddress,
        phone: phone,
        weekly_total_cost: finalCost,
        schedule: cleanWeeklySchedule
      });

      if (createRes.data?.status !== "success") {
        Alert.alert("Error", "Failed to create subscription record.");
        setIsSubmitting(false); return;
      }

      const subDbId = createRes.data.id;
      const connectIpsRes = await api.post("/api/orders/init_connectips.php", {
        amount: Number(finalCost), purchase_id: `SUB_${subDbId}`
      });

      if (connectIpsRes.data?.success) {
        if (Platform.OS === "web") {
          const { gatewayUrl, payload } = connectIpsRes.data;
          const form = document.createElement("form");
          form.setAttribute("method", "POST");
          form.setAttribute("action", gatewayUrl);
          for (const key in payload) {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", payload[key]);
            form.appendChild(hiddenField);
          }
          document.body.appendChild(form);
          form.submit();
        } else {
          Alert.alert("Coming Soon", "Mobile WebView payment gateway will open here.");
          setIsSubmitting(false);
        }
      } else {
        Alert.alert("Gateway Error", connectIpsRes.data?.message || "Failed to initialize connectIPS.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Payment Error", "Gateway connection failed.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002147" />
        <Text style={{ marginTop: 10, color: "#002147", fontWeight: "bold" }}>Loading Farm Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Curate Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* STEP 1: PLAN */}
        <View style={[styles.card, step === 1 ? styles.activeCard : styles.inactiveCard]}>
          <TouchableOpacity style={styles.stepHeader} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(1); }} activeOpacity={0.8}>
            <View style={[styles.stepCircle, step === 1 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step === 1 && styles.activeStepNumber]}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Plan Type</Text>
            {step > 1 && <Text style={styles.stepPreview}>{plan.replace('_', ' ')} Plan</Text>}
          </TouchableOpacity>

          {step === 1 && (
            <View style={styles.planGrid}>
              <TouchableOpacity onPress={() => router.push("/(tabs)/products")} style={styles.planOption}>
                <Feather name="shopping-bag" size={24} color="#666" style={{ marginBottom: 8 }} />
                <Text style={styles.planOptionTitle}>One-Time Buy</Text>
                <Text style={styles.planOptionSub}>Standard single delivery.</Text>
                <Text style={styles.planOptionBadge}>Go to Shop →</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePlanSelect("daily")} style={[styles.planOption, plan === "daily" && styles.planOptionActive]}>
                <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>5% OFF</Text></View>
                <Feather name="calendar" size={24} color={plan === "daily" ? COLORS.primary : "#666"} style={{ marginBottom: 8 }} />
                <Text style={[styles.planOptionTitle, plan === "daily" && { color: COLORS.primary }]}>Daily Package</Text>
                <Text style={styles.planOptionSub}>30 Deliveries • 1 Month</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePlanSelect("weekly")} style={[styles.planOption, plan === "weekly" && styles.planOptionActive]}>
                <View style={[styles.offerBadge, { backgroundColor: "#DBEAFE" }]}><Text style={[styles.offerBadgeText, { color: "#1E3A8A" }]}>FREE DELIVERY</Text></View>
                <MaterialCommunityIcons name="calendar-week" size={24} color={plan === "weekly" ? COLORS.primary : "#666"} style={{ marginBottom: 8 }} />
                <Text style={[styles.planOptionTitle, plan === "weekly" && { color: COLORS.primary }]}>Weekly Package</Text>
                <Text style={styles.planOptionSub}>8 Deliveries • Tue & Fri</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* STEP 2: BUILD BASKET */}
        <View style={[styles.card, step === 2 ? styles.activeCard : styles.inactiveCard]}>
          <TouchableOpacity style={styles.stepHeader} onPress={() => { if (plan) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(2); } }} activeOpacity={0.8} disabled={!plan}>
            <View style={[styles.stepCircle, step === 2 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step === 2 && styles.activeStepNumber]}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Build Basket</Text>
          </TouchableOpacity>

          {step === 2 && (
            <View style={styles.stepContent}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                {selectedDays.map(day => {
                  const hasItems = Object.keys(basket[day] || {}).length > 0;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setActiveDayTab(day)}
                      style={[styles.dayTab, activeDayTab === day ? styles.dayTabActive : hasItems ? styles.dayTabHasItems : null]}
                    >
                      <Text style={[styles.dayTabText, activeDayTab === day ? styles.dayTabTextActive : hasItems ? styles.dayTabTextHasItems : null]}>{day}</Text>
                      {hasItems && <Feather name="check-circle" size={12} color={activeDayTab === day ? "#FFF" : "#10B981"} style={{ marginLeft: 6 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.copyBox}>
                <Text style={styles.copyBoxText}>Adding items for: <Text style={{ color: "#9e111a", fontWeight: "900" }}>{activeDayTab}</Text></Text>
                {selectedDays.length > 1 && (
                  <TouchableOpacity onPress={copyToAllDays} style={styles.copyBtn}>
                    <Feather name="copy" size={12} color={COLORS.primary} />
                    <Text style={styles.copyBtnText}>Copy to All Days</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* --- REVERSED 3-LINE (6 ITEMS) PRODUCTS GRID --- */}
              <View style={styles.productsGrid}>
                {displayedProducts.map((product) => {
                  const qty = basket[activeDayTab]?.[product.id] || 0;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <View
                      key={product.id}
                      style={[
                        styles.productCard,
                        qty > 0 && styles.productCardActive,
                        isOutOfStock && { opacity: 0.55 },
                      ]}
                    >
                      <Image
                        source={{ uri: product.img }}
                        style={styles.productImg}
                        contentFit="contain"
                        transition={300}
                        cachePolicy="memory-disk"
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>
                          NPR {product.price}
                        </Text>
                        {product.original_price && product.original_price > product.price && (
                          <View style={styles.discountRow}>
                            <Text style={styles.cutPriceText}>NPR {product.original_price}</Text>
                            <Text style={styles.discountPercentText}>
                              -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                            </Text>
                          </View>
                        )}
                      </View>

                      {isOutOfStock ? (
                        <View
                          style={[
                            styles.addBtn,
                            { backgroundColor: "#E2E8F0" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.addBtnText,
                              { color: "#64748B" },
                            ]}
                          >
                            OUT OF STOCK
                          </Text>
                        </View>
                      ) : qty === 0 ? (
                        <TouchableOpacity
                          onPress={() => updateQuantity(product.id, 1)}
                          style={styles.addBtn}
                        >
                          <Text style={styles.addBtnText}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity
                            onPress={() => updateQuantity(product.id, -1)}
                            style={styles.qtyActionBtn}
                          >
                            <Feather name="minus" size={14} color="#FFF" />
                          </TouchableOpacity>
                          <Text style={styles.qtyActionText}>{qty}</Text>
                          <TouchableOpacity
                            disabled={qty >= product.stock}
                            onPress={() => updateQuantity(product.id, 1)}
                            style={styles.qtyActionBtn}
                          >
                            <Feather name="plus" size={14} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* --- SHOW MORE / SHOW LESS PAGINATION BUTTON --- */}
              {availableSubscriptionProducts.length > 6 && (
                <TouchableOpacity
                  style={styles.showMoreBtn}
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    if (visibleCount < availableSubscriptionProducts.length) {
                      setVisibleCount(availableSubscriptionProducts.length);
                    } else {
                      setVisibleCount(6);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.showMoreText}>
                    {visibleCount < availableSubscriptionProducts.length
                      ? `Show More (${availableSubscriptionProducts.length - visibleCount} more)`
                      : "Show Less"}
                  </Text>
                  <Feather
                    name={
                      visibleCount < availableSubscriptionProducts.length
                        ? "chevron-down"
                        : "chevron-up"
                    }
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}

              {!isDailyMinMet && plan === 'daily' && (
                <View style={styles.warningAlert}>
                  <Feather name="alert-triangle" size={14} color="#92400E" style={{ marginRight: 6 }} />
                  <Text style={styles.warningAlertText}>Daily value must be ≥ NPR 10,000. Current total: NPR {finalCost.toLocaleString()}</Text>
                </View>
              )}

              {!isWeeklyMinMet && plan === 'weekly' && (
                <View style={styles.warningAlert}>
                  <Feather name="alert-triangle" size={14} color="#92400E" style={{ marginRight: 6 }} />
                  <Text style={styles.warningAlertText}>Weekly requires ≥ NPR 500 on both Tuesday & Friday.</Text>
                </View>
              )}

              <TouchableOpacity style={styles.nextBtn} disabled={!isBasketValid} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(3); }}>
                <Text style={styles.nextBtnText}>Continue to Location</Text>
                <Feather name="arrow-right" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* STEP 3: LOCATION & CHECKOUT */}
        <View style={[styles.card, step === 3 ? styles.activeCard : styles.inactiveCard]}>
          <TouchableOpacity style={styles.stepHeader} onPress={() => { if (isBasketValid) { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStep(3); } }} activeOpacity={0.8} disabled={!isBasketValid}>
            <View style={[styles.stepCircle, step === 3 && styles.activeStepCircle]}>
              <Text style={[styles.stepNumber, step === 3 && styles.activeStepNumber]}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Location & Checkout</Text>
          </TouchableOpacity>

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.label}>Delivery Location *</Text>
              <View style={styles.mapWrapper}>
                <View style={styles.searchOverlay}>
                  <View style={styles.searchInputWrapper}>
                    <TextInput style={styles.searchInput} placeholder="Search area..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} />
                    <TouchableOpacity onPress={handleSearch} style={styles.searchIconBtn}>
                      {isSearchingMap ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Feather name="search" size={18} color="#555" />}
                    </TouchableOpacity>
                  </View>
                  {searchResults.length > 0 && (
                    <View style={styles.searchResultsDropdown}>
                      {searchResults.map((res, index) => (
                        <TouchableOpacity key={index} style={styles.searchResultItem} onPress={() => selectSearchResult(res)}>
                          <Text style={styles.searchResultText} numberOfLines={2}>{res.display_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {Platform.OS === 'web' ? (
                  <View style={{ flex: 1, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ textAlign: 'center', color: '#666', fontWeight: '600' }}>Enter your address manually below.</Text>
                  </View>
                ) : (
                  <MapComponent mapRef={mapRef} hubs={HUBS} maxRadiusKm={MAX_RADIUS_KM} userLocation={userLocation} onPress={(lat, lng) => { checkDeliveryZone(lat, lng); setSearchResults([]); }} />
                )}
                {Platform.OS !== 'web' && !userLocation && (
                  <View style={styles.mapHintBadge}><Feather name="map-pin" size={12} color={COLORS.primary} /><Text style={styles.mapHintText}>Tap map to drop pin</Text></View>
                )}
              </View>

              {deliveryInfo.hasChecked && deliveryInfo.available && (
                <View style={styles.successAlert}><Feather name="check-circle" size={14} color="#10b981" /><Text style={styles.successAlertText}>Service Available in this area!</Text></View>
              )}
              {deliveryInfo.hasChecked && !deliveryInfo.available && Platform.OS !== 'web' && (
                <View style={styles.errorAlert}><Feather name="alert-circle" size={14} color="#ef4444" /><Text style={styles.errorAlertText}>Out of delivery zone. We deliver within {MAX_RADIUS_KM}km.</Text></View>
              )}

              {(deliveryInfo.available || Platform.OS === 'web') && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.label}>Detailed House Address *</Text>
                  <TextInput style={styles.input} value={detailedAddress} onChangeText={setDetailedAddress} placeholder="e.g., House No. 12" />

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Landmark</Text>
                      <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} placeholder="Near Temple" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Phone *</Text>
                      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98XXXXXXXX" />
                    </View>
                  </View>
                </View>
              )}

              {/* TIMING */}
              <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>Timing Route *</Text>
                <View style={styles.timingBox}>
                  <Feather name="sunrise" size={16} color="#002147" />
                  <Text style={styles.timingText}>Morning Delivery (7:00 AM - 10:00 AM)</Text>
                </View>
              </View>

              {/* BILLING */}
              <View style={styles.billBox}>
                <View style={styles.billRow}><Text style={styles.billLabel}>Weekly Base Cost</Text><Text style={styles.billValue}>NPR {weeklyCost.toLocaleString()}</Text></View>
                <View style={styles.billRow}><Text style={styles.billLabel}>Plan Duration</Text><Text style={styles.billValue}>4 Weeks</Text></View>
                <View style={styles.billRow}><Text style={styles.billLabel}>Subtotal</Text><Text style={styles.billValue}>NPR {subTotal.toLocaleString()}</Text></View>
                {discountAmount > 0 && <View style={styles.billRow}><Text style={[styles.billLabel, { color: "#10b981" }]}>5% Discount</Text><Text style={[styles.billValue, { color: "#10b981" }]}>- NPR {discountAmount.toLocaleString()}</Text></View>}
                <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={[styles.billValue, { color: "#10b981" }]}>FREE</Text></View>
                <View style={styles.divider} />
                <View style={styles.billRow}><Text style={styles.grandTotalLabel}>Grand Total</Text><Text style={styles.grandTotalValue}>NPR {finalCost.toLocaleString()}</Text></View>
              </View>

              <TouchableOpacity
                style={[styles.checkoutBtn, (!isAddressValid || isSubmitting) && { opacity: 0.5, backgroundColor: "#A0A0A0" }]}
                onPress={handleConnectIPSCheckout}
                disabled={!isAddressValid || isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Feather name="lock" size={16} color="#FFF" />
                    <Text style={styles.checkoutBtnText}>Pay with connectIPS</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.secureText}>Encrypted and secured by connectIPS.</Text>

            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.m, backgroundColor: "#FAF9F6" },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#002147", flex: 1, textAlign: "center" },
  content: { padding: SPACING.m },

  card: { backgroundColor: "#FFF", borderRadius: 24, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  activeCard: { borderColor: "#002147", elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  inactiveCard: { borderColor: "#EAEAEA", opacity: 0.8 },

  stepHeader: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FAFAFA" },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#EAEAEA", alignItems: "center", justifyContent: "center", marginRight: 12 },
  activeStepCircle: { backgroundColor: "#002147" },
  stepNumber: { fontSize: 14, fontWeight: "900", color: "#999" },
  activeStepNumber: { color: "#E2B254" },
  stepTitle: { fontSize: 16, fontWeight: "900", color: "#1A1A1A", textTransform: "uppercase", letterSpacing: 1 },
  stepPreview: { marginLeft: "auto", fontSize: 12, fontWeight: "800", color: "#9e111a", textTransform: "uppercase" },

  stepContent: { padding: 20, paddingTop: 0 },

  curdNoticeBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  curdNoticeTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#92400E",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  curdNoticeText: {
    fontSize: 11,
    color: "#92400E",
    lineHeight: 16,
  },

  planGrid: { padding: 20, paddingTop: 0, gap: 12 },
  planOption: { padding: 16, borderRadius: 16, borderWidth: 2, borderColor: "#EAEAEA", backgroundColor: "#FFF", alignItems: "center" },
  planOptionActive: { borderColor: "#002147", backgroundColor: "#F8FAFC" },
  planOptionTitle: { fontSize: 16, fontWeight: "900", color: "#1A1A1A", marginBottom: 4 },
  planOptionSub: { fontSize: 12, color: "#666", fontWeight: "600", marginBottom: 8 },
  planOptionBadge: { fontSize: 10, fontWeight: "900", color: "#002147", backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, textTransform: "uppercase" },
  offerBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  offerBadgeText: { color: "#166534", fontSize: 9, fontWeight: "900" },

  daysScroll: { paddingBottom: 12, gap: 8 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: "#EAEAEA", flexDirection: "row", alignItems: "center" },
  dayTabActive: { borderColor: "#002147", backgroundColor: "#002147" },
  dayTabHasItems: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  dayTabText: { fontSize: 12, fontWeight: "900", textTransform: "uppercase", color: "#999" },
  dayTabTextActive: { color: "#FFF" },
  dayTabTextHasItems: { color: "#059669" },

  copyBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#DBEAFE" },
  copyBoxText: { fontSize: 11, fontWeight: "800", color: "#002147", textTransform: "uppercase" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#DBEAFE" },
  copyBtnText: { fontSize: 10, fontWeight: "900", color: "#002147", textTransform: "uppercase" },

  productsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  productCard: { width: "48%", padding: 12, borderRadius: 16, borderWidth: 2, borderColor: "#EAEAEA", alignItems: "center", backgroundColor: "#FFF" },
  productCardActive: { borderColor: "#9e111a", backgroundColor: "#FEF2F2" },
  productImg: { width: 60, height: 60, marginBottom: 8 },
  productName: { fontSize: 12, fontWeight: "800", color: "#1A1A1A", textAlign: "center", marginBottom: 4, minHeight: 32 },
  priceContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  productPrice: { fontSize: 11, fontWeight: "900", color: "#800000" },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  cutPriceText: {
    fontSize: 9,
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  addBtn: { width: "100%", paddingVertical: 8, backgroundColor: "#F1F5F9", borderRadius: 8, alignItems: "center" },
  addBtnText: { fontSize: 11, fontWeight: "900", color: "#002147" },
  qtyControl: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#9e111a", borderRadius: 8, padding: 4 },
  qtyActionBtn: { padding: 6 },
  qtyActionText: { color: "#FFF", fontWeight: "900", fontSize: 14 },

  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 12,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#002147",
    textTransform: "uppercase",
  },

  warningAlert: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: "#FDE68A" },
  warningAlertText: { fontSize: 11, fontWeight: "800", color: "#92400E", flex: 1 },

  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#002147", padding: 16, borderRadius: 16, marginTop: 24 },
  nextBtnText: { color: "#FFF", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },

  label: { fontSize: 11, fontWeight: "900", color: "#666", textTransform: "uppercase", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: "700", color: "#1A1A1A" },

  mapWrapper: { height: 250, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8 },
  searchOverlay: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 },
  searchInputWrapper: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 12, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, overflow: "hidden" },
  searchInput: { flex: 1, padding: 10, fontSize: 12, fontWeight: "600", color: "#1A1A1A" },
  searchIconBtn: { padding: 12, backgroundColor: "#F9FAFB", borderLeftWidth: 1, borderLeftColor: "#F3F4F6", justifyContent: "center" },
  searchResultsDropdown: { backgroundColor: "#FFF", borderRadius: 12, marginTop: 4, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, maxHeight: 150 },
  searchResultItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  searchResultText: { fontSize: 11, color: "#374151" },
  mapHintBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  mapHintText: { fontSize: 10, fontWeight: "800", color: "#1A1A1A" },

  successAlert: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ECFDF5", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#A7F3D0", marginBottom: 12 },
  successAlertText: { fontSize: 11, fontWeight: "800", color: "#065F46" },
  errorAlert: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#FECACA", marginBottom: 12 },
  errorAlertText: { fontSize: 11, fontWeight: "800", color: "#991B1B", flex: 1 },

  timingBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  timingText: { fontSize: 12, fontWeight: "800", color: "#002147" },

  billBox: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#EAEAEA", gap: 8 },
  billRow: { flexDirection: "row", justifyContent: "space-between" },
  billLabel: { fontSize: 12, fontWeight: "800", color: "#666" },
  billValue: { fontSize: 12, fontWeight: "900", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 4 },
  grandTotalLabel: { fontSize: 14, fontWeight: "900", color: "#002147", textTransform: "uppercase" },
  grandTotalValue: { fontSize: 18, fontWeight: "900", color: "#9e111a" },

  checkoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#00519E", padding: 16, borderRadius: 16, marginTop: 20 },
  checkoutBtnText: { color: "#FFF", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  secureText: { fontSize: 10, fontWeight: "700", color: "#999", textAlign: "center", marginTop: 12 },
});