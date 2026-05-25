import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function SupplyManagementScreen() {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Supply Control</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: SPACING.m }}>
        <View style={[styles.statusBox, { backgroundColor: isPaused ? '#FFF0F0' : '#E8F5E9', borderColor: isPaused ? 'rgba(161,18,23,0.2)' : 'rgba(46,125,50,0.2)' }]}>
          <Text style={[styles.statusTitle, { color: isPaused ? COLORS.primary : COLORS.success }]}>
            Current State: {isPaused ? 'PAUSED' : 'ACTIVE'}
          </Text>
          <Text style={styles.statusDesc}>
            {isPaused ? 'Your ongoing daily product delivery orders are frozen. Tap below to re-enable supply chains.' : 'Your farm-fresh milk shipments deploy daily between 5:00 AM - 7:30 AM.'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: isPaused ? COLORS.success : COLORS.primary }]} 
          onPress={() => {
            setIsPaused(!isPaused);
            Alert.alert('System Synchronized', `Delivery schedules configured to ${!isPaused ? 'PAUSED' : 'ACTIVE'} successfully.`);
          }}
        >
          <Feather name={isPaused ? "play" : "pause"} size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>{isPaused ? 'Resume Daily Supply' : 'Pause My Deliveries'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  statusBox: { padding: SPACING.m, borderRadius: RADIUS.large, borderWidth: 1, marginBottom: SPACING.m },
  statusTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  statusDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  actionBtn: { padding: SPACING.m, borderRadius: RADIUS.medium, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  actionText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});