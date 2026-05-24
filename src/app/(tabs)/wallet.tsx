import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const TRANSACTIONS = [
  {
    id: "1",
    title: "Added to Wallet",
    amount: 500,
    type: "credit",
    date: "12 May, 10:30 AM",
  },
  {
    id: "2",
    title: "Milk & Paneer Order",
    amount: 230,
    type: "debit",
    date: "10 May, 08:15 AM",
  },
  {
    id: "3",
    title: "Daily Milk Subscription",
    amount: 160,
    type: "debit",
    date: "08 May, 07:00 AM",
  },
  {
    id: "4",
    title: "Order Refund (#1234)",
    amount: 120,
    type: "credit",
    date: "05 May, 02:20 PM",
  },
];

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sitaram Pay</Text>
          <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="history"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Optimized, Smaller & Cleaner Digital Card */}
        <View style={styles.digitalCard}>
          <View style={styles.cardInfoContainer}>
            <View style={styles.cardTextLeft}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹1,250<Text style={styles.balanceDecimal}>.00</Text>
              </Text>
            </View>
            
            <View style={styles.cardVisualRight}>
              <Text style={styles.cardTag}>ACTIVE</Text>
              <MaterialCommunityIcons
                name="contactless-payment"
                size={24}
                color="rgba(255,255,255,0.6)"
              />
            </View>
          </View>

          {/* Streamlined Horizontal Actions */}
          <View style={styles.cardActions}>
            <Pressable
              style={styles.actionBtn}
              android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            >
              <Feather name="plus" size={16} color="#FFF" />
              <Text style={styles.actionText}>Add Money</Text>
            </Pressable>
            
            <View style={styles.actionDivider} />
            
            <Pressable
              style={styles.actionBtn}
              android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            >
              <Feather name="arrow-up-right" size={16} color="#FFF" />
              <Text style={styles.actionText}>Send Bank</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionHeading}>Recent Transactions</Text>

          <View style={styles.txnList}>
            {TRANSACTIONS.map((txn, index) => {
              const isCredit = txn.type === "credit";
              const isLast = index === TRANSACTIONS.length - 1;

              return (
                <View
                  key={txn.id}
                  style={[styles.txnRow, isLast && styles.txnRowLast]}
                >
                  <View
                    style={[
                      styles.txnIconBox,
                      { backgroundColor: isCredit ? "#E8F5E9" : "#FFEBEE" },
                    ]}
                  >
                    <Feather
                      name={isCredit ? "arrow-down-left" : "arrow-up-right"}
                      size={20}
                      color={isCredit ? COLORS.success : COLORS.primary}
                    />
                  </View>

                  <View style={styles.txnDetails}>
                    <Text style={styles.txnTitle}>{txn.title}</Text>
                    <Text style={styles.txnDate}>{txn.date}</Text>
                  </View>

                  <Text
                    style={[
                      styles.txnAmount,
                      { color: isCredit ? COLORS.success : COLORS.text },
                    ]}
                  >
                    {isCredit ? "+" : "-"}₹{txn.amount}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m, // Reduced spacing
  },
  headerTitle: {
    fontSize: 26, // Marginally crisper size
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  historyBtn: { padding: SPACING.xs },

  // --- COMPACT DIGITAL CARD STYLES ---
  digitalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.large,
    padding: 16, // Snug, unified padding
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: SPACING.l,
  },
  cardInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardTextLeft: {
    flex: 1,
  },
  cardVisualRight: {
    alignItems: "flex-end",
    gap: 12,
  },
  cardTag: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 30, // Scaled down from 38
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  balanceDecimal: { fontSize: 18, color: "rgba(255,255,255,0.75)" },

  cardActions: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: RADIUS.medium,
    overflow: "hidden",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10, // Slimmer pill profile
    gap: 6,
  },
  actionText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  actionDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 6,
  },
  // -----------------------------------

  transactionsSection: { flex: 1 },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
  },
  txnList: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txnRowLast: { borderBottomWidth: 0 },
  txnIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  txnDetails: { flex: 1 },
  txnTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  txnDate: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },
  txnAmount: { fontSize: 15, fontWeight: "900" },
});