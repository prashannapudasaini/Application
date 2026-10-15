// src/hooks/useDeliverySettings.ts
import { useState, useEffect, useCallback } from "react";
import {
  DeliverySettings,
  fetchDeliverySettings,
  getDeliverySettings,
  calculateDeliveryFee,
  DeliveryFeeCalculation,
} from "../services/deliverySettings";

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(getDeliverySettings());
  const [isLoading, setIsLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchDeliverySettings();
      setSettings(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const computeFee = useCallback(
    (distanceInKm: number, cartTotal: number): DeliveryFeeCalculation => {
      return calculateDeliveryFee(distanceInKm, cartTotal, settings);
    },
    [settings]
  );

  return {
    settings,
    isLoading,
    refreshSettings,
    computeFee,
  };
}

export default useDeliverySettings;
