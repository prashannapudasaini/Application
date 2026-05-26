import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SPACING, RADIUS } from "../../constants/theme";
import { useAuth } from "../_layout"; 

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth(); // Grabbing dynamic state modifiers from context
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // State to track which field is actively being edited ('name' | 'email' | 'phone' | null)
  const [activeEditingField, setActiveEditingField] = useState<string | null>(null);

  // Local mirror states to capture changes during active typing
  const [localName, setLocalName] = useState(user?.name || "Xv");
  const [localEmail, setLocalEmail] = useState(user?.email || "xv");
  const [localPhone, setLocalPhone] = useState(user?.phone || "+977 980-0000000");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile"); 
    }
  };

  // Triggers when a button is clicked to toggle or save contextual updates
  const handleFieldAction = (fieldType: 'name' | 'email' | 'phone') => {
    if (activeEditingField === fieldType) {
      // 💾 User clicked 'Save' -> Commit changes to global Auth state machine
      if (fieldType === 'name') updateUser({ name: localName });
      if (fieldType === 'email') updateUser({ email: localEmail });
      if (fieldType === 'phone') updateUser({ phone: localPhone });
      
      setActiveEditingField(null); // Lock the input wrapper back down
    } else {
      // ✏️ User clicked edit -> Unlock exactly this input block exclusively
      setActiveEditingField(fieldType);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header Container */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Account Information</Text>
        <View style={styles.card}>
          
          {/* Full Name Input Box Container */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.rowField}>
              <TextInput 
                style={[
                  styles.input,
                  Platform.OS === 'web' && { outlineStyle: 'none' } as any
                ]} 
                value={localName} 
                onChangeText={setLocalName}
                editable={activeEditingField === 'name'} 
              />
              <TouchableOpacity 
                style={styles.actionBadge} 
                activeOpacity={0.7}
                onPress={() => handleFieldAction('name')}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === 'name' ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Address Input Box Container */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.rowField}>
              <TextInput 
                style={[
                  styles.input,
                  Platform.OS === 'web' && { outlineStyle: 'none' } as any
                ]} 
                value={localEmail} 
                onChangeText={setLocalEmail}
                editable={activeEditingField === 'email'} 
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.actionBadge} 
                activeOpacity={0.7}
                onPress={() => handleFieldAction('email')}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === 'email' ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Password Input Box Container */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Account Password</Text>
            <View style={styles.rowField}>
              <TextInput 
                style={[
                  styles.input,
                  Platform.OS === 'web' && { outlineStyle: 'none' } as any
                ]} 
                value="••••••••" 
                secureTextEntry 
                editable={false} 
              />
              <TouchableOpacity 
                style={styles.actionBadge} 
                activeOpacity={0.7}
                onPress={() => router.push('/profile/settings')}
              >
                <Text style={styles.actionText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone Number Input Box Container */}
          <View style={styles.inputWrapper} style={{ borderBottomWidth: 0 }}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.rowField}>
              <TextInput 
                style={[
                  styles.input,
                  Platform.OS === 'web' && { outlineStyle: 'none' } as any
                ]} 
                value={localPhone} 
                onChangeText={setLocalPhone}
                editable={activeEditingField === 'phone'} 
                keyboardType="phone-pad"
              />
              <TouchableOpacity 
                style={styles.actionBadge} 
                activeOpacity={0.7}
                onPress={() => handleFieldAction('phone')}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === 'phone' ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Preferences Component Module */}
        <Text style={styles.sectionLabel}>App Preferences</Text>
        <View style={styles.card}>
          <View style={[styles.rowField, { justifyContent: 'space-between', paddingVertical: 4 }]}>
            <Text style={styles.preferenceLabel}>Push Notifications</Text>
            <Switch
              trackColor={{ false: "#DCDCDC", true: "#00B894" }}
              thumbColor="#FFFFFF"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.m, paddingVertical: SPACING.m, borderBottomWidth: 1, borderColor: '#EAEAEA', backgroundColor: '#FAF8F5' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: '#1A1A1A', flex: 1, textAlign: 'center' },
  scrollContent: { padding: SPACING.m, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.s, marginLeft: 4, marginTop: SPACING.m },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: SPACING.m, borderWidth: 1, borderColor: '#F0F0F0', elevation: 1 },
  inputWrapper: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 12, marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 4 },
  rowField: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A', padding: 0, borderWidth: 0 },
  actionBadge: { backgroundColor: '#FFF0F0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(128,0,0,0.08)' },
  actionText: { fontSize: 12, fontWeight: '800', color: '#800000' },
  preferenceLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' }
});