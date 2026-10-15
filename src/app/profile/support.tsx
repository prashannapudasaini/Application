import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Consistent theme matching your Orders page
const THEME = {
  background: "#F8F9FA",
  cardBg: "#FFFFFF",
  textDark: "#1A1A1A",
  textGray: "#757575",
  border: "#EAEAEA",
  primaryRed: "#8A151B",
  iconBg: "#FFF5F5", // Soft red background for icons
};

export default function SupportScreen() {
  const router = useRouter();

  // Replace these with the exact details from sitaramdudh.com
  const CONTACT_INFO = {
    phone: "976-7663024",
    email: "info@sitaramdudh.com",
    website: "https://sitaramdudh.com",
  };

  const handleCall = () => Linking.openURL(`tel:${CONTACT_INFO.phone}`);
  const handleEmail = () => Linking.openURL(`mailto:${CONTACT_INFO.email}`);
  const handleWebsite = () => Linking.openURL(CONTACT_INFO.website);

  const handleWhatsApp = () => {
    const url = `whatsapp://send?phone=${CONTACT_INFO.phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback if WhatsApp isn't installed
        Linking.openURL(`https://wa.me/${CONTACT_INFO.phone.replace("+", "")}`);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/profile")
          }
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={24} color={THEME.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <MaterialCommunityIcons
              name="headset"
              size={40}
              color={THEME.primaryRed}
            />
          </View>
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroDesc}>
            Need assistance with your Sitaram Dairy deliveries? Reach out to our
            dedicated support team.
          </Text>
        </View>

        {/* Actionable Contact Cards */}

        {/* Call Support */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Feather name="phone-call" size={22} color={THEME.primaryRed} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Call Us Directly</Text>
            <Text style={styles.value}>+977 976-7663024</Text>
          </View>
          <Feather name="external-link" size={18} color="#CCC" />
        </TouchableOpacity>

        {/* WhatsApp Support */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleWhatsApp}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}>
            <FontAwesome5 name="whatsapp" size={24} color="#2E7D32" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>WhatsApp Chat</Text>
            <Text style={styles.value}>Instant Messaging</Text>
          </View>
          <Feather name="message-circle" size={18} color="#CCC" />
        </TouchableOpacity>

        {/* Email Support */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#F0F4FF" }]}>
            <Feather name="mail" size={22} color="#00519E" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Email Support</Text>
            <Text style={styles.value}>{CONTACT_INFO.email}</Text>
          </View>
          <Feather name="external-link" size={18} color="#CCC" />
        </TouchableOpacity>

        {/* Official Website */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleWebsite}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#FFF3E0" }]}>
            <Feather name="globe" size={22} color="#E65100" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Official Website</Text>
            <Text style={styles.value}>sitaramdudh.com</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CCC" />
        </TouchableOpacity>

        {/* Informational Footer */}
        <View style={styles.footerInfo}>
          <Feather name="clock" size={14} color={THEME.textGray} />
          <Text style={styles.footerText}>
            Support hours: 6:00 AM - 8:00 PM Daily
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.cardBg,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: THEME.textDark,
    textTransform: "uppercase",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 32,
  },
  heroIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.iconBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: THEME.textDark,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: THEME.textGray,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    paddingHorizontal: 20,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.cardBg,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.iconBg,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: THEME.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.textDark,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textGray,
  },
});
