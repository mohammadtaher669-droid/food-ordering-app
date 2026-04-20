import { useParams } from "wouter";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { restaurantStore, branchStore, categoryStore, menuStore, offerStore } from "@/lib/store";
import WhatsAppSticky from "@/components/WhatsAppSticky";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import type { MenuItem } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import WorkingHoursStatus, { isBranchOpen } from "@/components/WorkingHoursStatus";
import { Plus, Check, Sparkles, Navigation, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isInsideZone } from "@/lib/deliveryZones";
import { analyticsStore, userBehaviorStore } from "@/lib/store";

type ZoneStatus = "idle" | "checking" | "inside" | "outside" | "error";

function DeliveryZoneChecker({ branchId }: { branchId: string }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<ZoneStatus>("idle");

  const handleCheck = () => {
    if (!navigator.geolocation) { setStatus("error"); return; }
    setStatus("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const branch = branchStore.getById(branchId);
        if (!branch) { setStatus("error"); return; }
        const inside = isInsideZone(pos.coords.latitude, pos.coords.longitude, branch);
        setStatus(inside ? "inside" : "outside");
      },
      () => setStatus("error"),
      { timeout: 10000 }
    );
  };

  if (status === "idle") {
    return (
      <button
        onClick={handleCheck}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition font-medium"
        data-testid="btn-check-zone"
      >
        <Navigation size={13} />
        {t("Check delivery to my location", "تحقق من التوصيل لموقعي")}
      </button>
    );
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 size={13} className="animate-spin" />
        {t("Checking...", "جاري التحقق...")}
      </div>
    );
  }

  if (status === "inside") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle size={13} />
        {t("Delivery available to your location!", "التوصيل متاح لموقعك!")}
      </div>
    );
  }

  if (status === "outside") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle size={13} />
        {t("Delivery not available in your area", "التوصيل غير متوفر في منطقتك")}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <XCircle size={13} />
      {t("Could not get your location", "تعذر الحصول على موقعك")}
    </div>
  );
}

function MenuItemCard({
  item,
  restaurantColor,
  isOpen,
  added,
  onAdd,
}: {
  item: MenuItem;
  restaurantColor: string;
  isOpen: boolean;
  added: boolean;
  onAdd: () => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div
      layout
      className="bg-card border border-white/5 rounded-2xl overflow-hidden flex flex-col"
      data-testid={`card-menuitem-${item.id}`}
      whileHover={{ y: -2 }}
    >
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: 160, background: `${restaurantColor}15` }}
      >
        {item.image ? (
          <motion.img
            src={item.image}
            alt={t(item.name_en, item.name_ar)}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.35 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {item.is_new && (
            <span className="text-[9px] bg-yellow-400/90 text-black font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles size={8} /> {t("New", "جديد")}
            </span>
          )}
          {item.is_popular && (
            <span className="text-[9px] bg-primary/90 text-white font-bold px-2 py-0.5 rounded-full">
              ⭐ {t("Popular", "الأكثر")}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
          {t(item.name_en, item.name_ar)}
        </h3>
        {(item.description_en || item.description_ar) && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1 flex-1">
            {t(item.description_en, item.description_ar)}
          </p>
        )}
        {item.calories != null && item.calories > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mb-1">
            🔥 {item.calories} {t("kcal", "سعرة")}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-sm" style={{ color: restaurantColor }}>
            {item.price} ﷼
          </span>
          <button
            onClick={onAdd}
            disabled={!isOpen}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              !isOpen ? "opacity-30 cursor-not-allowed bg-white/5"
              : added ? "bg-green-500 scale-95"
              : "hover:opacity-90 active:scale-95"
            }`}
            style={isOpen && !added ? { background: restaurantColor } : {}}
            data-testid={`btn-add-${item.id}`}
          >
            {added ? <Check size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BranchPage() {
  const params = useParams<{ restaurantId: string; branchId: string }>();
  const { t, isRTL } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const allBranches = useStore(useCallback(() => branchStore.getAll(), []));
  const categories = useStore(useCallback(
    () => categoryStore.getByRestaurant(params.restaurantId),
    [params.restaurantId]
  ));
  const allMenuItems = useStore(useCallback(
    () => menuStore.getByRestaurant(params.restaurantId),
    [params.restaurantId]
  ));
  const allOffers = useStore(useCallback(() => offerStore.getActive(), []));

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const restaurant = restaurants.find((r) => r.id === params.restaurantId);
  const branch = allBranches.find((b) => b.id === params.branchId);

  if (!restaurant || !branch) {
    return <div className="pt-16 text-center text-muted-foreground">{t("Branch not found", "الفرع غير موجود")}</div>;
  }

  const isOpen = isBranchOpen(branch);
  const displayCategory = activeCategory || (categories[0]?.id ?? null);
  const filteredItems = allMenuItems.filter((m) => m.category_id === displayCategory && m.is_available);
  const hasDeliveryZone = branch.is_delivery_enabled && branch.delivery_type;

  const handleAddToCart = (item: MenuItem) => {
    if (!isOpen) return;
    analyticsStore.track({ type: "add_to_cart", item_id: item.id, restaurant_id: item.restaurant_id });
    userBehaviorStore.trackView(item.id);
    const cartItem = {
      id: item.id,
      restaurant_id: item.restaurant_id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      price: item.price,
      category_id: item.category_id,
      description_en: item.description_en,
      description_ar: item.description_ar,
      image: item.image,
    };
    const result = addToCart(cartItem as any, restaurant.id, branch.id);
    if (result === "added") {
      setAddedItems((prev) => new Set(prev).add(item.id));
      setTimeout(() => setAddedItems((prev) => { const next = new Set(prev); next.delete(item.id); return next; }), 1500);
      toast({ title: t("Added to cart", "تمت الإضافة"), description: t(item.name_en, item.name_ar) });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-28" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Branch Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div
            className="rounded-2xl p-5"
            style={{ background: `linear-gradient(135deg, ${restaurant.color}15, transparent)`, border: `1px solid ${restaurant.color}25` }}
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: `${restaurant.color}20` }}>
                  {restaurant.logoType === "image" && restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{restaurant.logo}</div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{t(restaurant.name_en, restaurant.name_ar)}</h1>
                  <p className="text-sm text-muted-foreground">{t(branch.name_en, branch.name_ar)}</p>
                </div>
              </div>
              <WorkingHoursStatus branch={branch} />
            </div>
            {!isOpen && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                {t("This branch is currently closed. Orders are not available.", "هذا الفرع مغلق حالياً. الطلبات غير متاحة.")}
              </div>
            )}
            {hasDeliveryZone && (
              <div className="mt-3">
                <DeliveryZoneChecker branchId={branch.id} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Restaurant banners for this branch */}
        {allOffers.some((o) => o.show_as_banner && o.image && (o.restaurant_id === restaurant.id || o.restaurant_id === "global")) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <HeroBannerSlider offers={allOffers} restaurantId={restaurant.id} />
          </motion.div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar" style={{ direction: "ltr" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                displayCategory === cat.id ? "text-primary-foreground" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"
              }`}
              style={displayCategory === cat.id ? { background: restaurant.color } : {}}
              data-testid={`tab-category-${cat.id}`}
            >
              {t(cat.name_en, cat.name_ar)}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredItems.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                {t("No items in this category", "لا توجد عناصر في هذه الفئة")}
              </p>
            )}
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurantColor={restaurant.color}
                isOpen={isOpen}
                added={addedItems.has(item.id)}
                onAdd={() => handleAddToCart(item)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <WhatsAppSticky branchId={params.branchId} />
    </div>
  );
}
