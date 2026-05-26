import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

// 🔥 1. Define props so the Home Screen can control the search text
interface HomeHeaderProps {
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
}

export default function HomeHeader({
  searchQuery = "",
  onSearchChange,
}: HomeHeaderProps) {
  const router = useRouter();
  const { items, walletBalance } = useCart();

  // Safety check to ensure items array exists before reducing
  const safeItems = items || [];
  const cartItemCount = safeItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cartButton}
            activeOpacity={0.8}
            onPress={() => router.push("/cart")}
          >
            <Feather name="shopping-cart" size={22} color={COLORS.text} />
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletPill}
            activeOpacity={0.8}
            onPress={() => router.push("/wallet")}
          >
            <Ionicons name="wallet-outline" size={14} color={COLORS.primary} />
            <Text style={styles.walletText}>
              {/* 🔥 FIX: Added safety fallback to prevent undefined crash */}
              NPR {(walletBalance || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={18}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search for milk, paneer, ghee..."
          // 🔥 2. Bind the input to the props passed from HomeScreen
          value={searchQuery}
          onChangeText={onSearchChange}
          style={[
            styles.searchInput,
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
          ]}
          placeholderTextColor={COLORS.textSecondary}
          clearButtonMode="while-editing" // Adds a handy 'x' button on iOS to clear search
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
    fontWeight: "normal",
  },
});
