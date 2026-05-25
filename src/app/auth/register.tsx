import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { RADIUS, SPACING } from "../../constants/theme"; 
import { useAuth } from "../_layout";

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({ ios: "System", android: "sans-serif-light", web: "Inter, sans-serif" });

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    login({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: "+977 980-0000000" 
    });
  };

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80" }}
      style={styles.backgroundImage}
    >
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.formContainer}>
          <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>Join Sitaram</Text>
          <Text style={styles.welcomeSubtitle}>Sign up for pure and healthy daily deliveries.</Text>

          <View style={styles.inputBox}>
            <Feather name="user" size={18} color="#666" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Full Name"
              placeholderTextColor="#777"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputBox}>
            <Feather name="mail" size={18} color="#666" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Email Address"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputBox}>
            <Feather name="lock" size={18} color="#666" style={styles.icon} />
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              placeholderTextColor="#777"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.9} onPress={handleRegister}>
            <Text style={styles.loginText}>CREATE ACCOUNT</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: height },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  safeContainer: { flex: 1, justifyContent: "center", paddingHorizontal: SPACING.xl },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    padding: SPACING.xl,
    borderRadius: RADIUS.large,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  brandTitle: { fontSize: 30, fontWeight: "300", color: "#800000", textAlign: "center", letterSpacing: 1 },
  welcomeSubtitle: { fontSize: 13, fontWeight: "600", color: "#444", textAlign: "center", marginBottom: SPACING.xl, marginTop: 4, lineHeight: 18 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCDCDC",
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    backgroundColor: "#FFF",
    height: 52,
  },
  icon: { marginRight: SPACING.s },
  inputField: { flex: 1, fontSize: 14, color: "#1A1A1A", fontWeight: "700" },
  loginBtn: { backgroundColor: "#800000", borderRadius: RADIUS.medium, paddingVertical: 16, alignItems: "center", marginTop: SPACING.s },
  loginText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: SPACING.l },
  footerText: { color: "#555", fontSize: 13, fontWeight: "600" },
  linkText: { color: "#800000", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
});