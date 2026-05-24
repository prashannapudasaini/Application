import { Platform } from "react-native";

// Your verified local IPv4 Address
const LOCAL_IP = "192.168.1.80";

// The base URL pointing to your XAMPP htdocs folder
export const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost/sita-ram-dairy/backend"
    : `http://${LOCAL_IP}/sita-ram-dairy/backend`;

export const API_ENDPOINTS = {
  PRODUCTS: `${BASE_URL}/api/products/index.php`,

  // Pointing to the new public categories endpoint
  CATEGORIES: `${BASE_URL}/api/categories/index.php`,
};

// Helper function to build the full image URL accurately
export const getImageUrl = (dbImagePath: string) => {
  // 1. If no image exists, return empty string to trigger the built-in grey icon fallback
  if (!dbImagePath) return "";

  // 2. If your database already has the full URL (e.g. "http://localhost/...")
  if (dbImagePath.includes("http")) {
    // Replace 'localhost' or '127.0.0.1' with your IP so it works across mobile devices
    return dbImagePath
      .replace("localhost", LOCAL_IP)
      .replace("127.0.0.1", LOCAL_IP);
  }

  // 3. If the database only has the filename
  return `${BASE_URL}/uploads/${dbImagePath}`;
};
