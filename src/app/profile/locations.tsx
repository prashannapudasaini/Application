import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function LocationsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Locations</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: SPACING.m }}>
        <View style={styles.addressCard}>
          <Feather name="map-pin" size={20} color={COLORS.primary} style={{ marginRight: SPACING.m }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addrType}>Home Address</Text>
            <Text style={styles.addrFull}>Prashant Sharma, Lazimpat, Kathmandu, Nepal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Google Maps', 'Opening dynamic address configuration tracker...')}>
          <Feather name="plus" size={16} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.addText}>Add New Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: RADIUS.large, borderWidth: 1, borderColor: COLORS.border },
  addrType: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  addrFull: { fontSize: 12, color: COLORS.textSecondary },
  addBtn: { marginTop: SPACING.m, backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: RADIUS.medium, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});