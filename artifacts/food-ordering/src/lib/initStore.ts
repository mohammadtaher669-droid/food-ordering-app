import {
  restaurantStore, branchStore, categoryStore, menuStore,
  offerStore, couponStore, isInitialized, markInitialized,
} from "./store";
import {
  seedRestaurants, seedBranches, seedCategories,
  seedMenuItems, seedOffers, seedCoupons,
} from "@/data/seedData";

export function initializeStore(): void {
  if (isInitialized()) return;
  restaurantStore.set(seedRestaurants);
  branchStore.set(seedBranches);
  categoryStore.set(seedCategories);
  menuStore.set(seedMenuItems);
  offerStore.set(seedOffers);
  couponStore.set(seedCoupons);
  markInitialized();
}
