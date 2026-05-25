import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SPACING } from "../../constants/theme";
import { useAuth } from "../_layout";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  // Read data dynamically from the logged-in state context
  const displayUser = user?.name || "Prasamshadhungana04";
  const displayEmail = user?.email || "prasamshadhungana04@gmail.com";
  const displayPhone = user?.phone || "+977 980-0000000";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile"); 
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.rowField}>
              <TextInput style={styles.input} value={displayUser} editable={false} />
              <TouchableOpacity style={styles.actionBadge} activeOpacity={0.7}>
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.rowField}>
              <TextInput style={styles.input} value={displayEmail} editable={false} />
              <TouchableOpacity style={styles.actionBadge} activeOpacity={0.7}>
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Account Password</Text>
            <View style={styles.rowField}>
              <TextInput style={styles.input} value="••••••••" secureTextEntry editable={false} />
              <TouchableOpacity style={styles.actionBadge} activeOpacity={0.7}>
                <Text style={styles.actionText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputWrapper, { borderBottomWidth: 0 }]}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.rowField}>
              <TextInput style={styles.input} value={displayPhone} editable={false} />
              <TouchableOpacity style={styles.actionBadge} activeOpacity={0.7}>
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

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
  input: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1A1A', padding: 0 },
  actionBadge: { backgroundColor: '#FFF0F0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(128,0,0,0.08)' },
  actionText: { fontSize: 12, fontWeight: '800', color: '#800000' },
  preferenceLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' }
});