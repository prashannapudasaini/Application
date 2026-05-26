import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="phone" size={24} color="#800000" />
          <View style={styles.textContainer}>
            <Text style={styles.label}>Customer Care</Text>
            <Text style={styles.value}>+977 980-0000000</Text>
          </View>
        </View>
        
        <View style={[styles.row, { marginTop: 24 }]}>
          <MaterialCommunityIcons name="email" size={24} color="#800000" />
          <View style={styles.textContainer}>
            <Text style={styles.label}>Email Support</Text>
            <Text style={styles.value}>support@sitaramdairy.com</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  card: { backgroundColor: '#FFF', margin: 20, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  row: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { marginLeft: 16 },
  label: { fontSize: 13, fontWeight: '800', color: '#888', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
});