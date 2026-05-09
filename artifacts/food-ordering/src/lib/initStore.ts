import {
  restaurantStore, branchStore, categoryStore, menuStore,
  offerStore, couponStore, modifierGroupStore, modifierOptionStore, addOnStore,
  isInitialized, markInitialized,
} from "./store";
import {
  seedRestaurants, seedBranches, seedCategories,
  seedMenuItems, seedOffers, seedCoupons,
} from "@/data/seedData";
import { seedModifierGroups, seedModifierOptions, seedAddOns } from "@/data/seedModifiers";

function migrateBranches(): void {
  const existing = branchStore.getAll();
  if (existing.length === 0) return;
  const needsMigration = existing.some((b) => b.is_delivery_enabled === undefined);
  if (!needsMigration) return;
  const seed = seedBranches;
  const migrated = existing.map((b) => {
    const s = seed.find((s) => s.id === b.id);
    if (!s) return b;
    return {
      ...b,
      is_delivery_enabled: b.is_delivery_enabled ?? s.is_delivery_enabled,
      pickup_enabled: b.pickup_enabled ?? s.pickup_enabled,
      pickup_time: b.pickup_time ?? s.pickup_time,
      min_order_delivery: b.min_order_delivery ?? s.min_order_delivery,
      delivery_fee_tiers: b.delivery_fee_tiers ?? s.delivery_fee_tiers,
      delivery_type: b.delivery_type ?? s.delivery_type,
      center_lat: b.center_lat ?? s.center_lat,
      center_lng: b.center_lng ?? s.center_lng,
      delivery_radius_km: b.delivery_radius_km ?? s.delivery_radius_km,
      delivery_time: b.delivery_time ?? s.delivery_time,
    };
  });
  branchStore.set(migrated);
}

export function initializeStore(): void {
  if (isInitialized()) {
    migrateBranches();
    return;
  }
  restaurantStore.set(seedRestaurants);
  branchStore.set(seedBranches);
  categoryStore.set(seedCategories);
  menuStore.set(seedMenuItems);
  offerStore.set(seedOffers);
  couponStore.set(seedCoupons);
  modifierGroupStore.set(seedModifierGroups);
  modifierOptionStore.set(seedModifierOptions);
  addOnStore.set(seedAddOns);
  markInitialized();
}
