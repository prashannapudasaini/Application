import { Stack, useRouter, useSegments } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import React, { useState, useEffect, createContext, useContext } from "react";
import { COLORS } from "../../constants/theme";
import { CartProvider } from "../../context/CartContext";

// Define the User profile payload blueprint
interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: UserProfile | null; // 🔥 NEW: Stores current session user properties
  login: (userData: UserProfile) => void; // 🔥 NEW: Accept user data on login
  logout: () => void;
}>({ isAuthenticated: false, user: null, login: () => {}, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

function AuthProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null); // 🔥 Track logged in user state
  const segments = useSegments();
  const router = useRouter();

  const login = (userData: UserProfile) => {
    setUser(userData);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {Platform.OS === "web" ? (
        <View style={styles.webDesktopBackground}>
          <View style={styles.mobileMockupContainer}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <CartProvider>
      <AuthProtectedLayout />
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  webDesktopBackground: { flex: 1, backgroundColor: "#EAEAEA", justifyContent: "center", alignItems: "center", paddingVertical: 20 },
  mobileMockupContainer: { width: "100%", maxWidth: 400, height: "100%", maxHeight: 850, backgroundColor: COLORS.background, borderRadius: 40, overflow: "hidden", borderWidth: 8, borderColor: "#1A1A1A" },
});