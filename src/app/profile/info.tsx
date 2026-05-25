import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function InfoScreen() {
  const router = useRouter();
  const { page } = useLocalSearchParams();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getTitle = () => {
    if (page === 'about') return 'About Sitaram Dairy';
    if (page === 'faq') return 'Help & FAQs';
    return 'Terms & Conditions';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ABOUT US VIEW */}
        {page === 'about' && (
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Sitaram Dairy has been Nepal's trusted choice for pure, hygienic, and fresh dairy products for over two decades. We source directly from local farmers to bring premium quality Milk, Paneer, Ghee, and Dahi straight to your doorstep every single morning.
            </Text>
            <Text style={styles.subHeading}>Our Promise</Text>
            <Text style={styles.bodyText}>• 100% Farm Fresh</Text>
            <Text style={styles.bodyText}>• Standardized Quality Controls</Text>
            <Text style={styles.bodyText}>• Supporting Local Farmers</Text>
          </View>
        )}

        {/* FAQ VIEW */}
        {page === 'faq' && (
          <View style={{ gap: 12 }}>
            {[
              { q: "What are the delivery timings?", a: "Daily milk deliveries happen between 5:00 AM and 7:30 AM every morning." },
              { q: "How do I pause my delivery?", a: "Go to 'Pause/UnPause Supply' in your account settings and select your vacation dates." },
              { q: "Is there a minimum order value?", a: "No! There is no minimum restriction for subscription deliveries." }
            ].map((faq, idx) => (
              <TouchableOpacity key={idx} style={styles.faqCard} activeOpacity={0.8} onPress={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <View style={styles.faqRow}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Feather name={openFaq === idx ? "chevron-up" : "chevron-down"} size={18} color={COLORS.textSecondary} />
                </View>
                {openFaq === idx && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TERMS & CONDITIONS VIEW */}
        {page === 'terms' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Subscription Model</Text>
            <Text style={styles.bodyText}>
              Deliveries are pre-paid from your integrated digital wallet balance. Balance deductions happen after every successful deployment.
            </Text>
            <Text style={styles.sectionTitle}>2. Cancellations</Text>
            <Text style={styles.bodyText}>
              Any temporary modifications or delivery halts must be logged before 10:00 PM on the night before deployment.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  content: { padding: SPACING.m },
  card: { backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: RADIUS.large, borderWidth: 1, borderColor: COLORS.border },
  subHeading: { fontSize: 16, fontWeight: '800', marginTop: SPACING.m, marginBottom: SPACING.s, color: COLORS.text },
  bodyText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: SPACING.s, marginBottom: 4, color: COLORS.text },
  faqCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.medium, padding: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1, paddingRight: 10 },
  faqAnswer: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.s, lineHeight: 18, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 }
});