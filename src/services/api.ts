// src/services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constants/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Automatically attach standard Authorization token without triggering CORS preflight blocks
api.interceptors.request.use(
  async (config) => {
    try {
      const storedUser = await AsyncStorage.getItem("sitaram_user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Standard Bearer token authentication (rarely blocked by CORS)
        if (parsedUser.token || parsedUser.api_token) {
          config.headers["Authorization"] =
            `Bearer ${parsedUser.token || parsedUser.api_token}`;
        }
      }
    } catch (error) {
      console.error("Error loading auth token for API request:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call - Token may be expired.");
    }
    return Promise.reject(error);
  },
);

export default api;
