import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

export default function RegisterScreen() {
  const router = useRouter();

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState("");

  // Error States
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [addressError, setAddressError] = useState("");

  // OTP & API States
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Validation Logic
  const validateEmail = (text: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  const validatePhone = (text: string) =>
    /^(?:\+977\s?)?(9\d{9})$/.test(text.trim());
  const validatePassword = (text: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(
      text,
    );

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

  // --- STEP 1: REQUEST VERIFICATION CODE ---
  const handleRequestOtp = async () => {
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
      setPhoneError("Please enter a valid 10-digit phone number.");
      isValid = false;
    } else {
      setPhoneError("");
    }
    if (!validatePassword(password)) {
      setPasswordError("Password does not meet security requirements.");
      isValid = false;
    } else {
      setPasswordError("");
    }
    if (!address.trim()) {
      setAddressError("Delivery address is required.");
      isValid = false;
    } else {
      setAddressError("");
    }

    if (isValid) {
      setIsRequestingOtp(true);
      try {
        const response = await api.post("/api/auth/send_register_otp.php", {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        });

        if (response.data.status === "success") {
          setIsOtpStep(true);
          setOtpError("");
          setOtpCode(""); // Reset any previous codes
        }
      } catch (error: any) {
        Alert.alert(
          "Verification Error",
          error.response?.data?.message || "Failed to send verification code."
        );
      } finally {
        setIsRequestingOtp(false);
      }
    }
  };

  // --- OPTIONAL: RESEND VERIFICATION CODE ---
  const handleResendOtp = async () => {
    if (isRegistering || isRequestingOtp) return;

    try {
      Alert.alert("Sending...", "Requesting a new verification code.");
      const response = await api.post("/api/auth/send_register_otp.php", {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });

      if (response.data.status === "success") {
        Alert.alert("Sent", "A new code has been sent to your email.");
      }
    } catch (error: any) {
      setOtpError(error.response?.data?.message || "Failed to resend code.");
    }
  };

  // --- STEP 2: VERIFY AND CREATE ACCOUNT ---
  const handleVerifyAndRegister = async () => {
    Keyboard.dismiss();

    if (otpCode.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }

    setOtpError("");
    setIsRegistering(true);

    try {
      const response = await api.post("/api/auth/register.php", {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
        address: address.trim(),
        otp: otpCode, // 🔥 Passing the Real OTP to Backend
      });

      if (response.data.status === "success") {
        Alert.alert(
          "Welcome!",
          response.data.message || "Account verified and created successfully. Please sign in."
        );
        router.replace("/auth/login");
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setOtpError(error.response.data.message || "Invalid or expired code.");
      } else {
        setOtpError("Network error. Could not connect to the server.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/register_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView 
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: SPACING.xl }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
          {!isOtpStep ? (
            <>
              <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>
                Join Sitaram
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Sign up for pure and healthy daily deliveries.
              </Text>

              {/* Name Input */}
              <View style={styles.inputBox}>
                <Feather name="user" size={18} color="#666" style={styles.icon} />
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
              <View style={[styles.inputBox, emailError ? styles.inputErrorBorder : null]}>
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
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              {/* Phone Input */}
              <View style={[styles.inputBox, phoneError ? styles.inputErrorBorder : null]}>
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
                  placeholder="Phone Number"
                  placeholderTextColor="#777"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setPhoneError("");
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

              {/* Address Input */}
              <View style={[styles.inputBox, addressError ? styles.inputErrorBorder : null]}>
                <Feather
                  name="map-pin"
                  size={18}
                  color={addressError ? "#D32F2F" : "#666"}
                  style={styles.icon}
                />
                <TextInput
                  style={[
                    styles.inputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="Delivery Address"
                  placeholderTextColor="#777"
                  value={address}
                  onChangeText={(val) => {
                    setAddress(val);
                    setAddressError("");
                  }}
                />
              </View>
              {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

              {/* Password Input */}
              <View style={[styles.inputBox, passwordError ? styles.inputErrorBorder : null]}>
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
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={passwordError ? "#D32F2F" : "#666"} />
                </TouchableOpacity>
              </View>
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
                disabled={isRequestingOtp}
              >
                {isRequestingOtp ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>REQUEST OTP</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already registered? </Text>
                <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // ==========================================
            // STEP 2: OTP VERIFICATION
            // ==========================================
            <View style={styles.otpViewContainer}>
              <TouchableOpacity
                onPress={() => setIsOtpStep(false)}
                style={styles.backIcon}
                disabled={isRegistering}
              >
                <Feather name="arrow-left" size={24} color="#1A1A1A" />
              </TouchableOpacity>

              <View style={styles.otpHeaderBox}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={54}
                  color="#800000"
                />
                <Text
                  style={[
                    styles.brandTitle,
                    { fontFamily: SAN_SERIF_FONT, marginTop: 16 },
                  ]}
                >
                  Verify Account
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  We've sent a 6-digit verification code to{"\n"}
                  <Text style={{ fontWeight: "800", color: "#1A1A1A" }}>
                    {email}
                  </Text>
                </Text>
              </View>

              <View
                style={[
                  styles.otpInputContainer,
                  otpError ? { borderColor: "#D32F2F" } : null,
                ]}
              >
                <TextInput
                  style={[
                    styles.otpInputField,
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  placeholder="- - - - - -"
                  placeholderTextColor="#CCC"
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val.replace(/[^0-9]/g, ""));
                    setOtpError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isRegistering}
                />
              </View>

              {otpError ? (
                <Text style={styles.otpErrorText}>{otpError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, isRegistering && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={handleVerifyAndRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>VERIFY & REGISTER</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={handleResendOtp} disabled={isRegistering || isRequestingOtp}>
                  <Text
                    style={[
                      styles.linkText,
                      {
                        textDecorationLine: "none",
                        borderBottomWidth: 1,
                        borderBottomColor: "#800000",
                      },
                    ]}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  safeContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    padding: SPACING.xl,
    borderRadius: RADIUS.large,
    elevation: 8,
    boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.25)",
  },
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
  },
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
  linkText: { color: "#800000", fontSize: 13, fontWeight: "900" },
  otpViewContainer: { position: "relative", paddingTop: SPACING.m },
  backIcon: {
    position: "absolute",
    top: -10,
    left: -10,
    zIndex: 10,
    padding: 8,
  },
  otpHeaderBox: { alignItems: "center", marginBottom: SPACING.m },
  otpInputContainer: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: RADIUS.medium,
    backgroundColor: "#FAFAFA",
    height: 60,
    marginBottom: SPACING.m,
    justifyContent: "center",
  },
  otpInputField: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: "600",
    color: "#1A1A1A",
    width: "100%",
    height: "100%",
  },
  otpErrorText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: SPACING.m,
    marginTop: -4,
  },
});