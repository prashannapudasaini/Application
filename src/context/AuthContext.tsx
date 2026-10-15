import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// 🔥 UPGRADED: Added all the fields your backend actually returns
export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role?: string;
  api_token?: string;
  loyalty_points?: number;
  subscription_count?: number;
}

const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (u: UserProfile, token?: string) => Promise<void>;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  isCheckingAuth: boolean;
}>({
  isAuthenticated: false,
  user: null,
  login: async () => { },
  updateUser: async () => { },
  logout: async () => { },
  isCheckingAuth: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("sitaram_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    loadUser();
  }, []);

  const login = async (userData: UserProfile, token?: string) => {
    // If a token is passed, bundle it with the user data for easy access
    const userToSave = token ? { ...userData, api_token: token } : userData;

    setUser(userToSave);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("sitaram_user", JSON.stringify(userToSave));

    // Also save token separately for easy Axios interceptor access later
    if (token || userData.api_token) {
      await AsyncStorage.setItem("sitaram_token", token || userData.api_token || "");
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem("sitaram_user");
    await AsyncStorage.removeItem("sitaram_token");
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    setUser((prev) => {
      // 🔥 FIXED: Prevent creating a fake "Xv" user if logged out
      if (!prev) return null;

      const updatedUser = { ...prev, ...userData };

      AsyncStorage.setItem("sitaram_user", JSON.stringify(updatedUser)).catch(
        console.error,
      );
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        updateUser,
        logout,
        isCheckingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}