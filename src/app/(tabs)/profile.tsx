import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Share,
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

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: "Sign up for Sitaram Dairy using my code SITARAM2026 and get ₹50 off your first fresh milk delivery! Download the app now.",
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const MENU_SECTIONS = [
    {
      title: "Account Settings",
      data: [
        { id: "profile", title: "Profile", icon: "account-outline", color: "#4A90E2", onPress: () => router.push('/profile/settings') },
        { id: "locations", title: "My locations", icon: "map-marker-outline", color: "#F5A623", onPress: () => router.push('/profile/locations') },
        { id: "password", title: "Change Password", icon: "key-outline", color: "#6C5CE7", onPress: () => router.push('/profile/settings') },
        { id: "pause_supply", title: "Pause/UnPause Supply", icon: "package-variant-closed", color: "#A11217", onPress: () => router.push('/profile/supply-management') },
      ]
    },
    {
      title: "Wallet & Offers",
      data: [
        { id: "wallet", title: "My Wallet", icon: "wallet-outline", color: "#50E3C2", onPress: () => router.push('/(tabs)/wallet') },
        { id: "transactions", title: "Transactions", icon: "format-list-bulleted", color: "#4A90E2", onPress: () => router.push('/profile/transactions') },
        { id: "offers", title: "Offers", icon: "ticket-percent-outline", color: "#F5A623", onPress: () => router.push('/profile/offers') },
        { id: "offer_bucket", title: "My Offer Bucket", icon: "basket-outline", color: "#E84393", onPress: () => router.push('/profile/offers?tab=bucket') },
      ]
    },
    {
      title: "General Settings",
      data: [
        { id: "about", title: "About us", icon: "information-outline", color: "#636E72", onPress: () => router.push('/profile/info?page=about') },
        { id: "faq", title: "FAQ", icon: "help-circle-outline", color: "#0984E3", onPress: () => router.push('/profile/info?page=faq') },
        { id: "terms", title: "Terms & Conditions", icon: "file-document-outline", color: "#2D3436", onPress: () => router.push('/profile/info?page=terms') },
        { id: "contact", title: "Contact Us", icon: "headset", color: "#00B894", onPress: () => router.push('/profile/support') },
        { id: "share", title: "Share Referral Code", icon: "share-variant-outline", color: "#A11217", onPress: handleShareReferral },
      ]
    }
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
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7} onPress={() => router.push('/profile/settings')}>
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
            <Text style={styles.loyaltyText}>Gold Member • {USER.loyaltyPoints} pts</Text>
          </View>
        </View>

        {/* Dynamic Menu Sections */}
        {MENU_SECTIONS.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.data.map((item, index) => {
                const isLast = index === section.data.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                    onPress={item.onPress}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Feather name="chevron-right" size={20} color="#C7C7CC" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout System */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.8}
          onPress={() => Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/') }
          ])}
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
  
  sectionWrapper: { marginBottom: SPACING.l },
  sectionHeading: { fontSize: 14, fontWeight: "800", color: COLORS.primary, marginBottom: SPACING.s, marginLeft: 4 },
  menuContainer: { backgroundColor: COLORS.card, borderRadius: RADIUS.large, paddingHorizontal: SPACING.m, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.m },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.medium, justifyContent: "center", alignItems: "center", marginRight: SPACING.m },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text },
  
  logoutBtn: { marginTop: SPACING.m, padding: SPACING.m, alignItems: "center", backgroundColor: "#FFF0F0", borderRadius: RADIUS.medium, borderWidth: 1, borderColor: 'rgba(161, 18, 23, 0.15)' },
  logoutText: { color: COLORS.primary, fontWeight: "800", fontSize: 16 }
});