import { Stack } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/theme";
import { CartProvider } from "../context/CartContext"; // <-- 1. Import your Cart Provider

export default function RootLayout() {
  // 2. Wrap everything in CartProvider so the whole app shares the same memory
  return (
    <CartProvider>
      {Platform.OS === "web" ? (
        <View style={styles.webDesktopBackground}>
          <View style={styles.mobileMockupContainer}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </CartProvider>
  );
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
