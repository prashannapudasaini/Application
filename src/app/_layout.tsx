import { Stack, useRouter, useSegments } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import React, { useState, useEffect, createContext, useContext } from "react";
import { CartProvider } from "../context/CartContext"; 

interface UserProfile { name: string; email: string; phone: string; }

const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (u: UserProfile) => void;
  updateUser: (userData: Partial<UserProfile>) => void; 
  logout: () => void;
}>({ 
  isAuthenticated: false, 
  user: null, 
  login: () => {}, 
  updateUser: () => {}, 
  logout: () => {} 
});

export const useAuth = () => useContext(AuthContext);

function AuthProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
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

  const updateUser = (userData: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : { name: "Xv", email: "xv", phone: "+977 980-0000000", ...userData }));
  };

  // 🔥 FIXED: Decoupled segment conditional blocks to permanently block infinite loops
  useEffect(() => {
    if (!segments || segments.length === 0) return;

    const inAuthGroup = segments[0] === "auth";

    // 🛑 Hard stop check: Only trigger replaces if the user is out of place
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/splash");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments?.[0]]); // 👈 Only track the top-level string change, not the raw object tree array

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, updateUser, logout }}>
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
  webDesktopBackground: { 
    flex: 1, 
    backgroundColor: "#EAEAEA", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  mobileMockupContainer: { 
    width: "100%", 
    maxWidth: 400, 
    height: "100%", 
    maxHeight: 850, 
    backgroundColor: "#FAF8F5", 
    borderRadius: 40, 
    overflow: "hidden", 
    borderWidth: 8, 
    borderColor: "#1A1A1A" 
  },
});