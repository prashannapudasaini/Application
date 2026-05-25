import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  const dropY = useRef(new Animated.Value(-150)).current;
  const dropScaleX = useRef(new Animated.Value(1)).current;
  const dropScaleY = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const brandingScale = useRef(new Animated.Value(0.5)).current;
  const brandingAlpha = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleAlpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropY, {
          toValue: height * 0.35,
          duration: 650,
          easing: Easing.bezier(0.33, 1, 0.68, 1),
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleY, {
          toValue: 1.3,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleX, {
          toValue: 0.8,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(dropScaleY, {
          toValue: 0.4,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(dropScaleX, {
          toValue: 1.5,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
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
        Animated.timing(rippleScale, {
          toValue: 3.5,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAlpha, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(brandingAlpha, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(brandingScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rippleAlpha, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const exitSequenceTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 1650);

    return () => clearTimeout(exitSequenceTimer);
  }, []);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;

    const derivedName = email.split("@")[0];
    const formattedName =
      derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

    login({
      name: formattedName,
      email: email.toLowerCase().trim(),
      phone: "+977 980-0000000",
    });
  };

  return (
    <View style={styles.masterContainer}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80",
        }}
        style={styles.backgroundImage}
      >
        <View style={styles.darkOverlay} />
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.formContainer}>
            <Text style={[styles.brandTitle, { fontFamily: SAN_SERIF_FONT }]}>
              SITARAM
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Fresh farm dairy straight to your doorstep.
            </Text>

            <View style={styles.inputBox}>
              <Feather name="mail" size={18} color="#666" style={styles.icon} />
              <TextInput
                // 🔥 FIX: Web outline suppressed
                style={[
                  styles.inputField,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
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
                // 🔥 FIX: Web outline suppressed
                style={[
                  styles.inputField,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
                placeholder="Password"
                placeholderTextColor="#777"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.9}
              onPress={handleLogin}
            >
              <Text style={styles.loginText}>SIGN IN</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to Sitaram? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {showSplash && (
        <Animated.View
          style={[styles.splashContainer, { opacity: splashOpacity }]}
        >
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
            <Text
              style={[styles.splashBrandTitle, { fontFamily: SAN_SERIF_FONT }]}
            >
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
    top: "38.5%",
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

  backgroundImage: { flex: 1, width: "100%", height: height },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  safeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
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
  inputField: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "normal", // 🔥 FIX: Clean, normal text weight
  },
  loginBtn: {
    backgroundColor: "#800000",
    borderRadius: RADIUS.medium,
    paddingVertical: 16,
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
