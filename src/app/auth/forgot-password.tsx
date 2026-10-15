import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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

const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.post("/api/auth/forgot_password_send_otp.php", {
        email: email.trim(),
      });

      if (response.data.status === "success") {
        setSuccessMsg(response.data.message || "Verification code sent to your email.");
        setStep(2);
      } else {
        setErrorMsg(response.data.message || "Failed to send code.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      setErrorMsg("Please enter both the OTP and your new password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.post("/api/auth/forgot_password_reset.php", {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      if (response.data.status === "success") {
        Alert.alert(
          "Success",
          response.data.message || "Password reset successfully! You can now log in."
        );
        router.replace("/auth/login");
      } else {
        setErrorMsg(response.data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: SPACING.xl }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <TouchableOpacity 
                style={styles.backBtn}
                onPress={() => {
                  if (step === 2) {
                    setStep(1);
                    setErrorMsg("");
                    setSuccessMsg("");
                  } else {
                    router.back();
                  }
                }}
              >
                <Feather name="arrow-left" size={24} color="#1A1A1A" />
              </TouchableOpacity>

              <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </Text>
              
              <Text style={styles.welcomeSubtitle}>
                {step === 1 
                  ? "Enter your registered email address and we will send you a 6-digit OTP code."
                  : `Enter the code sent to ${email} along with your new password.`}
              </Text>

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
              {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

              {step === 1 ? (
                <>
                  <View style={[styles.inputBox, errorMsg ? styles.inputErrorBorder : null]}>
                    <Feather name="mail" size={18} color="#666" style={styles.icon} />
                    <TextInput
                      style={[styles.inputField, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                      placeholder="Email Address"
                      placeholderTextColor="#777"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        setErrorMsg("");
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.9}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>SEND CODE</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={[styles.inputBox, errorMsg ? styles.inputErrorBorder : null]}>
                    <TextInput
                      style={[styles.inputField, styles.otpField, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                      placeholder="• • • • • •"
                      placeholderTextColor="#CCC"
                      value={otp}
                      onChangeText={(val) => {
                        setOtp(val.replace(/[^0-9]/g, ""));
                        setErrorMsg("");
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={[styles.inputBox, errorMsg ? styles.inputErrorBorder : null]}>
                    <Feather name="lock" size={18} color="#666" style={styles.icon} />
                    <TextInput
                      style={[styles.inputField, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                      placeholder="New Password"
                      placeholderTextColor="#777"
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        setErrorMsg("");
                      }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.9}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>RESET PASSWORD</Text>
                    )}
                  </TouchableOpacity>
                </>
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
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: "#9e111a",
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    textAlign: "center",
    marginBottom: SPACING.xl,
    marginTop: 8,
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
  icon: { marginRight: SPACING.s },
  inputField: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  otpField: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#002147",
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
});
