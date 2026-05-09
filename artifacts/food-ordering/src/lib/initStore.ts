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

export function initializeStore(): void {
  if (isInitialized()) return;
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
