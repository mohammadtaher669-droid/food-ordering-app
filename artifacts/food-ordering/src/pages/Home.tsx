import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Star, Clock, Bike, Flame, ShoppingCart,
  ChevronLeft, ChevronRight, Sparkles, Tag, TrendingUp,
  MapPin, Plus,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  restaurantStore, branchStore, offerStore, categoryStore,
  menuStore, settingsStore, analyticsStore,
} from "@/lib/store";
import type { MenuItem, Restaurant, Offer } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import ImageWithFallback from "@/components/ImageWithFallback";
import { isBranchOpen } from "@/components/WorkingHoursStatus";
import RecommendationRow from "@/components/RecommendationRow";
import OffersCarousel from "@/components/OffersCarousel";
import { SkeletonRestaurantCard, SkeletonItemCard, SkeletonBanner } from "@/components/SkeletonCard";

// ── Promo Banner Slider ───────────────────────────────────────────────────────

function PromoSlider({ offers }: { offers: Offer[] }) {
  const { t, isRTL } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);

  const banners = offers.filter((o) => o.show_as_banner && o.active && o.image);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [banners.length, paused, next]);

  useEffect(() => { setCurrent(0); }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  const href = banner.restaurant_id && banner.restaurant_id !== "global"
    ? `/restaurant/${banner.restaurant_id}` : "/offers";

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none"
      style={{ height: 220 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
      }}
      data-testid="hero-banner-slider"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, x: isRTL ? -60 : 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 60 : -60 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={banner.image!}
            alt={t(banner.title_en, banner.title_ar)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="max-w-xs"
            >
              {banner.value > 0 && (
                <span className="inline-block text-[10px] font-bold text-white bg-primary rounded-full px-2.5 py-0.5 mb-2">
                  {banner.type === "percentage" ? `${banner.value}% OFF`
                    : banner.type === "fixed" ? `-${banner.value} ﷼`
                    : t("FREE DELIVERY", "توصيل مجاني")}
                </span>
              )}
              <h3 className="text-white font-bold text-xl leading-tight line-clamp-2 mb-1">
                {t(banner.title_en, banner.title_ar)}
              </h3>
              {(banner.description_en || banner.description_ar) && (
                <p className="text-white/70 text-xs line-clamp-1 mb-3">
                  {t(banner.description_en, banner.description_ar)}
                </p>
              )}
              <Link href={href}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-full shadow-lg shadow-primary/40 hover:opacity-90 transition"
                >
                  {t(banner.banner_cta_en || "Order Now", banner.banner_cta_ar || "اطلب الآن")}
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition z-10"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition z-10"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Restaurant Card ───────────────────────────────────────────────────────────

function RestaurantCard({
  restaurant, branches, index,
}: {
  restaurant: ReturnType<typeof restaurantStore.getAll>[number];
  branches: ReturnType<typeof branchStore.getAll>;
  index: number;
}) {
  const { t, isRTL } = useLanguage();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const restaurantBranches = branches.filter((b) => b.restaurant_id === restaurant.id);
  const openBranches = restaurantBranches.filter((b) => isBranchOpen(b));
  const isAnyOpen = openBranches.length > 0;
  const primary = restaurantBranches[0];
  const deliveryTime = primary?.delivery_time ? `${primary.delivery_time} min` : "20-35 min";
  const deliveryFee = primary?.delivery_fee ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      <Link href={`/restaurant/${restaurant.id}`}>
        <div
          className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 bg-card"
          style={{ border: `1px solid ${restaurant.color}20`, boxShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 36px ${restaurant.color}28, 0 2px 16px rgba(0,0,0,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.35)";
          }}
          data-testid={`card-restaurant-${restaurant.id}`}
        >
          {/* Cover */}
          <div className="relative overflow-hidden" style={{ height: 148 }}>
            {restaurant.cover_image ? (
              <img
                src={restaurant.cover_image}
                alt={restaurant.name_en}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full transition-transform duration-500 group-hover:scale-105 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${restaurant.color}30, ${restaurant.color}08)` }}
              >
                <span className="text-5xl opacity-20">🍽️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
            {/* Brand strip */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 group-hover:h-1 transition-all"
              style={{ background: `linear-gradient(90deg, ${restaurant.color}, ${restaurant.color}60)` }}
            />
            {/* Open/Closed badge */}
            <div
              className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg ${
                isAnyOpen ? "bg-green-500 text-white" : "bg-red-500/85 text-white"
              }`}
            >
              {isAnyOpen ? t("Open", "مفتوح") : t("Closed", "مغلق")}
            </div>
          </div>

          {/* Info */}
          <div className="px-3.5 pb-3.5 pt-0 bg-card">
            <div className="flex items-start gap-3">
              {/* Logo */}
              <div
                className="-mt-7 w-13 h-13 rounded-xl border-2 flex-shrink-0 overflow-hidden shadow-xl relative z-10 flex items-center justify-center"
                style={{ borderColor: `${restaurant.color}40`, background: `${restaurant.color}18`, width: 52, height: 52 }}
              >
                {restaurant.logoType === "image" && restaurant.logo
                  ? <ImageWithFallback src={restaurant.logo} alt="" className="w-full h-full object-cover" preset="thumbnail" />
                  : <span className="text-2xl">{restaurant.logo || "🍽️"}</span>
                }
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                  {t(restaurant.name_en, restaurant.name_ar)}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {t(restaurant.tagline_en || restaurant.description_en, restaurant.tagline_ar || restaurant.description_ar)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-0 mt-2.5 pt-2.5 border-t border-white/5">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-1">
                <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <span>4.8</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-1">
                <Clock size={10} className="flex-shrink-0" />
                <span>{deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-1">
                <Bike size={10} className="flex-shrink-0" />
                <span>{deliveryFee > 0 ? `${deliveryFee} ﷼` : t("Free", "مجاني")}</span>
              </div>
              <div
                className="flex items-center gap-0.5 text-[11px] font-semibold transition-all group-hover:gap-1"
                style={{ color: restaurant.color }}
              >
                {t("Order", "اطلب")}
                <ChevronIcon size={12} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Best Sellers Item Card ────────────────────────────────────────────────────

const BEST_SELLER_BADGE_COLORS: Record<string, string> = {
  best_seller: "#FF7A00",
  new: "#22c55e",
  offer: "#8b5cf6",
  featured: "#f59e0b",
};

function BestSellerItemCard({
  item, restaurant, badge,
}: { item: MenuItem; restaurant: Restaurant | undefined; badge?: string }) {
  const { t } = useLanguage();
  if (!restaurant) return null;
  const imgSrc = item.image_url || item.image;

  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 w-40 rounded-2xl overflow-hidden cursor-pointer group"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="relative overflow-hidden" style={{ height: 140 }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={item.name_en}
              className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl"
              style={{ background: `${restaurant.color}15` }}>🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {badge && (
            <div
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow"
              style={{ background: BEST_SELLER_BADGE_COLORS[badge] || "#FF7A00" }}
            >
              {badge === "best_seller" ? t("Best Seller", "الأكثر مبيعاً")
                : badge === "new" ? t("New", "جديد")
                : badge === "offer" ? t("Offer", "عرض")
                : t("Featured", "مميز")}
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug mb-1.5">
            {t(item.name_en, item.name_ar)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: restaurant.color }}>{item.price} ﷼</span>
            <span className="text-[9px] text-muted-foreground truncate ml-1">{t(restaurant.name_en, restaurant.name_ar)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Best Sellers Section ──────────────────────────────────────────────────────

const BS_TABS = [
  { id: "popular",  label_en: "Most Popular", label_ar: "الأكثر مبيعاً", icon: "🔥" },
  { id: "new",      label_en: "New Items",     label_ar: "جديد",          icon: "✨" },
  { id: "featured", label_en: "Featured",      label_ar: "مميز",          icon: "⭐" },
  { id: "offers",   label_en: "On Offer",      label_ar: "عروض",          icon: "🎁" },
];

function BestSellersSection({
  allMenuItems, restaurants, offers,
}: {
  allMenuItems: MenuItem[];
  restaurants: ReturnType<typeof restaurantStore.getAll>;
  offers: Offer[];
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("popular");

  const offerRestaurantIds = new Set(offers.filter((o) => o.active).map((o) => o.restaurant_id));

  const getItems = () => {
    const base = allMenuItems.filter((m) => m.is_available && !m.hidden);
    if (activeTab === "popular") return base.filter((m) => m.is_popular).slice(0, 20);
    if (activeTab === "new")     return base.filter((m) => m.is_new).slice(0, 20);
    if (activeTab === "featured") return base.filter((m) => m.featured || m.is_best_seller).slice(0, 20);
    if (activeTab === "offers")  return base.filter((m) => offerRestaurantIds.has(m.restaurant_id)).slice(0, 20);
    return [];
  };

  const getBadge = (item: MenuItem) => {
    if (activeTab === "popular")  return "best_seller";
    if (activeTab === "new")      return "new";
    if (activeTab === "featured") return "featured";
    if (activeTab === "offers")   return "offer";
    return undefined;
  };

  const items = getItems();

  return (
    <div>
      {/* Tab strip */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar" style={{ direction: "ltr" }}>
        {BS_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-card border border-white/6 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            {t(tab.label_en, tab.label_ar)}
          </motion.button>
        ))}
      </div>

      {/* Items scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 mt-4 no-scrollbar" style={{ direction: "ltr" }}>
        {items.length === 0 ? (
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonItemCard key={i} />)}
          </div>
        ) : (
          items.map((item, i) => {
            const restaurant = restaurants.find((r) => r.id === item.restaurant_id);
            return (
              <motion.div
                key={`${activeTab}-${item.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
              >
                <BestSellerItemCard item={item} restaurant={restaurant} badge={getBadge(item)} />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Categories Section ────────────────────────────────────────────────────────

const QUICK_CATS = [
  { emoji: "🥙", label_en: "Shawarma",  label_ar: "شاورما",  color: "#FF7A00" },
  { emoji: "🍔", label_en: "Burgers",   label_ar: "برغر",    color: "#E53935" },
  { emoji: "🍕", label_en: "Pizza",     label_ar: "بيتزا",   color: "#F4511E" },
  { emoji: "🍗", label_en: "Chicken",   label_ar: "دجاج",    color: "#FB8C00" },
  { emoji: "🍚", label_en: "Kabsa",     label_ar: "كبسة",    color: "#C1121F" },
  { emoji: "🥗", label_en: "Salads",    label_ar: "سلطة",    color: "#43A047" },
  { emoji: "☕", label_en: "Coffee",    label_ar: "قهوة",    color: "#795548" },
  { emoji: "🧁", label_en: "Desserts",  label_ar: "حلويات",  color: "#D81B60" },
  { emoji: "🍖", label_en: "Grills",    label_ar: "مشاوي",   color: "#8D6E63" },
  { emoji: "🌮", label_en: "Wraps",     label_ar: "لفائف",   color: "#FFA726" },
];

function CategoriesSection({ onFilter }: { onFilter: (q: string) => void }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<string | null>(null);

  function handleClick(cat: typeof QUICK_CATS[0]) {
    if (active === cat.label_en) {
      setActive(null);
      onFilter("");
    } else {
      setActive(cat.label_en);
      onFilter(t(cat.label_en, cat.label_ar));
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar" style={{ direction: "ltr" }}>
      {QUICK_CATS.map((cat) => {
        const isActive = active === cat.label_en;
        return (
          <motion.button
            key={cat.label_en}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleClick(cat)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 shadow-sm"
              style={{
                background: isActive ? cat.color : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${isActive ? cat.color : "rgba(255,255,255,0.06)"}`,
                boxShadow: isActive ? `0 4px 16px ${cat.color}40` : "none",
              }}
            >
              {cat.emoji}
            </div>
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: isActive ? cat.color : undefined }}
            >
              {t(cat.label_en, cat.label_ar)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Main Home ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { cartItems } = useCart();
  const [search, setSearch] = useState("");
  const [showAbandonedBanner, setShowAbandonedBanner] = useState(false);

  const settings = useStore(useCallback(() => settingsStore.get(), []));
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));
  const offers = useStore(useCallback(() => offerStore.getActive(), []));
  const allMenuItems = useStore(useCallback(() => menuStore.getAll(), []));

  useEffect(() => {
    analyticsStore.track({ type: "page_visit", page: "home" });
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      const dismissed = sessionStorage.getItem("abandoned_cart_dismissed");
      if (!dismissed) setShowAbandonedBanner(true);
    }
  }, [cartItems.length]);

  const filteredRestaurants = restaurants.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name_en.toLowerCase().includes(q) ||
      r.name_ar.includes(q) ||
      (r.description_en || "").toLowerCase().includes(q) ||
      (r.tagline_en || "").toLowerCase().includes(q)
    );
  });

  const bannerOffers = offers.filter((o) => o.show_as_banner && o.image);
  const nonBannerOffers = offers.filter((o) => !o.show_as_banner);

  const bgStyle: React.CSSProperties = (() => {
    if (settings.homepage_bg_type === "image" && settings.homepage_bg_image) {
      return { backgroundImage: `url(${settings.homepage_bg_image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" };
    }
    if (settings.homepage_bg_type === "gradient") {
      return { background: "linear-gradient(135deg, #1a0a00 0%, #0F0F0F 60%)" };
    }
    return { background: "#0F0F0F" };
  })();

  return (
    <div
      className="min-h-screen pb-28 relative"
      style={{ ...bgStyle, direction: isRTL ? "rtl" : "ltr" }}
    >
      {settings.homepage_bg_type === "image" && settings.homepage_bg_image && (
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{ background: settings.homepage_overlay_color, opacity: settings.homepage_overlay_opacity }} />
      )}

      {/* Abandoned cart banner */}
      <AnimatePresence>
        {showAbandonedBanner && cartItems.length > 0 && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-14 left-0 right-0 z-40 px-4 pt-2"
          >
            <div className="max-w-2xl mx-auto bg-primary/95 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 shadow-xl shadow-primary/25">
              <ShoppingCart size={15} className="text-white flex-shrink-0" />
              <p className="text-white text-sm font-medium flex-1">
                {t(`You have ${cartItems.length} item(s) in your cart`, `لديك ${cartItems.length} منتج في سلتك`)}
              </p>
              <Link href="/cart">
                <span className="text-white text-xs font-bold bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg">{t("View Cart", "عرض السلة")}</span>
              </Link>
              <button
                onClick={() => { setShowAbandonedBanner(false); sessionStorage.setItem("abandoned_cart_dismissed", "1"); }}
                className="text-white/70 hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting + Search */}
      <div className="px-4 pt-20 pb-3 relative z-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <p className="text-muted-foreground text-sm">{t("👋 Hello, Guest!", "👋 مرحباً، زائر!")}</p>
          <h1 className="text-xl font-bold text-foreground">
            {t("What do you want today?", "ماذا تريد اليوم؟")}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Search size={15} className="text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search restaurants, food...", "ابحث عن مطاعم، طعام...")}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            data-testid="input-search"
          />
          <AnimatePresence>
            {search && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition">
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── 1. Promo Banner Slider ─── */}
      {bannerOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="px-4 mb-7"
        >
          <PromoSlider offers={bannerOffers} />
        </motion.div>
      )}

      {/* ─── 2. Restaurants Section ─── */}
      {!search && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="px-4 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-primary" />
              <h2 className="text-base font-bold text-foreground">{t("Restaurants", "المطاعم")}</h2>
            </div>
            <div className="flex items-center gap-2">
              {restaurants.length > 0 && (
                <span className="text-xs text-muted-foreground bg-card border border-white/5 px-2.5 py-1 rounded-full">
                  {restaurants.length}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {restaurants.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRestaurantCard key={i} />)
              : restaurants.map((r, i) => (
                <RestaurantCard key={r.id} restaurant={r} branches={branches} index={i} />
              ))
            }
          </div>
        </motion.div>
      )}

      {/* Search results */}
      {search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {t(`Results for "${search}"`, `نتائج لـ "${search}"`)}
            </h2>
          </div>
          {filteredRestaurants.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredRestaurants.map((r, i) => (
                <RestaurantCard key={r.id} restaurant={r} branches={branches} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-14">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-foreground font-semibold">{t("No results found", "لا توجد نتائج")}</p>
              <button onClick={() => setSearch("")} className="mt-3 text-primary text-sm font-medium">
                {t("Clear search", "مسح البحث")}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── 3. Best Sellers ─── */}
      {!search && allMenuItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.13 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-4 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("Best Sellers", "الأكثر مبيعاً")}</h2>
          </div>
          <BestSellersSection allMenuItems={allMenuItems} restaurants={restaurants} offers={offers} />
        </motion.div>
      )}

      {/* Smart Recommendations */}
      {!search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
          <RecommendationRow limit={8} />
        </motion.div>
      )}

      {/* ─── 4. Categories ─── */}
      {!search && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.17 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 px-4 mb-4">
            <Tag size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("Browse by Category", "تصفح حسب الفئة")}</h2>
          </div>
          <CategoriesSection onFilter={setSearch} />
        </motion.div>
      )}

      {/* Hot offers carousel */}
      {!search && nonBannerOffers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.19 }} className="mb-8">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Sparkles size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">{t("Hot Offers", "العروض الساخنة")}</h2>
          </div>
          <div className="px-4">
            <OffersCarousel offers={nonBannerOffers} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
