// src/services/deliverySettings.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import { ENDPOINTS } from "../constants/api";

export interface DeliverySettings {
  fee_per_km: number;
  free_delivery_enabled: number;
  offer_name: string;
  original_free_threshold: number;
  offer_free_threshold: number;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  fee_per_km: 20,
  free_delivery_enabled: 1,
  offer_name: "Dashain Offer",
  original_free_threshold: 1000,
  offer_free_threshold: 500,
};

const STORAGE_KEY = "sitaram_delivery_settings";

let inMemorySettings: DeliverySettings = { ...DEFAULT_DELIVERY_SETTINGS };

// Immediately attempt to hydrate from local storage
AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        inMemorySettings = {
          fee_per_km: Number(parsed.fee_per_km) || DEFAULT_DELIVERY_SETTINGS.fee_per_km,
          free_delivery_enabled:
            parsed.free_delivery_enabled !== undefined
              ? Number(parsed.free_delivery_enabled)
              : DEFAULT_DELIVERY_SETTINGS.free_delivery_enabled,
          offer_name: parsed.offer_name || DEFAULT_DELIVERY_SETTINGS.offer_name,
          original_free_threshold:
            Number(parsed.original_free_threshold) ||
            DEFAULT_DELIVERY_SETTINGS.original_free_threshold,
          offer_free_threshold:
            Number(parsed.offer_free_threshold) ||
            DEFAULT_DELIVERY_SETTINGS.offer_free_threshold,
        };
      } catch (e) {
        // Ignore parse error
      }
    }
  })
  .catch(() => {});

export const getDeliverySettings = (): DeliverySettings => {
  return inMemorySettings;
};

export const fetchDeliverySettings = async (): Promise<DeliverySettings> => {
  try {
    const res = await api.get(ENDPOINTS.DELIVERY_SETTINGS);
    if (res.data?.status === "success" && res.data?.data) {
      const data = res.data.data;
      const parsed: DeliverySettings = {
        fee_per_km: Number(data.fee_per_km) || DEFAULT_DELIVERY_SETTINGS.fee_per_km,
        free_delivery_enabled:
          data.free_delivery_enabled !== undefined
            ? Number(data.free_delivery_enabled)
            : DEFAULT_DELIVERY_SETTINGS.free_delivery_enabled,
        offer_name: data.offer_name || DEFAULT_DELIVERY_SETTINGS.offer_name,
        original_free_threshold:
          Number(data.original_free_threshold) ||
          DEFAULT_DELIVERY_SETTINGS.original_free_threshold,
        offer_free_threshold:
          Number(data.offer_free_threshold) ||
          DEFAULT_DELIVERY_SETTINGS.offer_free_threshold,
      };

      inMemorySettings = parsed;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic delivery settings, using cached/defaults:", err);
  }

  return inMemorySettings;
};

export interface DeliveryFeeCalculation {
  distanceInKm: number;
  feePerKm: number;
  rawDeliveryFee: number;
  deliveryFee: number;
  grandTotal: number;
  isOfferActive: boolean;
  qualifiesFreeDelivery: boolean;
  offerName: string;
  offerThreshold: number;
  originalThreshold: number;
  amountNeeded: number;
  savedAmount: number;
}

export function calculateDeliveryFee(
  distanceInKm: number,
  cartTotal: number,
  config: DeliverySettings = inMemorySettings,
): DeliveryFeeCalculation {
  const isOfferActive = Boolean(Number(config.free_delivery_enabled));
  const offerThreshold = Number(config.offer_free_threshold) || 500;
  const originalThreshold = Number(config.original_free_threshold) || 1000;
  const feePerKm = Number(config.fee_per_km) || 20;

  // Check if order qualifies
  const qualifiesFreeDelivery = isOfferActive
    ? cartTotal >= offerThreshold
    : originalThreshold > 0 && cartTotal >= originalThreshold;

  // Raw distance fee
  const rawDeliveryFee = Math.ceil(distanceInKm) * feePerKm;

  // Final fee
  const deliveryFee = qualifiesFreeDelivery ? 0 : rawDeliveryFee;
  const grandTotal = cartTotal + deliveryFee;

  const activeThreshold = isOfferActive ? offerThreshold : originalThreshold;
  const amountNeeded = Math.max(0, activeThreshold - cartTotal);
  const savedAmount = qualifiesFreeDelivery ? rawDeliveryFee : 0;

  return {
    distanceInKm,
    feePerKm,
    rawDeliveryFee,
    deliveryFee,
    grandTotal,
    isOfferActive,
    qualifiesFreeDelivery,
    offerName: config.offer_name || "Dashain Offer",
    offerThreshold,
    originalThreshold,
    amountNeeded,
    savedAmount,
  };
}
