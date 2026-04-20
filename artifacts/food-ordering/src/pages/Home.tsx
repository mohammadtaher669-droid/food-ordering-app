import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Star, MapPin, ChevronRight, ChevronLeft, User, Flame, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore, offerStore, categoryStore, menuStore, settingsStore, analyticsStore } from "@/lib/store";
import type { MenuItem, Restaurant, Category } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import OffersCarousel from "@/components/OffersCarousel";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import RecommendationRow from "@/components/RecommendationRow";
import { useCart } from "@/contexts/CartContext";
import ImageWithFallback from "@/components/ImageWithFallback";

function CategoryPill({
  label,
  active,
  onClick,
  emoji,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  emoji?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "bg-card border border-white/6 text-muted-foreground hover:text-foreground"
      }`}
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      {label}
    </motion.button>
  );
}

function PopularCard({
  item,
  restaurant,
}: {
  item: MenuItem;
  restaurant: Restaurant | undefined;
}) {
  const { t } = useLanguage();
  if (!restaurant) return null;
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 w-40 rounded-2xl overflow-hidden cursor-pointer"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        data-testid={`popular-card-${item.id}`}
      >
        <div
          className="relative h-28 overflow-hidden"
          style={{ background: `${restaurant.color}15` }}
        >
          <ImageWithFallback src={item.image} alt={item.name_en} className="w-full h-full object-cover" preset="product" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 to-transparent" />
          {item.is_popular && (
            <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Star size={8} fill="currentColor" /> {t("Popular", "مشهور")}
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug mb-1.5">
            {t(item.name_en, item.name_ar)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: restaurant.color }}>
              {item.price} ﷼
            </span>
            <div className="flex items-center gap-0.5">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-muted-foreground">4.8</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function RestaurantCard({
  restaurant,
  branches,
  index,
}: {
  restaurant: ReturnType<typeof restaurantStore.getAll>[number];
  branches: ReturnType<typeof branchStore.getAll>;
  index: number;
}) {
  const { t, isRTL } = useLanguage();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const branchCount = branches.filter((b) => b.restaurant_id === restaurant.id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Link href={`/restaurant/${restaurant.id}`}>
        <div
          className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
          style={{
            border: `1px solid ${restaurant.color}1A`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${restaurant.color}25, 0 2px 12px rgba(0,0,0,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
          }}
          data-testid={`card-restaurant-${restaurant.id}`}
        >
          <div className="relative h-40 overflow-hidden">
            {restaurant.cover_image ? (
              <img
                src={restaurant.cover_image}
                alt={restaurant.name_en}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${restaurant.color}28 0%, ${restaurant.color}08 60%, #1A1A1A 100%)`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-20 h-20 rounded-full" style={{ background: restaurant.color }} />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/10 to-transparent" />
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-[3px]"
              style={{ background: `linear-gradient(90deg, ${restaurant.color}, ${restaurant.color}50)` }}
            />
          </div>

          <div className="bg-[#1A1A1A] px-4 pb-4 pt-0">
            <div className="flex items-start gap-3">
              <div
                className="-mt-8 w-14 h-14 rounded-xl border-2 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg relative z-10"
                style={{ borderColor: `${restaurant.color}35`, background: `${restaurant.color}18` }}
              >
                {restaurant.logoType === "image" && restaurant.logo
                  ? <ImageWithFallback src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover" preset="thumbnail" />
                  : <span className="text-2xl">{restaurant.logo || "🍽️"}</span>
                }
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    {t(restaurant.name_en, restaurant.name_ar)}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                    <MapPin size={10} />
                    <span>{branchCount}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {t(
                    restaurant.tagline_en || restaurant.description_en,
                    restaurant.tagline_ar || restaurant.description_ar
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-muted-foreground">4.8</span>
                <span className="text-xs text-muted-foreground/40 mx-1">·</span>
                <span className="text-xs text-muted-foreground">{t("20-30 min", "٢٠-٣٠ دقيقة")}</span>
              </div>
              <div
                className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-1.5"
                style={{ color: restaurant.color }}
              >
                {t("Order Now", "اطلب الآن")}
                <ChevronIcon size={13} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function SectionHeader({ title, emoji }: { title: string; emoji?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 mb-3">
      {emoji && <span className="text-lg leading-none">{emoji}</span>}
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

export default function Home() {
  const { t, isRTL } = useLanguage();
  const { cartItems } = useCart();
  const [search, setSearch] = useState("");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [showAbandonedBanner, setShowAbandonedBanner] = useState(false);

  const settings = settingsStore.get();

  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));
  const offers = useStore(useCallback(() => offerStore.getActive(), []));
  const allCategories = useStore(useCallback(() => categoryStore.getAll(), []));
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

  const popularItems = allMenuItems.filter((m) => m.is_popular && m.is_available);

  const uniqueCategories: Category[] = [];
  const seenNames = new Set<string>();
  for (const cat of allCategories) {
    const key = cat.name_en.toLowerCase().trim();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      uniqueCategories.push(cat);
    }
  }

  const visiblePopular = activeCatId
    ? popularItems.filter((m) => m.category_id === activeCatId)
    : popularItems;

  const filteredRestaurants = restaurants.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name_en.toLowerCase().includes(q) ||
      r.name_ar.includes(q) ||
      (r.description_en || "").toLowerCase().includes(q)
    );
  });

  const bgStyle: React.CSSProperties = (() => {
    if (settings.homepage_bg_type === "image" && settings.homepage_bg_image) {
      return {
        backgroundImage: `url(${settings.homepage_bg_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
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
      {/* Overlay for image background */}
      {settings.homepage_bg_type === "image" && settings.homepage_bg_image && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: settings.homepage_overlay_color, opacity: settings.homepage_overlay_opacity }}
        />
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
            <div className="max-w-2xl mx-auto bg-primary/95 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 shadow-lg shadow-primary/20">
              <ShoppingCart size={16} className="text-white flex-shrink-0" />
              <p className="text-white text-sm font-medium flex-1">
                {t(`You have ${cartItems.length} item(s) in your cart`, `لديك ${cartItems.length} منتج في سلتك`)}
              </p>
              <Link href="/cart">
                <span className="text-white text-xs font-bold bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg">{t("View Cart", "عرض السلة")}</span>
              </Link>
              <button
                onClick={() => { setShowAbandonedBanner(false); sessionStorage.setItem("abandoned_cart_dismissed", "1"); }}
                className="text-white/70 hover:text-white transition ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-20 pb-4 relative z-10"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-0.5">
              {t("👋 Hello, Guest!", "👋 مرحباً، زائر!")}
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {t("What do you want today?", "ماذا تريد اليوم؟")}
            </h1>
            {(settings.slogan_en || settings.slogan_ar) && (
              <p className="text-xs text-muted-foreground mt-0.5 opacity-70">
                {t(settings.slogan_en, settings.slogan_ar)}
              </p>
            )}
          </div>
          <Link href="/profile">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,122,0,0.12)", border: "1px solid rgba(255,122,0,0.2)" }}
            >
              <User size={20} className="text-primary" />
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-4 mb-6"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search food, restaurants...", "ابحث عن طعام، مطاعم...")}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            data-testid="input-search"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Hero Banner Slider */}
      {offers.some((o) => o.show_as_banner && o.image) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="px-4 mb-7"
        >
          <HeroBannerSlider offers={offers} />
        </motion.div>
      )}

      {/* Quick Food Type Icons (Keeta-style) */}
      {!search && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mb-6 px-4"
        >
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar" style={{ direction: "ltr" }}>
            {[
              { emoji: "🥙", label_en: "Shawarma", label_ar: "شاورما" },
              { emoji: "🍔", label_en: "Burgers", label_ar: "برغر" },
              { emoji: "🍕", label_en: "Pizza", label_ar: "بيتزا" },
              { emoji: "🍗", label_en: "Chicken", label_ar: "دجاج" },
              { emoji: "🍚", label_en: "Kabsa", label_ar: "كبسة" },
              { emoji: "🥗", label_en: "Salads", label_ar: "سلطة" },
              { emoji: "☕", label_en: "Coffee", label_ar: "قهوة" },
              { emoji: "🧁", label_en: "Desserts", label_ar: "حلويات" },
            ].map((cat) => (
              <button
                key={cat.label_en}
                onClick={() => setSearch(t(cat.label_en, cat.label_ar))}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-2xl group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-200">
                  {cat.emoji}
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  {t(cat.label_en, cat.label_ar)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Text Offers carousel (non-banner) */}
      {offers.some((o) => !o.show_as_banner) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-7"
        >
          <SectionHeader title={t("Hot Offers", "العروض الساخنة")} emoji="🔥" />
          <div className="px-4">
            <OffersCarousel offers={offers.filter((o) => !o.show_as_banner)} />
          </div>
        </motion.div>
      )}

      {/* Categories */}
      {uniqueCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="mb-7"
        >
          <SectionHeader title={t("Categories", "الفئات")} />
          <div
            className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar"
            style={{ direction: "ltr" }}
          >
            <CategoryPill
              label={t("All", "الكل")}
              active={activeCatId === null}
              onClick={() => setActiveCatId(null)}
              emoji="🍽️"
            />
            {uniqueCategories.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={t(cat.name_en, cat.name_ar)}
                active={activeCatId === cat.id}
                onClick={() => setActiveCatId(cat.id)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Smart Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.13 }}
        className="mb-7"
      >
        <RecommendationRow limit={8} />
      </motion.div>

      {/* Popular Items */}
      {visiblePopular.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-7"
        >
          <SectionHeader title={t("Popular Right Now", "الأكثر طلباً الآن")} emoji="⭐" />
          <div
            className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar"
            style={{ direction: "ltr" }}
          >
            {visiblePopular.slice(0, 12).map((item) => {
              const restaurant = restaurants.find((r) => r.id === item.restaurant_id);
              return (
                <PopularCard key={item.id} item={item} restaurant={restaurant} />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Restaurants */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="px-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">
              {t("Our Restaurants", "مطاعمنا")}
            </h2>
          </div>
          {filteredRestaurants.length > 0 && (
            <span className="text-xs text-muted-foreground bg-card border border-white/5 px-2.5 py-1 rounded-full">
              {filteredRestaurants.length}
            </span>
          )}
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRestaurants.map((restaurant, i) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                branches={branches}
                index={i}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-foreground font-semibold">
              {t("No restaurants found", "لم يتم العثور على مطاعم")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Try a different search term", "جرب مصطلح بحث مختلف")}
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-primary text-sm font-medium underline underline-offset-2"
            >
              {t("Clear search", "مسح البحث")}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
