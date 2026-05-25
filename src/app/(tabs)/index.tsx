import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryRow from "../../components/home/CategoryRow";
import HeroBanner from "../../components/home/HeroBanner";
import HomeHeader from "../../components/home/HomeHeader";
import ProductCard from "../../components/home/ProductCard";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

interface FormattedProduct {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
}

export default function HomeScreen() {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation drivers
  const dropAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    fetchProducts();
    triggerMilkDropAnimation();
  }, []);

  const triggerMilkDropAnimation = () => {
    dropAnim.setValue(-60);
    opacityAnim.setValue(0);
    logoScale.setValue(0.8);

    Animated.sequence([
      // 1. Splash / Drop falls down quickly
      Animated.timing(dropAnim, {
        toValue: 15,
        duration: 900,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
      // 2. Logo elements reveal smoothly
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.PRODUCTS);
      const json = await response.json();

      if (json.status === "success") {
        const mappedProducts = json.data.map((item: any) => {
          const firstVariant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
          return {
            id: item.id.toString(),
            name: item.name,
            size: firstVariant ? firstVariant.size : "N/A",
            price: firstVariant ? firstVariant.price_npr : 0,
            image: getImageUrl(item.image),
          };
        });
        setProducts(mappedProducts);
      } else {
        setError("Failed to load products from database.");
      }
    } catch (err) {
      console.error("API Fetch Error:", err);
      setError("Cannot connect to server. Check your WiFi/IP address.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Dynamic Animated Entrance Graphic Overlay */}
      <View style={styles.animationTrack}>
        <Animated.View
          style={[
            styles.milkDrop,
            {
              transform: [{ translateY: dropAnim }],
            },
          ]}
        />
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: logoScale }] }}>
          <Text style={styles.animationSlogan}>Sitaram Freshness Delivered</Text>
        </Animated.View>
      </View>

      <HomeHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <HeroBanner />
        <CategoryRow />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={fetchProducts}>
            <Text style={styles.seeAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#800000" />
            <Text style={styles.loadingText}>Fetching fresh products...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchProducts} style={styles.retryBtn} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  scrollContent: { paddingBottom: 100 },
  
  // Milk drop presentation overlay mechanics
  animationTrack: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  milkDrop: {
    width: 14,
    height: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: "-45deg" }],
    position: "absolute",
    top: 0,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  animationSlogan: {
    fontSize: 11,
    fontWeight: "800",
    color: "#800000",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginHorizontal: SPACING.m,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#1A1A1A" },
  seeAllText: { fontSize: 13, fontWeight: "800", color: "#800000" },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
  },
  centerBox: { padding: SPACING.xl, alignItems: "center", justifyContent: "center", minHeight: 200 },
  loadingText: { marginTop: SPACING.m, color: "#555", fontWeight: "600", fontSize: 14 },
  errorText: { color: "#800000", textAlign: "center", marginBottom: SPACING.m, fontWeight: "600", fontSize: 14 },
  retryBtn: { backgroundColor: "#800000", paddingHorizontal: SPACING.l, paddingVertical: SPACING.s, borderRadius: 8 },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
});