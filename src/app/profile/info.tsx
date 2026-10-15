import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InfoScreen() {
  const { title } = useLocalSearchParams();
  const router = useRouter();

  // Dynamic content switcher returning formatted JSX
  const getContent = () => {
    switch (title) {
      case "About us":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              Welcome to <Text style={styles.boldText}>Sitaram Dairy</Text>,
              where purity meets tradition. We are committed to providing you
              with the freshest, highest-quality dairy products directly from
              our farms to your family's table.
            </Text>

            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.paragraph}>
              Our mission is simple: to nourish our community with 100% natural,
              chemical-free milk while supporting sustainable farming practices
              and ensuring the absolute well-being of our cattle.
            </Text>

            <Text style={styles.sectionTitle}>Why Choose Us?</Text>
            <View style={styles.bulletList}>
              {[
                "Farm-Fresh Daily: Milked and delivered to your doorstep within hours.",
                "100% Natural: Zero artificial preservatives, additives, or adulterants.",
                "Strict Quality Control: Tested daily to guarantee purity and nutrition.",
                "Community Focused: Empowering local agriculture since our inception.",
              ].map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Feather
                    name="check-circle"
                    size={18}
                    color="#00519E"
                    style={styles.bulletIcon}
                  />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.paragraph, { marginTop: 16 }]}>
              Thank you for trusting Sitaram Dairy to be a part of your daily
              routine. We look forward to serving you health and happiness, one
              bottle at a time.
            </Text>
          </View>
        );

      case "FAQ":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              <Text style={styles.boldText}>
                Q: How do I pause my delivery?
              </Text>
              {"\n"}
              A: Go to Profile &gt; Supply Control &gt; Pause My Deliveries.
              {"\n\n"}
              <Text style={styles.boldText}>
                Q: What are the delivery times?
              </Text>
              {"\n"}
              A: We deliver fresh milk between 5:00 AM and 7:00 AM daily.
            </Text>
          </View>
        );

      case "Terms & Conditions":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              1. All orders must be placed by 9 PM for next-day delivery.
              {"\n\n"}
              2. Payment must be cleared via the wallet at least 24 hours in
              advance.{"\n\n"}
              3. Damaged goods must be reported within 2 hours of delivery for a
              valid replacement claim.
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.paragraph}>
              Information currently unavailable.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || "Information"}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {getContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FFF",
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1A1A1A" },
  scroll: { padding: 24, paddingBottom: 60 },

  // New Styles for Rich Formatting
  contentContainer: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    marginTop: 28,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#555",
    fontWeight: "500",
  },
  boldText: {
    fontWeight: "800",
    color: "#1A1A1A",
  },
  bulletList: {
    marginTop: 8,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
    fontWeight: "600",
  },
});
