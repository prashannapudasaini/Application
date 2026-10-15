import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Safe dummy Marker for Web so imports don't fail
export const Marker = ({ children }: any) => <>{children}</>;
export const PROVIDER_GOOGLE = "google";

export default function MapView(props: any) {
  return (
    <View style={[styles.webFallback, props.style]}>
      <Text style={styles.title}>🗺️ Interactive Map</Text>
      <Text style={styles.subtitle}>
        Map view is available on the iOS and Android Sitaram Dairy app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    minHeight: 250,
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#DCDCDC",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
  },
});
