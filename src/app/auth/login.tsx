import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
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

// Web Iframe Support
import * as Location from "expo-location"; // 🔥 NEW: Required for searching places
import { createElement } from "react-native";

// Safe dynamic import for Native Maps (iOS/Android)
let MapView: any;
let Marker: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const mapRef = useRef<any>(null); // 🔥 NEW: Ref to control the map camera

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);

  // Coordinates & Search State
  const [selectedCoordinate, setSelectedCoordinate] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const NEPAL_REGION = {
    latitude: 28.3949,
    longitude: 84.124,
    latitudeDelta: 4.5,
    longitudeDelta: 4.5,
  };

  // Splash Animations
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
      }).start(() => setShowSplash(false));
    }, 1650);

    return () => clearTimeout(exitSequenceTimer);
  }, []);

  const getInputIcon = () => {
    const text = loginId.trim();
    if (text.includes("@")) return "mail";
    if (/^\+?\d/.test(text)) return "phone";
    return "user";
  };

  const initiateLoginProcess = () => {
    Keyboard.dismiss();
    const input = loginId.trim();

    if (!input || !password.trim()) {
      setErrorText("Please fill in all fields.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isPhone = /^(?:\+977\s?)?(9[78]\d{8})$/.test(input);

    if (!isEmail && !isPhone) {
      setErrorText("Enter a valid email or Nepali phone number.");
      return;
    }

    setErrorText("");

    let derivedName = "Sitaram Member";
    let finalEmail = "user@sitaramdairy.com";
    let finalPhone = "+977 980-0000000";

    if (isEmail) {
      const emailPrefix = input.split("@")[0];
      derivedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      finalEmail = input.toLowerCase();
    } else {
      derivedName = `Member ${input.slice(-4)}`;
      finalPhone = input;
    }

    setPendingUserData({
      name: derivedName,
      email: finalEmail,
      phone: finalPhone,
    });
    setShowLocationModal(true);
  };

  // 🔥 NEW: Map Search Execution Logic
  const executeMapSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);

    try {
      if (Platform.OS !== "web") {
        // Native Map Search (Geocoding)
        const geocodeResults = await Location.geocodeAsync(
          `${searchQuery}, Nepal`,
        );
        if (geocodeResults.length > 0) {
          const { latitude, longitude } = geocodeResults[0];
          setSelectedCoordinate({ latitude, longitude });

          // Animate Map Camera to the searched location
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000,
          );
        } else {
          Alert.alert(
            "Location Not Found",
            "Try entering a broader area name (e.g., 'Lazimpat, Kathmandu').",
          );
        }
      } else {
        // Web Map Search is handled instantly by the iframe re-rendering with the new query
      }
    } catch (error) {
      console.warn("Geocoding Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const finalizeLoginWithLocation = () => {
    const locationString =
      Platform.OS === "web"
        ? searchQuery || "Kathmandu, Nepal"
        : `Lat: ${selectedCoordinate.latitude.toFixed(4)}, Lng: ${selectedCoordinate.longitude.toFixed(4)}`;

    setShowLocationModal(false);
    login({ ...pendingUserData, location: locationString });
  };

  // 🔥 UPDATED: Dynamic Google Maps Iframe Renderer for Web
  const WebGoogleMap = () => {
    if (Platform.OS !== "web") return null;

    // Inject the search query directly into the Google Maps URL so the map visibly jumps to that place
    const query = searchQuery
      ? encodeURIComponent(searchQuery + " Nepal")
      : "Kathmandu Nepal";
    const mapUrl = `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return createElement("iframe", {
      src: mapUrl,
      style: { width: "100%", height: "100%", border: "none" },
      allowFullScreen: false,
      loading: "lazy",
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

            {errorText ? (
              <Text style={styles.errorText}>{errorText}</Text>
            ) : null}

            <View
              style={[styles.inputBox, errorText ? styles.inputBoxError : null]}
            >
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
                placeholder="Email Address or Phone Number"
                placeholderTextColor="#777"
                value={loginId}
                onChangeText={(text) => {
                  setLoginId(text);
                  setErrorText("");
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
                }}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.9}
              onPress={initiateLoginProcess}
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

      {/* Splash Screen Animation */}
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

      {/* Unified Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={Platform.OS === "web"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Delivery Location</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Feather name="x" size={24} color="#050505" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            {/* 🔥 NEW: Floating Universal Search Bar */}
            <View style={styles.mapSearchBar}>
              <TextInput
                style={[
                  styles.mapSearchInput,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
                placeholder="Search place in Nepal..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={executeMapSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.mapSearchBtn}
                onPress={executeMapSearch}
                disabled={isSearching}
              >
                <Feather name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {Platform.OS !== "web" ? (
              // NATIVE MOBILE INTERACTIVE MAP
              <>
                <MapView
                  ref={mapRef} // Connected ref for camera animation
                  style={styles.map}
                  initialRegion={NEPAL_REGION}
                  minZoomLevel={5}
                >
                  <Marker
                    coordinate={selectedCoordinate}
                    draggable
                    onDragEnd={(e: any) =>
                      setSelectedCoordinate(e.nativeEvent.coordinate)
                    }
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={48}
                      color="#800000"
                    />
                  </Marker>
                </MapView>
                <View style={styles.floatingBanner}>
                  <Feather name="info" size={16} color="#800000" />
                  <Text style={styles.bannerText}>
                    Hold and drag the pin to your exact location
                  </Text>
                </View>
              </>
            ) : (
              // WEB GOOGLE MAPS IFRAME VIEW
              <View style={styles.map}>
                <WebGoogleMap />
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.coordinatesText}>
              {Platform.OS !== "web"
                ? `${selectedCoordinate.latitude.toFixed(4)}, ${selectedCoordinate.longitude.toFixed(4)}`
                : searchQuery
                  ? `Searching: ${searchQuery}`
                  : "Type a location to center map"}
            </Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={finalizeLoginWithLocation}
            >
              <Text style={styles.confirmBtnText}>Confirm & Enter App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Location Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: Platform.OS === "web" ? "auto" : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E4E6EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#050505" },
  mapWrapper: { flex: 1, position: "relative", backgroundColor: "#F2F2F6" },
  map: { width: "100%", height: "100%" },

  // 🔥 Map Search Bar Styles
  mapSearchBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    height: 54,
  },
  mapSearchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#050505",
  },
  mapSearchBtn: {
    backgroundColor: "#800000",
    width: 54,
    height: 54,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  floatingBanner: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#050505",
    marginLeft: 8,
  },

  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E4E6EB",
  },
  coordinatesText: {
    textAlign: "center",
    fontSize: 13,
    color: "#65676B",
    marginBottom: 12,
    fontWeight: "500",
  },
  confirmBtn: {
    backgroundColor: "#800000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
