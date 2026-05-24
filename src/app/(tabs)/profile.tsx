import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const USER = {
  name: "Prashant Sharma",
  phone: "+977 980-0000000",
  loyaltyPoints: "2,450",
};

export default function ProfileScreen() {
  const router = useRouter();

  // Unified Functional Menu Configuration List
  const MENU_ITEMS = [
    {
      id: "addresses",
      title: "My Addresses",
      icon: "map-marker-outline",
      color: "#4A90E2",
      onPress: () => Alert.alert('Addresses', 'Loading saved delivery zones...')
    },
    {
      id: "orders",
      title: "My Orders",
      icon: "text-box-check-outline",
      color: "#A11217",
      // Dynamically switches bottom navigation workspace to the Orders Tab view
      onPress: () => router.push('/(tabs)/orders') 
    },
    {
      id: "payments",
      title: "Payment Methods",
      icon: "credit-card-outline",
      color: "#50E3C2",
      onPress: () => Alert.alert('Payment Management', 'Directing to cards/UPI setup...')
    },
    {
      id: "invite",
      title: "Invite Friends",
      icon: "gift-outline",
      color: "#F5A623",
      onPress: () => Alert.alert('Sitaram Referral', 'Your invite code: SITARAM2026')
    },
    {
      id: "support",
      title: "Support Centre",
      icon: "headset",
      color: "#6C5CE7",
      onPress: () => Alert.alert('Customer Care', 'Connecting to real-time live support...')
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          {/* Functional Settings Navigation Button */}
          <TouchableOpacity 
            style={styles.settingsBtn} 
            activeOpacity={0.7}
            onPress={() => router.push('/profile/settings')}
          >
            <Feather name="settings" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Card: User Info */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>P</Text>
            </View>
            <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={() => Alert.alert('Camera', 'Opening native picture uploader...')}>
              <Feather name="camera" size={10} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userPhone}>{USER.phone}</Text>

          <View style={styles.loyaltyBadge}>
            <Ionicons name="star" size={14} color="#F5A623" />
            <Text style={styles.loyaltyText}>
              Gold Member • {USER.loyaltyPoints} pts
            </Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeading}>Your Account</Text>
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;
            
            return (
              <Pressable
                key={item.id}
                style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                android_ripple={{ color: "#f0f0f0" }}
                onPress={item.onPress}
              >
                <View
                  style={[styles.iconBox, { backgroundColor: item.color + "15" }]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Feather name="chevron-right" size={20} color="#C7C7CC" />
              </Pressable>
            );
          })}
        </View>

        {/* Logout System */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.8}
          onPress={() => Alert.alert('Logout', 'Session cleared.')}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.m, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.l },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.text },
  settingsBtn: { padding: SPACING.s, backgroundColor: COLORS.card, borderRadius: RADIUS.round, borderWidth: 1, borderColor: COLORS.border },
  heroCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.large, padding: SPACING.l, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.l },
  avatarWrapper: { position: "relative", marginBottom: SPACING.m },
  avatar: { width: 80, height: 80, borderRadius: RADIUS.round, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#FFF" },
  editBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: COLORS.text, padding: 5, borderRadius: RADIUS.round, borderWidth: 2, borderColor: COLORS.card },
  userName: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  userPhone: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.m },
  loyaltyBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF9E6", paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.round, gap: 6 },
  loyaltyText: { fontSize: 12, fontWeight: "700", color: "#B8860B" },
  menuContainer: { backgroundColor: COLORS.card, borderRadius: RADIUS.large, paddingHorizontal: SPACING.m, paddingTop: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
  sectionHeading: { fontSize: 13, fontWeight: "900", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: SPACING.s },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.m },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.medium, justifyContent: "center", alignItems: "center", marginRight: SPACING.m },
  menuTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.text },
  logoutBtn: { marginTop: SPACING.l, padding: SPACING.m, alignItems: "center", backgroundColor: "#FFF0F0", borderRadius: RADIUS.medium },
  logoutText: { color: COLORS.primary, fontWeight: "800", fontSize: 16 }
});