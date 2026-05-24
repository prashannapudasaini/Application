import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export default function WalletCard() {
  return (
    <View style={styles.container}>
      <View style={styles.infoArea}>
        <Text style={styles.titleLabel}>Wallet Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceText}>NPR 1,250.00</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewWalletAction}>View Wallet ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual representation of a digital wallet icon box on the right */}
      <View style={styles.iconBox}>
        <Feather name="wallet" size={20} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    padding: SPACING.m,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  infoArea: {
    flex: 1,
  },
  titleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.s,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
  },
  viewWalletAction: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  iconBox: {
    width: 44,
    height: 38,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
