import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
  category?: string;
  stock?: number;
  stock_quantity?: number;
  variants?: Array<{
    stock_quantity?: number;
  }>;
}

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();

  // Unified fallback array checking
  const activeItems = items || [];

  // Match items correctly by evaluating whether a cartItemId string or standard id is present
  const cartItem = activeItems.find(
    (item: any) => item.id === product.id || item.cartItemId === product.id
  );

  const quantity = cartItem ? cartItem.quantity : 0;

  // Dynamic resolution tracking identifier 
  const itemKey = cartItem?.cartItemId || cartItem?.id || product.id;

  const fullImageUrl = getImageUrl(product.image);

  const totalStock =
    product.variants && product.variants.length > 0
      ? product.variants.reduce(
        (acc, v) => acc + parseInt(String(v.stock_quantity || 0), 10),
        0
      )
      : parseInt(String(product.stock ?? product.stock_quantity ?? 0), 10);

  let activePrice = product.price;
  let cutPrice: number | null = (product as any).original_price || null;

  if (product.variants && product.variants.length > 0) {
    const cheapestVariant = product.variants.reduce((prev: any, curr: any) => {
      const prevPrice = Number(prev.price_npr || 0);
      const currPrice = Number(curr.price_npr || 0);
      if (prevPrice === 0) return curr;
      if (currPrice === 0) return prev;
      return prevPrice < currPrice ? prev : curr;
    }, product.variants[0]);
    if (cheapestVariant) {
      activePrice = Number(cheapestVariant.price_npr || product.price);
      cutPrice = cheapestVariant.original_price ? Number(cheapestVariant.original_price) : null;
    }
  }

  const showDiscount = cutPrice !== null && cutPrice > activePrice;
  const discountPercent = showDiscount ? Math.round(((cutPrice! - activePrice) / cutPrice!) * 100) : 0;

  const isOutOfStock = totalStock <= 0;
  const isUnavailable = isOutOfStock;

  const handleDecrement = () => {
    if (quantity <= 1) {
      if (removeFromCart) {
        removeFromCart(itemKey);
      }
    } else {
      updateQuantity(itemKey, quantity - 1);
    }
  };

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  const handleIncrement = () => {
    if (quantity >= totalStock) return;
    updateQuantity(itemKey, quantity + 1);
  };

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        router.push({
          pathname: `/product/${product.id}` as any,
          params: {
            name: product.name,
            image: fullImageUrl,
          },
        })
      }
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.imageContainer, isUnavailable && styles.unavailableImage]}>
          {!fullImageUrl ? (
            <View style={styles.fallbackBox}>
              <Feather name="image" size={32} color="#D3D3D3" />
            </View>
          ) : Platform.OS === "web" ? (
            <img
              src={fullImageUrl}
              alt={product.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: isUnavailable ? 0.5 : 1,
              }}
            />
          ) : (
            <Image
              source={{ uri: fullImageUrl }}
              style={styles.productImage}
              contentFit="contain"
              transition={300}
              cachePolicy="memory-disk"
            />
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.productSize}>{product.size}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>NPR {activePrice}</Text>
            {showDiscount && (
              <View style={styles.discountRow}>
                <Text style={[styles.cutPriceText, { color: "#E2B254" }]}>NPR {cutPrice}</Text>
                <Text style={[styles.discountPercentText, { color: "#E2B254" }]}>-{discountPercent}%</Text>
              </View>
            )}
          </View>

          {isUnavailable ? (
            <View style={styles.unavailableBadge}>
              <Text
                style={styles.unavailableText}
                numberOfLines={1}
              >
                Out of Stock
              </Text>
            </View>
          ) : quantity === 0 ? (
            <TouchableWithoutFeedback
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              onPress={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  size: product.size,
                })
              }
            >
              <Animated.View style={[styles.addButton, { transform: [{ scale: buttonScale }] }]}>
                <Feather name="plus" size={16} color="#FFF" />
              </Animated.View>
            </TouchableWithoutFeedback>
          ) : (
            <View style={styles.counterPill}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={styles.counterBtn}
              >
                <Feather name="minus" size={14} color={COLORS.card} />
              </TouchableOpacity>

              <Text style={styles.counterText}>{quantity}</Text>

              <TouchableOpacity
                onPress={handleIncrement}
                style={styles.counterBtn}
              >
                <Feather name="plus" size={14} color={COLORS.card} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.s,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    height: 120,
    width: "100%",
    padding: SPACING.s,
    marginBottom: SPACING.s,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableImage: {
    opacity: 0.55,
  },
  productImage: { width: "100%", height: "100%" },
  fallbackBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#F9F9F9",
    borderRadius: RADIUS.small,
  },
  detailsContainer: { marginBottom: SPACING.s },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  productSize: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  priceContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  priceText: { fontSize: 15, fontWeight: "900", color: "#800000" },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  cutPriceText: {
    fontSize: 11,
    color: "#888",
    textDecorationLine: "line-through",
  },
  discountPercentText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    height: 28,
    paddingHorizontal: 4,
  },
  counterBtn: {
    paddingHorizontal: 6,
    height: "100%",
    justifyContent: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
    marginHorizontal: 4,
  },
  unavailableBadge: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    maxWidth: "55%",
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  curdBadge: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  curdText: {
    color: "#B45309",
  },
});