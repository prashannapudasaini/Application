import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InfoScreen() {
  const { title } = useLocalSearchParams();
  const router = useRouter();

  // Dynamic content switcher
  const getContent = () => {
    switch (title) {
      case 'About us':
        return "Sitaram Dairy is dedicated to delivering farm-fresh, chemical-free milk directly to your doorstep. Our journey began with a mission to bring pure, healthy nutrition to every household.";
      case 'FAQ':
        return "Q: How do I pause my delivery?\nA: Go to Profile > Pause/UnPause Supply.\n\nQ: What are the delivery times?\nA: We deliver fresh milk between 5:00 AM and 7:00 AM daily.";
      case 'Terms & Conditions':
        return "1. All orders must be placed by 9 PM for next-day delivery.\n2. Payment must be cleared via the wallet at least 24 hours in advance.\n3. Damaged goods must be reported within 2 hours of delivery.";
      default:
        return "Information currently unavailable.";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || "Information"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.bodyText}>{getContent()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  scroll: { padding: 24 },
  bodyText: { fontSize: 16, lineHeight: 26, color: '#444', fontWeight: '500' }
});