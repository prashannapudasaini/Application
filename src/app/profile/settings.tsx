import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('Prashant Sharma');
  const [email, setEmail] = useState('prashant@example.com');
  const [phone, setPhone] = useState('+977 980-0000000');
  const [password, setPassword] = useState('********');
  
  const [notifications, setNotifications] = useState(true);

  const handleUpdate = (field: string) => {
    Alert.alert('Success', `${field} updated successfully!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.card}>
          
          {/* 1. Change Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.row}>
              <TextInput value={username} onChangeText={setUsername} style={styles.fieldInput} />
              <TouchableOpacity style={styles.saveInlineBtn} onPress={() => handleUpdate('Name')}>
                <Text style={styles.saveInlineText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Change Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.row}>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.fieldInput} />
              <TouchableOpacity style={styles.saveInlineBtn} onPress={() => handleUpdate('Email')}>
                <Text style={styles.saveInlineText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Change Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Password</Text>
            <View style={styles.row}>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.fieldInput} />
              <TouchableOpacity style={styles.saveInlineBtn} onPress={() => handleUpdate('Password')}>
                <Text style={styles.saveInlineText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Change Phone Number */}
          <View style={styles.inputGroupLast}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.row}>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.fieldInput} />
              <TouchableOpacity style={styles.saveInlineBtn} onPress={() => handleUpdate('Phone number')}>
                <Text style={styles.saveInlineText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.card}>
          <View style={styles.switchRowLast}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  scrollContent: { padding: SPACING.m },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.s, marginTop: SPACING.m },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.large, paddingHorizontal: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  inputGroup: { paddingVertical: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  inputGroupLast: { paddingVertical: SPACING.m },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text, paddingVertical: 4 },
  saveInlineBtn: { backgroundColor: 'rgba(161, 18, 23, 0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.small },
  saveInlineText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  switchRowLast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.m },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});