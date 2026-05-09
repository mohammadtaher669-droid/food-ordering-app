import { useState, useEffect } from "react";
import type { Branch } from "@/lib/store";
import { haversineDistance, isInsideZone, getDeliveryFee } from "@/lib/deliveryZones";
import { useDeliveryLocation } from "./useDeliveryLocation";

export type DeliveryMode = "delivery" | "pickup";

export function useDeliveryMode(branch: Branch | undefined) {
  const { coords, status, request } = useDeliveryLocation();
  const [mode, setModeState] = useState<DeliveryMode>("delivery");

  const hasZoneConfig = !!(branch?.is_delivery_enabled && branch?.delivery_type);
  const pickupEnabled = branch?.pickup_enabled ?? false;

  // Auto-request location when the branch has a delivery zone configured
  useEffect(() => {
    if (hasZoneConfig && status === "idle") {
      request();
    }
  }, [hasZoneConfig, status, request]);

  // Compute distance if we have coords + branch center
  const distance: number | null =
    coords && branch?.center_lat != null && branch?.center_lng != null
      ? haversineDistance(coords.lat, coords.lng, branch.center_lat, branch.center_lng)
      : null;

  // canDeliver: null = unknown, true = yes, false = no
  let canDeliver: boolean | null = null;
  if (!hasZoneConfig) {
    canDeliver = true; // No zone restriction configured
  } else if (coords && branch) {
    const inside = isInsideZone(coords.lat, coords.lng, branch);
    // Also check fee tiers: if -1 (beyond all tiers), treat as outside
    const fee = distance != null ? getDeliveryFee(branch, distance) : 0;
    canDeliver = inside && fee !== -1;
  }

  // Compute delivery fee for current distance
  const deliveryFee: number =
    branch && distance != null
      ? Math.max(0, getDeliveryFee(branch, distance))
      : (branch?.delivery_fee ?? 0);

  // Auto-switch to pickup when delivery is unavailable
  useEffect(() => {
    if (canDeliver === false && pickupEnabled && mode === "delivery") {
      setModeState("pickup");
    }
    if (canDeliver === true && mode === "pickup" && !pickupEnabled) {
      setModeState("delivery");
    }
  }, [canDeliver, pickupEnabled, mode]);

  const setMode = (m: DeliveryMode) => {
    if (m === "pickup" && !pickupEnabled) return;
    if (m === "delivery" && canDeliver === false) return;
    setModeState(m);
  };

  return {
    mode,
    setMode,
    canDeliver,       // null = still checking, true = yes, false = no
    canPickup: pickupEnabled,
    distance,
    deliveryFee,
    minOrderDelivery: branch?.min_order_delivery ?? 0,
    pickupTime: branch?.pickup_time ?? 20,
    isChecking: status === "requesting",
    hasLocation: status === "granted",
    locationDenied: status === "denied",
    locationError: status === "error",
    hasZoneConfig,
    requestLocation: request,
  };
}
