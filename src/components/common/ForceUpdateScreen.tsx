import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { RADIUS, SPACING } from "../../constants/theme";

const { height } = Dimensions.get("window");
const SAN_SERIF_FONT = Platform.select({
  ios: "System",
  android: "sans-serif-light",
  web: "Inter, sans-serif",
});

interface ForceUpdateScreenProps {
  message?: string;
  storeUrls: {
    android?: string;
    ios?: string;
  };
}

export default function ForceUpdateScreen({
  message = "A new version of the Sitaram Dairy app is available. Please update to continue enjoying fresh dairy deliveries!",
  storeUrls,
}: ForceUpdateScreenProps) {
  const handleUpdate = () => {
    const defaultPlayStoreUrl = "https://play.google.com/store/apps/details?id=com.sgml.app";
    const url =
      Platform.OS === "ios"
        ? storeUrls?.ios || "https://apps.apple.com/app/id123456789"
        : storeUrls?.android || defaultPlayStoreUrl;

    Linking.openURL(url).catch(() => {
      Linking.openURL(defaultPlayStoreUrl);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="arrow-up-circle" size={64} color="#800000" />
        </View>

        <Text style={[styles.title, { fontFamily: SAN_SERIF_FONT }]}>
          Update Required
        </Text>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.featuresBox}>
          <View style={styles.featureRow}>
            <Feather name="check" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>Performance improvements</Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="check" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>Bug fixes</Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="check" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>New features</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.9}>
          <Text style={styles.updateBtnText}>UPDATE NOW</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: SPACING.m,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.m,
  },
  featuresBox: {
    backgroundColor: "#FFF",
    padding: SPACING.l,
    borderRadius: RADIUS.large,
    width: "100%",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#444",
    marginLeft: 12,
    fontWeight: "500",
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : SPACING.xl,
  },
  updateBtn: {
    backgroundColor: "#800000",
    paddingVertical: 18,
    borderRadius: RADIUS.large,
    alignItems: "center",
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  updateBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
