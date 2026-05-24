import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const PAYMENT_METHODS = [
  {
    id: "wallet",
    title: "Wallet Balance",
    icon: "credit-card",
    balance: "₹1,250.00",
  },
  { id: "upi", title: "UPI / Google Pay", icon: "smartphone" },
  { id: "card", title: "Card Payment", icon: "credit-card" },
  { id: "cod", title: "Cash on Delivery", icon: "box" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState("wallet");

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Stepper */}
        <View style={styles.stepperContainer}>
          <View style={styles.step}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>1</Text>
            </View>
            <Text style={styles.stepLabelActive}>Delivery</Text>
          </View>
          <View style={styles.stepperLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Payment</Text>
          </View>
          <View style={styles.stepperLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Place Order</Text>
          </View>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addressRow}>
            <Ionicons
              name="location"
              size={20}
              color={COLORS.primary}
              style={styles.addressIcon}
            />
            <Text style={styles.addressText}>221B Baker Street, London</Text>
          </View>

          <TouchableOpacity style={styles.addInstructionBtn}>
            <Feather
              name="plus-square"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.addInstructionText}>
              Add Delivery Instructions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Options Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Options</Text>

          {PAYMENT_METHODS.map((method) => {
            const isActive = selectedPayment === method.id;

            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentRow, isActive && styles.paymentRowActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={styles.paymentLeft}>
                  {/* Custom Radio Button */}
                  <View
                    style={[
                      styles.radioOuter,
                      isActive && styles.radioOuterActive,
                    ]}
                  >
                    {isActive && <View style={styles.radioInner} />}
                  </View>

                  {/* Icon */}
                  <View style={styles.paymentIconBox}>
                    <Feather
                      name={method.icon as any}
                      size={16}
                      color={isActive ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.paymentTitle,
                      isActive && styles.paymentTitleActive,
                    ]}
                  >
                    {method.title}
                  </Text>
                </View>

                {/* Show balance ONLY for Wallet */}
                {method.balance && (
                  <Text style={styles.walletBalanceText}>{method.balance}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalPayableRow}>
          <Text style={styles.totalPayableLabel}>Total Payable</Text>
          <Text style={styles.totalPayableAmount}>₹456</Text>
        </View>

        <TouchableOpacity style={styles.placeOrderButton} activeOpacity={0.8}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.xl,
  },
  step: {
    alignItems: "center",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: COLORS.card,
  },
  stepCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D3D3D3",
  },
  stepNumberActive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  stepLabel: {
    fontSize: 10,
    color: "#D3D3D3",
    fontWeight: "600",
  },
  stepLabelActive: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
  },
  stepperLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 8,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    padding: SPACING.m,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  addressIcon: {
    marginRight: SPACING.s,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },
  addInstructionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addInstructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentRowActive: {
    backgroundColor: "rgba(139, 21, 26, 0.03)",
    marginHorizontal: -SPACING.m,
    paddingHorizontal: SPACING.m,
    borderBottomColor: "transparent",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#D3D3D3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  paymentIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.s,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  paymentTitleActive: {
    fontWeight: "800",
  },
  walletBalanceText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.success,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalPayableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  totalPayableLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  totalPayableAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  placeOrderButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: RADIUS.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  placeOrderText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
