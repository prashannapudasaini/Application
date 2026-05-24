import { Stack } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webDesktopBackground}>
        <View style={styles.mobileMockupContainer}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  webDesktopBackground: {
    flex: 1,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  mobileMockupContainer: {
    width: "100%",
    maxWidth: 400,
    height: "100%",
    maxHeight: 850,
    backgroundColor: COLORS.background,
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 8,
    borderColor: "#1A1A1A",
  },
});
