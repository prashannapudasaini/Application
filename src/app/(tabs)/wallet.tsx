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
        {/* Premium Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sitaram Pay</Text>
          <TouchableOpacity style={styles.historyBtn}>
            <MaterialCommunityIcons
              name="history"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Digital Card (Balance) */}
        <View style={styles.digitalCard}>
          <View style={styles.cardTop}>
            <MaterialCommunityIcons
              name="contactless-payment"
              size={28}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.cardTag}>ACTIVE</Text>
          </View>

          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹1,250<Text style={styles.balanceDecimal}>.00</Text>
          </Text>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.actionBtn}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.actionText}>Add Money</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              style={styles.actionBtn}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Feather name="arrow-up-right" size={18} color="#FFF" />
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
    marginBottom: SPACING.l,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  historyBtn: { padding: SPACING.xs },

  digitalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: SPACING.xl,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  cardTag: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: SPACING.xl,
  },
  balanceDecimal: { fontSize: 24, color: "rgba(255,255,255,0.8)" },

  cardActions: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: RADIUS.medium,
    overflow: "hidden",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: SPACING.s,
  },
  actionText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  actionDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 8,
  },

  transactionsSection: { flex: 1 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
  },
  txnList: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
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
  txnRowLast: { borderBottomWidth: 0, paddingBottom: SPACING.xs },
  txnIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  txnDetails: { flex: 1 },
  txnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  txnDate: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  txnAmount: { fontSize: 16, fontWeight: "900" },
});
