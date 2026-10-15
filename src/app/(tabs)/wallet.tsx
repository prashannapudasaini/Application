import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { ENDPOINTS } from "../../constants/api";
import { RADIUS, SPACING } from "../../constants/theme";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";
// 🔥 FIXED: Imported from AuthContext instead of layout
import { useAuth } from "../../context/AuthContext";

const QUICK_AMOUNTS = [1000, 2000, 3000, 5000];

export default function WalletScreen() {
  const { walletBalance, loadWallet, setInitialWalletBalance } =
    useCart() as any;
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState("");

  // Dedicated local state for UI balance removed. We use walletBalance from context directly.

  // Processing & Modal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(0);

  // WebView States
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayHtml, setGatewayHtml] = useState("");

  // Synchronous ref lock to prevent WebView from firing multiple times
  const hasHandledPayment = useRef(false);

  const currentInputAmount = parseInt(customAmount) || 0;
  const qualifiesForBonus = currentInputAmount > 3000;
  const bonusAmount = qualifiesForBonus ? currentInputAmount * 0.02 : 0;

  // Balance is automatically synced via CartContext now on user login

  const handleConnectIPSTopUp = async () => {
    if (currentInputAmount <= 0 || isNaN(currentInputAmount)) return;
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "Please log in to add money to your wallet.",
      );
      return;
    }

    hasHandledPayment.current = false;
    setIsProcessing(true);

    try {
      const purchase_id = `W${user.id}A${currentInputAmount}`;

      const res = await api.post(ENDPOINTS.INIT_CONNECTIPS, {
        amount: currentInputAmount,
        purchase_id: purchase_id,
      });

      if (res.data?.success) {
        const { gatewayUrl, payload } = res.data;

        if (Platform.OS === "web") {
          const form = document.createElement("form");
          form.setAttribute("method", "POST");
          form.setAttribute("action", gatewayUrl);

          for (const key in payload) {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", payload[key]);
            form.appendChild(hiddenField);
          }
          document.body.appendChild(form);
          form.submit();

          setIsProcessing(false);
        } else {
          const htmlString = `
            <html>
              <body onload="document.forms[0].submit();" style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
                <h2>Redirecting to ConnectIPS...</h2>
                <form method="POST" action="${gatewayUrl}">
                  ${Object.keys(payload)
              .map(
                (key) =>
                  `<input type="hidden" name="${key}" value="${payload[key]}" />`,
              )
              .join("")}
                </form>
              </body>
            </html>
          `;

          setGatewayHtml(htmlString);
          setShowGateway(true);
          setIsProcessing(false);
        }
      } else {
        Alert.alert(
          "Error",
          res.data?.message || "Failed to initialize ConnectIPS.",
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Payment Error",
        "Ensure your server is running and connected.",
      );
      setIsProcessing(false);
    }
  };

  const handleWebViewNavigation = async (navState: any) => {
    const { url } = navState;

    if (hasHandledPayment.current) return;

    if (url.includes("success") || url.includes("validatetxn")) {
      hasHandledPayment.current = true;
      setShowGateway(false);
      setIsProcessing(true);

      try {
        const topupRes = await api.post(ENDPOINTS.TOPUP_WALLET, {
          user_id: user?.id,
          amount: currentInputAmount,
        });

        if (topupRes.data?.status === "success") {
          // Global wallet state gets updated here:
          if (loadWallet) loadWallet(currentInputAmount);
          setLastLoaded(currentInputAmount);
          setShowSuccessModal(true);
          setCustomAmount("");
        } else {
          Alert.alert(
            "Sync Error",
            topupRes.data?.message || "Failed to sync to database.",
          );
        }
      } catch (error) {
        console.error("Topup Sync Error:", error);
        Alert.alert(
          "Sync Error",
          "Payment succeeded but failed to sync to database.",
        );
      } finally {
        setIsProcessing(false);
      }
    } else if (url.includes("failure") || url.includes("cancel")) {
      hasHandledPayment.current = true;
      setShowGateway(false);
      Alert.alert(
        "Payment Failed",
        "Your ConnectIPS transaction was cancelled or failed.",
      );
    }
  };

  const setQuickAmount = (amount: number) => {
    setCustomAmount(amount.toString());
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sitaram Wallet</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollViewContainer}
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
                name="wallet"
                size={130}
                color="rgba(255,255,255,0.08)"
              />
            </View>
          </View>

          {/* Top Up Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
            <Text style={styles.sectionSubtitle}>
              Load above NPR 3000 to instantly get 2% Extra Cash!
            </Text>

            <View style={styles.quickAddGrid}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.quickAddBtn,
                    currentInputAmount === amt && styles.quickAddBtnActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setQuickAmount(amt)}
                >
                  <Text
                    style={[
                      styles.quickAddText,
                      currentInputAmount === amt && styles.quickAddTextActive,
                    ]}
                  >
                    + NPR {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>NPR</Text>
              <TextInput
                style={[
                  styles.input,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholderTextColor="#888"
              />
            </View>

            {qualifiesForBonus && (
              <Text style={styles.bonusHintText}>
                🎁 You will receive an extra NPR {bonusAmount} bonus!
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.loadBtn,
                (!currentInputAmount || currentInputAmount <= 0) &&
                styles.loadBtnDisabled,
              ]}
              activeOpacity={0.8}
              disabled={
                !currentInputAmount || currentInputAmount <= 0 || isProcessing
              }
              onPress={handleConnectIPSTopUp}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Feather name="lock" size={16} color="#FFF" />
                  <Text style={styles.loadBtnText}>
                    Proceed to Pay via ConnectIPS
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CONNECTIPS WEBVIEW MODAL */}
      {Platform.OS !== "web" && (
        <Modal
          visible={showGateway}
          animationType="slide"
          onRequestClose={() => setShowGateway(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Secure Wallet Top-up</Text>
              <TouchableOpacity
                onPress={() => setShowGateway(false)}
                style={styles.modalClose}
              >
                <Feather name="x" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: gatewayHtml }}
              onNavigationStateChange={handleWebViewNavigation}
              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#00519E"
                  style={{ flex: 1 }}
                />
              )}
            />
          </SafeAreaView>
        </Modal>
      )}

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
              {lastLoaded > 3000 &&
                ` You also received a 2% bonus of NPR ${lastLoaded * 0.02}!`}
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
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    padding: SPACING.m,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    textTransform: "uppercase",
  },
  keyboardAvoidWrapper: { flex: 1 },
  scrollViewContainer: { flex: 1 },
  scrollContent: { padding: SPACING.m, paddingBottom: 160 },
  balanceCard: {
    backgroundColor: "#00519E",
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    marginBottom: SPACING.l,
    overflow: "hidden",
    position: "relative",
    elevation: 4,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    zIndex: 2,
  },
  balanceAmount: { color: "#FFF", fontSize: 32, fontWeight: "900", zIndex: 2 },
  walletIconBg: { position: "absolute", right: -25, bottom: -35, zIndex: 1 },
  section: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1A1A1A" },
  sectionSubtitle: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "700",
    marginBottom: SPACING.m,
    marginTop: 2,
  },
  quickAddGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: SPACING.m,
  },
  quickAddBtn: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: RADIUS.medium,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  quickAddBtnActive: { borderColor: "#00519E", backgroundColor: "#F0F7FF" },
  quickAddText: { fontSize: 14, fontWeight: "800", color: "#555" },
  quickAddTextActive: { color: "#00519E" },
  bonusBadge: {
    position: "absolute",
    top: -10,
    right: -5,
    backgroundColor: "#27AE60",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
    elevation: 3,
  },
  bonusBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    backgroundColor: "#FAFAFA",
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "800",
    color: "#555",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
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
    backgroundColor: "#00519E",
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
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalConfirmBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: "center",
    backgroundColor: "#00519E",
  },
  modalConfirmBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  modalClose: { padding: 4 },
});
