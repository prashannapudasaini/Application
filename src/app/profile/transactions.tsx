import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const TX_HISTORY = [
  { id: '1', title: 'Wallet Recharge - eSewa', date: '24 May 2026', amount: '+₹1,000', type: 'credit' },
  { id: '2', title: 'Order Delivery #12345', date: '10 May 2026', amount: '-₹456', type: 'debit' },
  { id: '3', title: 'Order Delivery #12343', date: '08 May 2026', amount: '-₹160', type: 'debit' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={TX_HISTORY}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: SPACING.m }}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Feather name={item.type === 'credit' ? "arrow-down-left" : "arrow-up-right"} size={20} color={item.type === 'credit' ? COLORS.success : COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{item.title}</Text>
              <Text style={styles.txDate}>{item.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'credit' ? COLORS.success : COLORS.text }]}>{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: RADIUS.medium, marginBottom: SPACING.s, borderWidth: 1, borderColor: COLORS.border },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m },
  txTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' }
});