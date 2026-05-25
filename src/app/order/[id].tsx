import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extracting data safely from routing parameters
  const orderId = `#${params.id}`;
  const date = (params.date as string) || "Recent Order";
  const amount = (params.amount as string) || "0";
  const image = (params.image as string) || "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80";
  
  // Local state to handle UI rendering before context callback execution
  const [status, setStatus] = useState((params.status as string) || "Processing");

  // Status-dependent brand styling configurations
  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case "Delivered": 
        return COLORS.success;
      case "Processing": 
        return "#F5A623"; // Warm Amber
      case "Cancelled": 
        return COLORS.primary; // Sitaram theme primary red
      default: 
        return COLORS.textSecondary;
    }
  };

  const handleCancelOrder = () => {
    const processCancellation = () => {
      setStatus("Cancelled");
      if (Platform.OS === 'web') {
        alert("Order Cancelled! Your refund has been initiated.");
      } else {
        Alert.alert("Order Cancelled", "Your refund has been initiated.");
      }
      
      // 🔥 THE SYNC MECHANISM: Passes state metadata cleanly back to the parent order log state
      router.replace({
        pathname: '/(tabs)/orders',
        params: { cancelledId: params.id }
      });
    };

    // 🌐 Web Environment Confirmation Handler
    if (Platform.OS === 'web') {
      const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
      if (confirmCancel) {
        processCancellation();
      }
    } else {
      // 📱 Native Device Confirmation Modal
      Alert.alert(
        "Cancel Order",
        "Are you sure you want to cancel this order?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Cancel", style: "destructive", onPress: processCancellation }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* State Validation Banner */}
        <View style={[
          styles.statusBanner, 
          { backgroundColor: getStatusColor(status) + '15', borderColor: getStatusColor(status) + '40' }
        ]}>
          <Text style={[styles.statusBannerText, { color: getStatusColor(status) }]}>
            Status: {status}
          </Text>
        </View>

        {/* Order Info Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>{orderId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Date</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
        </View>

        {/* Product Selection Visualization */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <View style={styles.itemRow}>
            <Image source={{ uri: image }} style={styles.itemImage} resizeMode="contain" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Dairy Products Assortment</Text>
              <Text style={styles.itemQty}>Qty: 1</Text>
            </View>
            <Text style={styles.itemPrice}>₹{amount}</Text>
          </View>
        </View>

        {/* Ledger Pricing Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>₹{amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={[styles.value, { color: COLORS.success }]}>FREE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalValue}>₹{amount}</Text>
          </View>
        </View>

        {/* Context Button Engine: Hides itself dynamically when condition drops processing state */}
        {status === 'Processing' && (
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={handleCancelOrder}>
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  placeholder: { width: 32 },
  scrollContent: { padding: SPACING.m, paddingBottom: 40 },
  statusBanner: { padding: SPACING.m, borderRadius: RADIUS.medium, borderWidth: 1, alignItems: 'center', marginBottom: SPACING.m },
  statusBannerText: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.large, padding: SPACING.m, marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text, marginBottom: SPACING.m },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  value: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.s },
  grandTotalLabel: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  grandTotalValue: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 50, height: 50, borderRadius: RADIUS.small, backgroundColor: COLORS.background, marginRight: SPACING.m, padding: 4 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  itemQty: { fontSize: 12, color: COLORS.textSecondary },
  itemPrice: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  cancelBtn: { marginTop: SPACING.s, backgroundColor: '#FFF0F0', padding: SPACING.m, borderRadius: RADIUS.medium, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(161, 18, 23, 0.15)' },
  cancelBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 }
});