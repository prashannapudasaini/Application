import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../_layout";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Field Management States
  const [activeEditingField, setActiveEditingField] = useState<string | null>(
    null,
  );

  // Local Data States
  const [localName, setLocalName] = useState(user?.name || "Xv");
  const [localEmail, setLocalEmail] = useState(user?.email || "");
  const [localPhone, setLocalPhone] = useState(user?.phone || "+977 ");
  // Using Tokha, Bagmati Province as the fallback registered location
  const [localLocation, setLocalLocation] = useState(
    (user as any)?.location || "Tokha, Bagmati Province, Nepal",
  );

  // Error States
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Password Modal States
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateNepaliPhone = (phone: string) => {
    const nepalPhoneRegex = /^(?:\+977\s?)?(9[78]\d{8})$/;
    return nepalPhoneRegex.test(phone.trim());
  };

  const handleSave = (fieldType: "name" | "email" | "phone" | "location") => {
    Keyboard.dismiss();

    if (fieldType === "name") {
      if (localName.trim().length < 2) return;
      updateUser({ name: localName });
      setActiveEditingField(null);
    }

    if (fieldType === "email") {
      if (!validateEmail(localEmail)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      setEmailError("");
      updateUser({ email: localEmail });
      setActiveEditingField(null);
    }

    if (fieldType === "phone") {
      if (!validateNepaliPhone(localPhone)) {
        setPhoneError("Enter a valid Nepali number (e.g. 98...)");
        return;
      }
      setPhoneError("");
      updateUser({ phone: localPhone });
      setActiveEditingField(null);
    }

    if (fieldType === "location") {
      if (localLocation.trim().length < 3) return;
      // Note: Make sure your AuthContext UserProfile interface supports 'location'
      updateUser({ location: localLocation } as any);
      setActiveEditingField(null);
    }
  };

  const toggleEdit = (fieldType: "name" | "email" | "phone" | "location") => {
    if (activeEditingField === fieldType) {
      handleSave(fieldType);
    } else {
      setEmailError("");
      setPhoneError("");
      setActiveEditingField(fieldType);
    }
  };

  const handlePasswordUpdate = () => {
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordError("");
    setPasswordModalVisible(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert("Password successfully updated!");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#050505" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>Personal Details</Text>
        <View style={styles.sectionBlock}>
          {/* 👤 NAME FIELD (Stacked Layout) */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#65676B"
                />
                <Text style={styles.fieldLabel}>Name</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleEdit("name")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === "name" ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                activeEditingField === "name" && styles.inputActive,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              value={localName}
              onChangeText={setLocalName}
              editable={activeEditingField === "name"}
            />
          </View>
          <View style={styles.divider} />

          {/* ✉️ EMAIL FIELD */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={emailError ? "#D32F2F" : "#65676B"}
                />
                <Text
                  style={[
                    styles.fieldLabel,
                    emailError ? { color: "#D32F2F" } : null,
                  ]}
                >
                  Email
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleEdit("email")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === "email" ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                activeEditingField === "email" && styles.inputActive,
                emailError ? styles.inputError : null,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              value={localEmail}
              onChangeText={(val) => {
                setLocalEmail(val);
                setEmailError("");
              }}
              editable={activeEditingField === "email"}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>
          <View style={styles.divider} />

          {/* 📞 PHONE FIELD */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color={phoneError ? "#D32F2F" : "#65676B"}
                />
                <Text
                  style={[
                    styles.fieldLabel,
                    phoneError ? { color: "#D32F2F" } : null,
                  ]}
                >
                  Phone
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleEdit("phone")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === "phone" ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                activeEditingField === "phone" && styles.inputActive,
                phoneError ? styles.inputError : null,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              value={localPhone}
              onChangeText={(val) => {
                setLocalPhone(val);
                setPhoneError("");
              }}
              editable={activeEditingField === "phone"}
              keyboardType="phone-pad"
              maxLength={14}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </View>
          <View style={styles.divider} />

          {/* 📍 LOCATION FIELD */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={20}
                  color="#65676B"
                />
                <Text style={styles.fieldLabel}>Location</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleEdit("location")}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>
                  {activeEditingField === "location" ? "Save" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                activeEditingField === "location" && styles.inputActive,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              value={localLocation}
              onChangeText={setLocalLocation}
              editable={activeEditingField === "location"}
              multiline={false}
            />
          </View>
        </View>

        <Text style={styles.sectionHeader}>Security</Text>
        <View style={styles.sectionBlock}>
          <TouchableOpacity
            style={styles.securityRow}
            activeOpacity={0.6}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.fieldHeaderLeft}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={22}
                color="#65676B"
              />
              <Text style={styles.securityLabel}>Change Password</Text>
            </View>
            <View style={styles.securityRight}>
              <Text style={styles.mutedText}>Update</Text>
              <Feather
                name="chevron-right"
                size={20}
                color="#BEC3C9"
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.sectionBlock}>
          <View style={styles.securityRow}>
            <View style={styles.fieldHeaderLeft}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={22}
                color="#65676B"
              />
              <Text style={styles.securityLabel}>Push Notifications</Text>
            </View>
            <View style={styles.securityRight}>
              <Switch
                trackColor={{ false: "#E4E6EB", true: "#050505" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E4E6EB"
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 🔐 PASSWORD CHANGE MODAL */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Feather name="x" size={24} color="#050505" />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <Text style={styles.modalError}>{passwordError}</Text>
            ) : null}

            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={[
                styles.modalInput,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={[
                styles.modalInput,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={[
                styles.modalInput,
                Platform.OS === "web" && ({ outlineStyle: "none" } as any),
              ]}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handlePasswordUpdate}
            >
              <Text style={styles.modalSaveBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#050505",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 20 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#65676B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 12,
    marginTop: 16,
  },
  sectionBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },

  // 🔥 NEW STACKED LAYOUT STYLES
  fieldContainer: { paddingVertical: 12, paddingHorizontal: 16 },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldHeaderLeft: { flexDirection: "row", alignItems: "center" },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#65676B",
    marginLeft: 8,
  },

  // 🔥 INPUTS NOW ALIGN LEFT AND SIT BELOW THE HEADER
  input: {
    fontSize: 16,
    color: "#050505",
    textAlign: "left",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
    marginLeft: 24,
  },
  inputActive: { backgroundColor: "#F0F2F5", borderColor: "#E4E6EB" },
  inputError: {
    backgroundColor: "#FFEBEE",
    color: "#D32F2F",
    borderColor: "#EF9A9A",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D32F2F",
    marginLeft: 36,
    marginTop: 4,
  },

  actionBtn: { paddingVertical: 4, paddingLeft: 8 },
  actionText: { fontSize: 14, fontWeight: "700", color: "#800000" },
  divider: { height: 1, backgroundColor: "#E4E6EB", marginLeft: 44 },

  // SECURITY & PREFERENCES SINGLE ROW LAYOUT
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  securityLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#050505",
    marginLeft: 12,
  },
  securityRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mutedText: { fontSize: 15, color: "#65676B" },

  // PASSWORD MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#050505" },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#65676B",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#050505",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  modalError: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  modalSaveBtn: {
    backgroundColor: "#800000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  modalSaveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
