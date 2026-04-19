// ============================================================
// CENTRAL LOCALSTORAGE STORE
// Single source of truth for all dynamic data
// ============================================================

export interface Restaurant {
  id: string;
  name_en: string;
  name_ar: string;
  logo: string; // emoji or base64 image
  logoType: "emoji" | "image";
  color: string;
  description_en: string;
  description_ar: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  whatsapp: string;
  open: string;
  close: string;
  delivery_fee: number;
  address_en: string;
  address_ar: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  image?: string; // base64
  is_available: boolean;
  is_popular: boolean;
  is_new: boolean;
}

export interface Offer {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  image?: string;
  type: "percentage" | "fixed" | "free_delivery";
  value: number;
  restaurant_id: string | "global";
  active: boolean;
  code?: string;
}

export interface Coupon {
  code: string;
  type: "percentage" | "fixed" | "free_delivery";
  value: number;
  active: boolean;
  description_en: string;
  description_ar: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  approved: boolean;
  timestamp: string;
}

// ============================================================
// KEYS
// ============================================================
const KEYS = {
  restaurants: "store_restaurants",
  branches: "store_branches",
  categories: "store_categories",
  menuItems: "store_menu_items",
  offers: "store_offers",
  coupons: "store_coupons",
  reviews: "store_reviews",
  initialized: "store_initialized",
};

// ============================================================
// HELPERS
// ============================================================
function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function dispatch() {
  window.dispatchEvent(new Event("store-updated"));
}

// ============================================================
// RESTAURANTS
// ============================================================
export const restaurantStore = {
  getAll: (): Restaurant[] => read<Restaurant>(KEYS.restaurants),
  getById: (id: string): Restaurant | undefined => read<Restaurant>(KEYS.restaurants).find((r) => r.id === id),
  save: (restaurant: Restaurant): void => {
    const all = read<Restaurant>(KEYS.restaurants);
    const idx = all.findIndex((r) => r.id === restaurant.id);
    if (idx >= 0) all[idx] = restaurant; else all.push(restaurant);
    write(KEYS.restaurants, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.restaurants, read<Restaurant>(KEYS.restaurants).filter((r) => r.id !== id));
    dispatch();
  },
  set: (restaurants: Restaurant[]): void => { write(KEYS.restaurants, restaurants); dispatch(); },
};

// ============================================================
// BRANCHES
// ============================================================
export const branchStore = {
  getAll: (): Branch[] => read<Branch>(KEYS.branches),
  getByRestaurant: (restaurantId: string): Branch[] => read<Branch>(KEYS.branches).filter((b) => b.restaurant_id === restaurantId),
  getById: (id: string): Branch | undefined => read<Branch>(KEYS.branches).find((b) => b.id === id),
  save: (branch: Branch): void => {
    const all = read<Branch>(KEYS.branches);
    const idx = all.findIndex((b) => b.id === branch.id);
    if (idx >= 0) all[idx] = branch; else all.push(branch);
    write(KEYS.branches, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.branches, read<Branch>(KEYS.branches).filter((b) => b.id !== id));
    dispatch();
  },
  set: (branches: Branch[]): void => { write(KEYS.branches, branches); dispatch(); },
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoryStore = {
  getAll: (): Category[] => read<Category>(KEYS.categories).sort((a, b) => a.sort_order - b.sort_order),
  getByRestaurant: (restaurantId: string): Category[] =>
    read<Category>(KEYS.categories).filter((c) => c.restaurant_id === restaurantId).sort((a, b) => a.sort_order - b.sort_order),
  getById: (id: string): Category | undefined => read<Category>(KEYS.categories).find((c) => c.id === id),
  save: (category: Category): void => {
    const all = read<Category>(KEYS.categories);
    const idx = all.findIndex((c) => c.id === category.id);
    if (idx >= 0) all[idx] = category; else all.push(category);
    write(KEYS.categories, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.categories, read<Category>(KEYS.categories).filter((c) => c.id !== id));
    dispatch();
  },
  set: (categories: Category[]): void => { write(KEYS.categories, categories); dispatch(); },
};

// ============================================================
// MENU ITEMS
// ============================================================
export const menuStore = {
  getAll: (): MenuItem[] => read<MenuItem>(KEYS.menuItems),
  getByRestaurant: (restaurantId: string): MenuItem[] => read<MenuItem>(KEYS.menuItems).filter((m) => m.restaurant_id === restaurantId),
  getByCategory: (categoryId: string): MenuItem[] => read<MenuItem>(KEYS.menuItems).filter((m) => m.category_id === categoryId),
  getPopular: (restaurantId: string): MenuItem[] => read<MenuItem>(KEYS.menuItems).filter((m) => m.restaurant_id === restaurantId && m.is_popular),
  getNew: (restaurantId: string): MenuItem[] => read<MenuItem>(KEYS.menuItems).filter((m) => m.restaurant_id === restaurantId && m.is_new),
  getById: (id: string): MenuItem | undefined => read<MenuItem>(KEYS.menuItems).find((m) => m.id === id),
  save: (item: MenuItem): void => {
    const all = read<MenuItem>(KEYS.menuItems);
    const idx = all.findIndex((m) => m.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    write(KEYS.menuItems, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.menuItems, read<MenuItem>(KEYS.menuItems).filter((m) => m.id !== id));
    dispatch();
  },
  set: (items: MenuItem[]): void => { write(KEYS.menuItems, items); dispatch(); },
};

// ============================================================
// OFFERS
// ============================================================
export const offerStore = {
  getAll: (): Offer[] => read<Offer>(KEYS.offers),
  getActive: (): Offer[] => read<Offer>(KEYS.offers).filter((o) => o.active),
  getByRestaurant: (restaurantId: string): Offer[] =>
    read<Offer>(KEYS.offers).filter((o) => o.active && (o.restaurant_id === restaurantId || o.restaurant_id === "global")),
  save: (offer: Offer): void => {
    const all = read<Offer>(KEYS.offers);
    const idx = all.findIndex((o) => o.id === offer.id);
    if (idx >= 0) all[idx] = offer; else all.push(offer);
    write(KEYS.offers, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.offers, read<Offer>(KEYS.offers).filter((o) => o.id !== id));
    dispatch();
  },
  set: (offers: Offer[]): void => { write(KEYS.offers, offers); dispatch(); },
};

// ============================================================
// COUPONS
// ============================================================
export const couponStore = {
  getAll: (): Coupon[] => read<Coupon>(KEYS.coupons),
  getActive: (): Coupon[] => read<Coupon>(KEYS.coupons).filter((c) => c.active),
  getByCode: (code: string): Coupon | undefined =>
    read<Coupon>(KEYS.coupons).find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active),
  save: (coupon: Coupon): void => {
    const all = read<Coupon>(KEYS.coupons);
    const idx = all.findIndex((c) => c.code === coupon.code);
    if (idx >= 0) all[idx] = coupon; else all.push(coupon);
    write(KEYS.coupons, all);
    dispatch();
  },
  delete: (code: string): void => {
    write(KEYS.coupons, read<Coupon>(KEYS.coupons).filter((c) => c.code !== code));
    dispatch();
  },
  set: (coupons: Coupon[]): void => { write(KEYS.coupons, coupons); dispatch(); },
};

// ============================================================
// REVIEWS
// ============================================================
export const reviewStore = {
  getAll: (): Review[] => read<Review>(KEYS.reviews),
  getPending: (): Review[] => read<Review>(KEYS.reviews).filter((r) => !r.approved),
  getApproved: (): Review[] => read<Review>(KEYS.reviews).filter((r) => r.approved),
  save: (review: Review): void => {
    const all = read<Review>(KEYS.reviews);
    const idx = all.findIndex((r) => r.id === review.id);
    if (idx >= 0) all[idx] = review; else all.push(review);
    write(KEYS.reviews, all);
    dispatch();
  },
  delete: (id: string): void => {
    write(KEYS.reviews, read<Review>(KEYS.reviews).filter((r) => r.id !== id));
    dispatch();
  },
};

// ============================================================
// INITIALIZATION
// ============================================================
export function isInitialized(): boolean {
  return localStorage.getItem(KEYS.initialized) === "true";
}

export function markInitialized(): void {
  localStorage.setItem(KEYS.initialized, "true");
}

export function resetStore(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  dispatch();
}
