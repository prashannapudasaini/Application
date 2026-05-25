import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function OffersScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{tab === 'bucket' ? 'My Offer Bucket' : 'Coupons & Offers'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.m }}>
        {tab === 'bucket' ? (
          <View style={styles.couponCard}>
            <View style={styles.dashedContainer}>
              <Text style={styles.promoCode}>FRESH50</Text>
              <Text style={styles.promoDesc}>Claimed Reward: ₹50 Off your next processing request.</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={styles.couponCard}>
              <Text style={styles.promoCode}>MILKSTAY</Text>
              <Text style={styles.promoDesc}>Get 10% off your entire month of automated subscription supply packs.</Text>
              <TouchableOpacity style={styles.claimBtn} onPress={() => Alert.alert('Success', 'Offer successfully added to your bucket!')}><Text style={styles.claimText}>Claim Offer</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  couponCard: { backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: RADIUS.large, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  dashedContainer: { padding: 4 },
  promoCode: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  promoDesc: { fontSize: 13, color: COLORS.textSecondary, marginVertical: 6, lineHeight: 18 },
  claimBtn: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.small, marginTop: 4 },
  claimText: { color: '#FFF', fontSize: 11, fontWeight: '800' }
});