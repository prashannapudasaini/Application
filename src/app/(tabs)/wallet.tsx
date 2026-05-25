import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function WalletScreen() {
  const { walletBalance, loadWallet } = useCart();
  const [customAmount, setCustomAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(0);

  const handleLoadMoney = (amount: number) => {
    if (amount <= 0 || isNaN(amount)) return;

    loadWallet(amount);
    setLastLoaded(amount);
    setCustomAmount("");
    setShowSuccessModal(true);
  };

  // Determine if they qualify for the bonus text hint
  const currentInputAmount = parseInt(customAmount) || 0;
  const qualifiesForBonus = currentInputAmount >= 2000;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sitaram Wallet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            NPR {walletBalance.toLocaleString()}
          </Text>
          <View style={styles.walletIconBg}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={48}
              color="rgba(255,255,255,0.2)"
            />
          </View>
        </View>

        {/* Top Up Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
          <Text style={styles.sectionSubtitle}>
            Load NPR 2000 or more to instantly get 10% Extra Cash!
          </Text>

          {/* Quick Add Buttons */}
          <View style={styles.quickAddGrid}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAddBtn}
                activeOpacity={0.7}
                onPress={() => handleLoadMoney(amt)}
              >
                {amt >= 2000 && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusBadgeText}>+10%</Text>
                  </View>
                )}
                <Text style={styles.quickAddText}>+ NPR {amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.currencyPrefix}>NPR</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
          </View>

          {qualifiesForBonus && (
            <Text style={styles.bonusHintText}>
              🎁 You will receive an extra NPR {currentInputAmount * 0.1} bonus!
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.loadBtn,
              (!currentInputAmount || currentInputAmount <= 0) &&
                styles.loadBtnDisabled,
            ]}
            activeOpacity={0.8}
            disabled={!currentInputAmount || currentInputAmount <= 0}
            onPress={() => handleLoadMoney(currentInputAmount)}
          >
            <Text style={styles.loadBtnText}>
              Proceed to Pay via eSewa / Bank
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Feather name="check" size={40} color="#FFF" />
            </View>
            <Text style={styles.modalTitle}>Top-up Successful!</Text>

            <Text style={styles.modalMessage}>
              You have successfully loaded NPR {lastLoaded}.
              {lastLoaded >= 2000 &&
                ` You also received a 10% bonus of NPR ${lastLoaded * 0.1}!`}
            </Text>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Great</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.m,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  scrollContent: { padding: SPACING.m, paddingBottom: 100 },

  balanceCard: {
    backgroundColor: "#001F3F",
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    marginBottom: SPACING.l,
    overflow: "hidden",
    elevation: 4,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  balanceAmount: { color: "#FFF", fontSize: 32, fontWeight: "900" },
  walletIconBg: {
    position: "absolute",
    right: -10,
    bottom: -10,
    transform: [{ scale: 2.5 }],
  },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: SPACING.m,
    marginTop: 2,
  },

  quickAddGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: SPACING.m,
  },
  quickAddBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  bonusBadge: {
    position: "absolute",
    top: -8,
    right: -4,
    backgroundColor: "#27AE60",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "900" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    backgroundColor: "#FAFAFA",
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    paddingVertical: 14,
  },
  bonusHintText: {
    color: "#27AE60",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },

  loadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING.m,
  },
  loadBtnDisabled: { backgroundColor: "#CCCCCC" },
  loadBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Modal
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
    backgroundColor: "#27AE60",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalConfirmBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  modalConfirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
});