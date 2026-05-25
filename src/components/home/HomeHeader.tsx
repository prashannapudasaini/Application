import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext"; // 🔥 1. Import your Cart Context

export default function HomeHeader() {
  const router = useRouter();

  // 🔥 2. Pull the live data from the global engine
  const { items, walletBalance } = useCart();

  // 🔥 3. Calculate exactly how many items are in the cart
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Top Row: Logo & Actions (Cart + Wallet) */}
      <View style={styles.topRow}>
        {/* Left Side: Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right Side: Cart & Wallet */}
        <View style={styles.actionsContainer}>
          {/* Cart Icon - Navigates to /cart */}
          <TouchableOpacity
            style={styles.cartButton}
            activeOpacity={0.8}
            onPress={() => router.push("/cart")}
          >
            <Feather name="shopping-cart" size={22} color={COLORS.text} />

            {/* 🔥 4. Only show the badge if there is at least 1 item in the cart */}
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Wallet Pill - Navigates to /wallet */}
          <TouchableOpacity
            style={styles.walletPill}
            activeOpacity={0.8}
            onPress={() => router.push("/wallet")}
          >
            <Ionicons name="wallet-outline" size={14} color={COLORS.primary} />
            {/* 🔥 5. Dynamic Wallet Balance */}
            <Text style={styles.walletText}>
              NPR {walletBalance.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={18}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search for milk, paneer, ghee..."
          style={styles.searchInput}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  cartButton: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  walletPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  walletText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: SPACING.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
});