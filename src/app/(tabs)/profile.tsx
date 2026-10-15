import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";
// 🔥 FIXED: Now pulling safely from AuthContext to prevent the 500 error crash
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isLogoutConfirmation, setIsLogoutConfirmation] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfileMetrics = async () => {
      if (!user?.id) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const res = await api.get(`api/user/mobile-profile.php?user_id=${user.id}`);
        if (isMounted && res.data.status === "success") {
          setProfileData(res.data.data);
        }
      } catch (error) {
        if (isMounted) console.error("Failed to fetch profile:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfileMetrics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const currentUserName = profileData?.name || user?.name || "Farm Member";
  const currentUserPhone =
    profileData?.phone || user?.phone || "Update your contact info";
  const loyaltyPoints = profileData?.loyalty_points || 0;
  const unreadNotifications = profileData?.unread_notifications || 0;


  const getTierDetails = (points: number) => {
    if (points >= 5000)
      return { name: "VIP Platinum", color: "#1A1A1A", icon: "diamond" };
    if (points >= 2000)
      return { name: "Gold Member", color: "#B8860B", icon: "star" };
    if (points >= 500)
      return { name: "Silver Member", color: "#718093", icon: "star-half" };
    return { name: "Farm Member", color: "#27AE60", icon: "leaf" };
  };
  const currentTier = getTierDetails(loyaltyPoints);

  const triggerCustomAlert = (
    title: string,
    message: string,
    logoutCheck = false,
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsLogoutConfirmation(logoutCheck);
    setModalVisible(true);
  };

  const MENU_SECTIONS = [
    {
      title: "Account Settings",
      data: [
        {
          id: "profile",
          title: "Profile Settings",
          icon: "account-outline",
          color: "#4A90E2",
          onPress: () => router.push("/profile/settings"),
        },
        {
          id: "locations",
          title: "My locations",
          icon: "map-marker-outline",
          color: "#F5A623",
          onPress: () => router.push("/profile/locations"),
        },
        {
          id: "password",
          title: "Change Password",
          icon: "key-outline",
          color: "#6C5CE7",
          onPress: () => router.push("/profile/settings"),
        },
        {
          id: "notifications",
          title: unreadNotifications > 0 ? `Notifications & Account (${unreadNotifications})` : "Notifications & Account",
          icon: "bell-outline",
          color: "#E74C3C",
          onPress: () => router.push("/notifications"),
        },
        {
          id: "pause_supply",
          title: "Pause/UnPause Supply",
          icon: "package-variant-closed",
          color: "#800000",
          onPress: () => router.push("/profile/supply-management"),
        },
      ],
    },
    {
      title: "General Settings",
      data: [
        {
          id: "about",
          title: "About us",
          icon: "information-outline",
          color: "#636E72",
          onPress: () =>
            router.push({
              pathname: "/profile/info",
              params: { title: "About us" },
            }),
        },
        {
          id: "contact",
          title: "Contact Us",
          icon: "headset",
          color: "#00B894",
          onPress: () => router.push("/profile/support"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.7}
            onPress={() => router.push("/profile/settings")}
          >
            <Feather name="settings" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Dynamic Hero Card */}
        <View style={styles.heroCard}>
          {isLoading ? (
            <View style={{ paddingVertical: SPACING.xl, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#800000" />
              <Text
                style={{
                  marginTop: SPACING.m,
                  color: "#666",
                  fontWeight: "600",
                }}
              >
                Syncing Profile...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentUserName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.userName}>{currentUserName}</Text>
              <Text style={styles.userPhone}>{currentUserPhone}</Text>
              <View style={styles.loyaltyBadge}>
                <Ionicons
                  name={currentTier.icon as any}
                  size={14}
                  color={currentTier.color}
                />
                <Text
                  style={[styles.loyaltyText, { color: currentTier.color }]}
                >
                  {currentTier.name} • {loyaltyPoints.toLocaleString()} pts
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Free 2L Milk Reward Card */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <View style={styles.rewardTitleBox}>
              <MaterialCommunityIcons name="gift-outline" size={20} color="#800000" />
              <Text style={styles.rewardTitle}>Free 2L Milk</Text>
            </View>
            <Text style={styles.rewardSub}>{loyaltyPoints} / 1000</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((loyaltyPoints / 1000) * 100, 100)}%` },
              ]}
            />
          </View>

          {loyaltyPoints >= 1000 ? (
            <TouchableOpacity style={styles.claimBtn} activeOpacity={0.8}>
              <Text style={styles.claimBtnText}>CLAIM REWARD</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.rewardFooterText}>
              Earn 10 points for every NPR 100 spent via wallet!
            </Text>
          )}
        </View>


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
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: item.color + "12" },
                      ]}
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
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() =>
            triggerCustomAlert(
              "Log Out",
              "Are you sure you want to securely exit your current session?",
              true,
            )
          }
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Reusable Status Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconWrapper,
                {
                  backgroundColor: isLogoutConfirmation ? "#FFF0F0" : "#FAF8F5",
                },
              ]}
            >
              <Feather
                name={isLogoutConfirmation ? "log-out" : "info"}
                size={32}
                color={isLogoutConfirmation ? "#800000" : "#1A1A1A"}
              />
            </View>
            <Text style={styles.modalTitleText}>{modalTitle}</Text>
            <Text style={styles.modalMessageText}>{modalMessage}</Text>

            <View style={styles.modalBtnRow}>
              {isLogoutConfirmation ? (
                <>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={() => {
                      setModalVisible(false);
                      logout();
                    }}
                  >
                    <Text style={styles.modalConfirmBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { width: "100%" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalConfirmBtnText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#1A1A1A" },
  settingsBtn: {
    padding: SPACING.s,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  heroCard: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: SPACING.m,
    elevation: 2,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)",
    minHeight: 180,
    justifyContent: "center",
  },
  avatarWrapper: { position: "relative", marginBottom: SPACING.m },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#800000",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#FFF" },
  userName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: SPACING.m,
    fontWeight: "600",
  },
  loyaltyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  loyaltyText: { fontSize: 12, fontWeight: "800" },

  // Reward Card Styles
  rewardCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: "rgba(128, 0, 0, 0.15)",
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rewardTitleBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  rewardTitle: { fontSize: 15, fontWeight: "900", color: "#800000" },
  rewardSub: { fontSize: 13, fontWeight: "800", color: "#800000" },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(128, 0, 0, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#800000",
    borderRadius: 4,
  },
  rewardFooterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  claimBtn: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    marginTop: 4,
  },
  claimBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  sectionWrapper: { marginBottom: SPACING.l },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "900",
    color: "#800000",
    marginBottom: SPACING.s,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#F4F4F4" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  menuTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A1A" },

  logoutBtn: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: "rgba(128, 0, 0, 0.15)",
  },
  logoutText: { color: "#800000", fontWeight: "900", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: "center",
  },
  modalIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessageText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
    fontWeight: "500",
  },
  modalBtnRow: { flexDirection: "row", gap: SPACING.m, width: "100%" },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  modalCancelBtnText: { color: "#1A1A1A", fontSize: 14, fontWeight: "800" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: "#800000",
  },
  modalConfirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
});
