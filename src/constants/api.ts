// src/constants/api.ts
// STRICT GUARD: No imports allowed at the top of this file to prevent require cycles!

export const BASE_URL = "https://sitaramdudh.com/backend";

export const ENDPOINTS = {
  // Products & Categories (Matched exactly to your backend tree)
  CATEGORIES: "/api/categories/index.php",
  PRODUCTS: "/api/products/index.php",
  PRODUCT_DETAIL: "/api/products/get_one.php",

  // Authentication & Profile
  LOGIN: "/api/auth/login.php",
  REGISTER: "/api/auth/register.php",
  MOBILE_PROFILE: "/api/user/mobile-profile.php",

  // Wallet & Orders
  INIT_CONNECTIPS: "/api/orders/init_connectips.php",
  VERIFY_CONNECTIPS: "/api/orders/verify_connectips.php",
  TOPUP_WALLET: "/api/user/topup_wallet.php",
  CANCEL_ORDER: "/api/orders/cancel.php",

  // Notifications
  NOTIFICATIONS: "/api/notifications/index.php",
  NOTIFICATIONS_MARK_READ: "/api/notifications/mark_read.php",

  // Settings & Config
  DELIVERY_SETTINGS: "/api/settings/delivery_settings.php",
};

// Export under both names so any component using API_ENDPOINTS or ENDPOINTS works
export const API_ENDPOINTS = ENDPOINTS;

// Helper to safely format image URLs if your backend sends relative paths
export const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/${path.replace(/^\//, "")}`;
};

export default ENDPOINTS;
