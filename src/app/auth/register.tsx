import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../_layout";

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Error States
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // OTP Verification States
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  // Validation Logic
  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const validatePhone = (text: string) => {
    const phoneRegex = /^(?:\+977\s?)?(9[78]\d{8})$/;
    return phoneRegex.test(text.trim());
  };

  // 🔥 NEW: Comprehensive Password Validation
  const validatePassword = (text: string) => {
    // Regex checks for: Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(text);
  };

  // Generate dynamic helpful text based on what the password is missing
  const getPasswordHelperText = () => {
    if (!password)
      return "Required: 8+ chars, 1 uppercase, 1 number, 1 special char.";

    let missing = [];
    if (password.length < 8) missing.push("8+ chars");
    if (!/(?=.*[A-Z])/.test(password)) missing.push("uppercase letter");
    if (!/(?=.*\d)/.test(password)) missing.push("number");
    if (!/(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?])/.test(password))
      missing.push("special character");

    if (missing.length === 0) return "Password looks great!";
    return `Missing: ${missing.join(", ")}`;
  };

  // Step 1: Handle initial registration click
  const handleRequestOtp = () => {
    Keyboard.dismiss();
    let isValid = true;

    if (!fullName.trim()) {
      Alert.alert("Missing Fields", "Please enter your full name.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid Nepali phone number.");
      isValid = false;
    } else {
      setPhoneError("");
    }

    // 🔥 NEW: Trigger password validation check on submit
    if (!validatePassword(password)) {
      setPasswordError("Password does not meet security requirements.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      setIsOtpStep(true);
    }
  };

  // Step 2: Handle final OTP verification
  const handleVerifyAndLogin = () => {
    Keyboard.dismiss();

    if (otpCode.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }

    if (otpCode !== "123456") {
      setOtpError("Invalid code. Please try again. (Hint: use 123456)");
      return;
    }

    setOtpError("");

    login({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    });
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
      }}
      style={styles.backgroundImage}
    >
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.formContainer}>
          {!isOtpStep ? (
            // ==========================================
            // REGISTRATION FORM VIEW
            // ==========================================
            <>
              <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>
                Join Sitaram
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Sign up for pure and healthy daily deliveries.
              </Text>

              {/* Name Input */}
              <View style={styles.inputBox}>
                <Feather
                  name="user"
                  size={18}
                  color="#666"
                  style={styles.icon}
                />
                <TextInput
                  style={[
                    styles.inputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor="#777"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Email Input */}
              <View
                style={[
                  styles.inputBox,
                  emailError ? styles.inputErrorBorder : null,
                  { marginTop: 4 },
                ]}
              >
                <Feather
                  name="mail"
                  size={18}
                  color={emailError ? "#D32F2F" : "#666"}
                  style={styles.icon}
                />
                <TextInput
                  style={[
                    styles.inputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="Email Address"
                  placeholderTextColor="#777"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setEmailError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              {/* Phone Input */}
              <View
                style={[
                  styles.inputBox,
                  phoneError ? styles.inputErrorBorder : null,
                  { marginTop: emailError ? 0 : 4 },
                ]}
              >
                <Feather
                  name="phone"
                  size={18}
                  color={phoneError ? "#D32F2F" : "#666"}
                  style={styles.icon}
                />
                <TextInput
                  style={[
                    styles.inputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="+977"
                  placeholderTextColor="#777"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setPhoneError("");
                  }}
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}

              {/* Password Input */}
              <View
                style={[
                  styles.inputBox,
                  passwordError ? styles.inputErrorBorder : null,
                  { marginTop: phoneError ? 0 : 4, marginBottom: 4 },
                ]}
              >
                <Feather
                  name="lock"
                  size={18}
                  color={passwordError ? "#D32F2F" : "#666"}
                  style={styles.icon}
                />
                <TextInput
                  style={[
                    styles.inputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="Password"
                  placeholderTextColor="#777"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setPasswordError("");
                  }}
                  secureTextEntry
                />
              </View>

              {/* 🔥 NEW: Dynamic Password Helper Text */}
              <Text
                style={[
                  styles.helperText,
                  passwordError
                    ? { color: "#D32F2F", fontWeight: "600" }
                    : validatePassword(password) && password
                      ? { color: "#2E7D32" }
                      : null,
                ]}
              >
                {getPasswordHelperText()}
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleRequestOtp}
              >
                <Text style={styles.primaryBtnText}>REQUEST OTP</Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already registered? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // ==========================================
            // OTP VERIFICATION VIEW
            // ==========================================
            <>
              <TouchableOpacity
                onPress={() => setIsOtpStep(false)}
                style={styles.backIcon}
              >
                <Feather name="arrow-left" size={24} color="#1A1A1A" />
              </TouchableOpacity>

              <View style={{ alignItems: "center", marginBottom: SPACING.l }}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={48}
                  color="#800000"
                />
                <Text
                  style={[
                    styles.brandTitle,
                    { fontFamily: SAN_SERIF_FONT, marginTop: 12 },
                  ]}
                >
                  Verify Account
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  We've sent a 6-digit verification code to{"\n"}
                  <Text style={{ fontWeight: "bold", color: "#1A1A1A" }}>
                    {phone}
                  </Text>{" "}
                  and{" "}
                  <Text style={{ fontWeight: "bold", color: "#1A1A1A" }}>
                    {email}
                  </Text>
                </Text>
              </View>

              <View
                style={[
                  styles.inputBox,
                  otpError ? styles.inputErrorBorder : null,
                  { justifyContent: "center" },
                ]}
              >
                <TextInput
                  style={[
                    styles.inputField,
                    { textAlign: "center", fontSize: 20, letterSpacing: 8 },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="------"
                  placeholderTextColor="#CCC"
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val);
                    setOtpError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              {otpError ? (
                <Text style={[styles.errorText, { textAlign: "center" }]}>
                  {otpError}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={handleVerifyAndLogin}
              >
                <Text style={styles.primaryBtnText}>VERIFY & LOGIN</Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Didn't receive the code? </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Resent", "A new code has been sent.")
                  }
                >
                  <Text style={styles.linkText}>Resend</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: height },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  safeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    padding: SPACING.xl,
    borderRadius: RADIUS.large,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  backIcon: { position: "absolute", top: 20, left: 20, zIndex: 10, padding: 8 },
  brandTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: "#800000",
    textAlign: "center",
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    textAlign: "center",
    marginBottom: SPACING.l,
    marginTop: 6,
    lineHeight: 20,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCDCDC",
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    backgroundColor: "#F9F9F9",
    height: 52,
  },
  inputErrorBorder: { borderColor: "#EF9A9A", backgroundColor: "#FFEBEE" },
  errorText: {
    color: "#D32F2F",
    fontSize: 11,
    fontWeight: "600",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
  },
  helperText: {
    color: "#666",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: -4,
    marginBottom: 12,
    marginLeft: 4,
  }, // 🔥 NEW
  icon: { marginRight: SPACING.s },
  inputField: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  primaryBtn: {
    backgroundColor: "#800000",
    borderRadius: RADIUS.medium,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  footerText: { color: "#555", fontSize: 13, fontWeight: "500" },
  linkText: {
    color: "#800000",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
