import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
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
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { registerForPushNotificationsAsync } from "../../utils/notifications";

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // --- UNIFIED OTP STATES ---
  // otpMode can be: null, '2fa' (Admin), or 'verify_email' (New User)
  const [otpMode, setOtpMode] = useState<"2fa" | "verify_email" | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [tempEmail, setTempEmail] = useState("");

  // Enhanced Splash Animations
  const dropY = useRef(new Animated.Value(-150)).current;
  const dropScaleX = useRef(new Animated.Value(1)).current;
  const dropScaleY = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const brandingScale = useRef(new Animated.Value(0.85)).current;
  const brandingAlpha = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleAlpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Drop falls down (accelerates due to gravity)
      Animated.parallel([
        Animated.timing(dropY, {
          toValue: height * 0.35,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleY, {
          toValue: 1.4,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleX, {
          toValue: 0.7,
          duration: 550,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 2. Splat impact (squish)
      Animated.parallel([
        Animated.timing(dropScaleY, {
          toValue: 0.3,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleX, {
          toValue: 2.0,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // 3. Drop dissolves + Ripple expands + Branding elegant reveal
      Animated.parallel([
        Animated.timing(dropScaleY, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleX, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Massive, smooth ripple
        Animated.timing(rippleScale, {
          toValue: 8,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAlpha, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // Majestic brand fade-in
        Animated.timing(brandingAlpha, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(brandingScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // 4. Ripple dissipates gracefully
      Animated.timing(rippleAlpha, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Hold and fade out screen
    const exitSequenceTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 2200);

    return () => clearTimeout(exitSequenceTimer);
  }, []);

  const getInputIcon = () => {
    const text = loginId.trim();
    if (text.includes("@")) return "mail";
    if (/^\+?\d/.test(text)) return "phone";
    return "user";
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const input = loginId.trim();

    if (!input || !password.trim()) {
      setErrorText("Please fill in all fields.");
      return;
    }

    setErrorText("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const pushToken = await registerForPushNotificationsAsync();
      
      const response = await api.post("/api/auth/login.php", {
        loginId: input,
        password: password,
        push_token: pushToken || null
      });

      const data = response.data;

      if (data.status === "success") {
        const loggedInUser = data.data.user;
        login(loggedInUser); // Ensure your AuthContext handles the token if needed

        const userRole = (loggedInUser?.role || "").toLowerCase();
        if (userRole === "delivery") {
          router.replace("/delivery/dashboard");
        } else {
          router.replace("/(tabs)");
        }
      } else if (data.status === "2fa_required") {
        setOtpMode("2fa");
        setTempUserId(data.data.user_id);
        setSuccessMsg(data.message || "Security code sent to your email.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.response && error.response.data) {
        const errData = error.response.data;

        // Check if user is unverified or blocked pending OTP
        if (
          errData.require_otp ||
          (errData.message && errData.message.toLowerCase().includes("verify your email"))
        ) {
          setOtpMode("verify_email");
          setTempEmail(errData.email || input);
          setSuccessMsg(errData.message || "Please verify your email address to continue.");
        } else {
          setErrorText(errData.message || "Invalid credentials.");
        }
      } else {
        setErrorText("Network error. Could not connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();
    if (otpCode.length < 6) {
      setErrorText("Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorText("");
    setSuccessMsg("");

    try {
      if (otpMode === "2fa") {
        const pushToken = await registerForPushNotificationsAsync();
        
        const res = await api.post("/api/auth/verify_2fa.php", {
          user_id: tempUserId,
          otp_code: otpCode,
          push_token: pushToken || null
        });

        if (res.data.status === "success") {
          const { user } = res.data.data;
          login(user);

          const userRole = (user?.role || "").toLowerCase();
          if (userRole === "admin") {
            // Note: Mobile might not have an admin dashboard, falling back to default tab
            router.replace("/(tabs)");
          } else {
            router.replace("/(tabs)");
          }
        }
      } else if (otpMode === "verify_email") {
        const res = await api.post("/api/auth/verify_otp.php", {
          email: tempEmail,
          otp: otpCode,
        });

        if (res.data.status === "success") {
          setSuccessMsg("Email verified successfully! You can now log in.");
          setOtpMode(null);
          setOtpCode("");
          setPassword(""); // Clear password so they log in fresh
        }
      }
    } catch (err: any) {
      setErrorText(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.masterContainer}>
      <ImageBackground
        source={require("../../../assets/images/login_banner.jpeg")}
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
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formContainer}>
            <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>
              {otpMode === "2fa" ? "SECURITY" : otpMode === "verify_email" ? "VERIFY EMAIL" : "SITARAM"}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {otpMode === "2fa"
                ? "Two-Factor Authentication required."
                : otpMode === "verify_email"
                  ? "Activate your account."
                  : "Fresh farm dairy straight to your doorstep."}
            </Text>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {otpMode ? (
              // --- OTP VERIFICATION UI ---
              <View>
                <Text style={styles.otpInstructions}>
                  {otpMode === "2fa"
                    ? "Enter the 6-digit code sent to your registered email address."
                    : `We've sent a 6-digit verification code to ${tempEmail}.`}
                </Text>

                <View style={[styles.inputBox, errorText ? styles.inputBoxError : null]}>
                  <TextInput
                    style={[
                      styles.inputField,
                      styles.otpField,
                      Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                    ]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#777"
                    value={otpCode}
                    onChangeText={(text) => {
                      setOtpCode(text.replace(/[^0-9]/g, ""));
                      setErrorText("");
                    }}
                    maxLength={6}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.otpActionRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                      setOtpMode(null);
                      setOtpCode("");
                      setErrorText("");
                      setSuccessMsg("");
                    }}
                  >
                    <Feather name="arrow-left" size={20} color="#555" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.loginBtn, styles.flexBtn]}
                    activeOpacity={0.9}
                    onPress={handleVerifyOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.loginText}>VERIFY CODE</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // --- STANDARD LOGIN UI ---
              <View>
                <View style={[styles.inputBox, errorText ? styles.inputBoxError : null]}>
                  <Feather
                    name={getInputIcon()}
                    size={18}
                    color={errorText ? "#D32F2F" : "#666"}
                    style={styles.icon}
                  />
                  <TextInput
                    style={[
                      styles.inputField,
                      Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                    ]}
                    placeholder="Email or Phone Number"
                    placeholderTextColor="#777"
                    value={loginId}
                    onChangeText={(text) => {
                      setLoginId(text);
                      setErrorText("");
                      setSuccessMsg("");
                    }}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Feather name="lock" size={18} color="#666" style={styles.icon} />
                  <TextInput
                    style={[
                      styles.inputField,
                      Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                    ]}
                    placeholder="Password"
                    placeholderTextColor="#777"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorText("");
                      setSuccessMsg("");
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity 
                  style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 }} 
                  onPress={() => router.push("/auth/forgot-password")}
                >
                  <Text style={{ color: "#9e111a", fontSize: 13, fontWeight: "600" }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginBtn}
                  activeOpacity={0.9}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginText}>SIGN IN</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>New to Sitaram? </Text>
                  <TouchableOpacity onPress={() => router.push("/auth/register")}>
                    <Text style={styles.linkText}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>

      {/* Enhanced Splash Screen Animation */}
      {showSplash && (
        <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
          <Animated.View
            style={[
              styles.splashRipple,
              { transform: [{ scale: rippleScale }], opacity: rippleAlpha },
            ]}
          />
          <Animated.View
            style={[
              styles.milkDropContainer,
              {
                transform: [
                  { translateY: dropY },
                  { scaleX: dropScaleX },
                  { scaleY: dropScaleY },
                ],
              },
            ]}
          >
            <View style={styles.milkDrop} />
          </Animated.View>
          <Animated.View
            style={[
              styles.brandIdentityBox,
              { opacity: brandingAlpha, transform: [{ scale: brandingScale }] },
            ]}
          >
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.splashLogoGraphic}
              resizeMode="contain"
            />
            <Text style={[styles.splashBrandTitle, { fontFamily: SAN_SERIF_FONT }]}>
              SITARAM
            </Text>
            <Text style={styles.splashBrandSubtitle}>PURE DAIRY</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1 },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#800000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  milkDropContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  milkDrop: {
    width: 26,
    height: 26,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 13,
    transform: [{ rotate: "-45deg" }],
  },
  splashRipple: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  brandIdentityBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  splashLogoGraphic: {
    width: 110,
    height: 50,
    tintColor: "#FFFFFF",
    marginBottom: 12,
  },
  splashBrandTitle: {
    fontSize: 36,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: 6,
    textAlign: "center",
  },
  splashBrandSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 8,
    textAlign: "center",
    marginTop: 8,
  },
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
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    padding: SPACING.xl,
    borderRadius: RADIUS.large,
    elevation: 8,
    boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.25)",
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "300",
    color: "#800000",
    textAlign: "center",
    letterSpacing: 2,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginBottom: SPACING.xl,
    marginTop: 4,
    lineHeight: 18,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: "#EF9A9A",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  otpInstructions: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: SPACING.l,
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
    backgroundColor: "#FFF",
    height: 52,
  },
  inputBoxError: { borderColor: "#EF9A9A", backgroundColor: "#FFEBEE" },
  icon: { marginRight: SPACING.s },
  inputField: { flex: 1, fontSize: 15, color: "#1A1A1A", fontWeight: "normal" },
  otpField: {
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: "bold",
  },
  otpActionRow: {
    flexDirection: "row",
    gap: SPACING.m,
    marginTop: SPACING.s,
  },
  flexBtn: {
    flex: 1,
    marginTop: 0,
  },
  backBtn: {
    backgroundColor: "#F0F0F0",
    borderRadius: RADIUS.medium,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtn: {
    backgroundColor: "#800000",
    borderRadius: RADIUS.medium,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.s,
  },
  loginText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.l,
  },
  footerText: { color: "#555", fontSize: 13, fontWeight: "600" },
  linkText: {
    color: "#800000",
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});