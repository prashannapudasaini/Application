import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import ForceUpdateScreen from "../components/common/ForceUpdateScreen";
import api from "../services/api";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { fetchDeliverySettings } from "../services/deliverySettings";

// Semantic version comparison
const compareVersions = (v1: string, v2: string) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

function AuthProtectedLayout() {
  const { isAuthenticated, user, isCheckingAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // 🔥 SECURE GATEKEEPER ROUTING (RBAC PROTECTED)
  useEffect(() => {
    if (isCheckingAuth || !segments || !(segments as any).length) return;

    const inAuthGroup = segments[0] === "auth";
    const inDeliveryGroup = segments[0] === "delivery";
    const userRole = (user?.role || "").toLowerCase();

    if (!isAuthenticated && !inAuthGroup) {
      // 1. Not logged in -> redirect to splash/login
      router.replace("/auth/splash");
    } else if (isAuthenticated) {
      // 2. Logged in as DELIVERY STAFF -> enforce delivery zone
      if (userRole === "delivery") {
        if (inAuthGroup || !inDeliveryGroup) {
          router.replace("/delivery/dashboard");
        }
      }
      // 3. Logged in as CUSTOMER -> enforce customer zone
      else {
        if (inAuthGroup || inDeliveryGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [isAuthenticated, segments?.[0], isCheckingAuth, user]);

  if (isCheckingAuth) {
    return <View style={{ flex: 1, backgroundColor: "#FAF8F5" }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<any>(null);

  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        const response = await api.get("/api/settings/version.php");
        if (response.data?.status === "success") {
          const config = response.data.data;
          
          // In Expo Go, Application.nativeApplicationVersion returns Expo Go's version (e.g. 2.32), not the app's version.
          // In standalone apps, it returns the actual app versionName (e.g. 1.0.4).
          const isExpoGo = (Constants as any).appOwnership === "expo";
          const localVersion =
            (isExpoGo ? Constants.expoConfig?.version : Application.nativeApplicationVersion) ||
            Constants.expoConfig?.version ||
            "1.0.4";

          console.log("[VersionCheck] Current app version:", localVersion, "Server min:", config.android_min_version, "Server latest:", config.android_latest_version);
          
          const minRequiredVersion = Platform.OS === "ios" 
            ? config.ios_min_version 
            : config.android_min_version;

          const latestVersion = Platform.OS === "ios"
            ? config.ios_latest_version
            : config.android_latest_version;

          if (minRequiredVersion && compareVersions(localVersion, minRequiredVersion) < 0) {
            // Mandatory blocking update
            console.log("[VersionCheck] Mandatory update required!");
            setUpdateConfig(config);
            setUpdateRequired(true);
          } else if (latestVersion && compareVersions(localVersion, latestVersion) < 0) {
            // Soft update option prompt immediately on app open
            console.log("[VersionCheck] Soft update available!");
            const defaultPlayStoreUrl = "https://play.google.com/store/apps/details?id=com.sgml.app";
            const storeUrl = Platform.OS === "ios"
              ? config.store_urls?.ios || "https://apps.apple.com/app/id123456789"
              : config.store_urls?.android || defaultPlayStoreUrl;

            const updateMsg = config.update_message || `A new version (v${latestVersion}) is available. Update now to enjoy the latest dairy delivery features!`;

            if (Platform.OS === "web") {
              if (typeof window !== "undefined" && window.confirm(updateMsg)) {
                window.open(storeUrl, "_blank");
              }
            } else {
              setTimeout(() => {
                Alert.alert(
                  "Update Available",
                  updateMsg,
                  [
                    { text: "Later", style: "cancel" },
                    {
                      text: "Update Now",
                      onPress: () => {
                        Linking.openURL(storeUrl).catch(() => {
                          Linking.openURL(defaultPlayStoreUrl);
                        });
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }, 800);
            }
          }
        }
      } catch (error) {
        console.warn("Version check failed, proceeding normally:", error);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    checkAppVersion();
    fetchDeliverySettings();
    registerForPushNotificationsAsync();
  }, []);

  if (isCheckingVersion) {
    return <View style={{ flex: 1, backgroundColor: "#FAF8F5" }} />;
  }

  if (updateRequired) {
    return (
      <ForceUpdateScreen 
        message={updateConfig?.update_message}
        storeUrls={updateConfig?.store_urls || {}} 
      />
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <AuthProtectedLayout />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({});
