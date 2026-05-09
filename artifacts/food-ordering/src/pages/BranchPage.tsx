import { useParams } from "wouter";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  restaurantStore, branchStore, categoryStore, menuStore, offerStore,
  branchItemOverrideStore, branchCategoryOverrideStore, checkSchedule,
  modifierGroupStore,
} from "@/lib/store";
import WhatsAppSticky from "@/components/WhatsAppSticky";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import DeliveryModeSelector from "@/components/DeliveryModeSelector";
import type { MenuItem, BranchItemOverride } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import WorkingHoursStatus, { isBranchOpen } from "@/components/WorkingHoursStatus";
import { Plus, Check, Sparkles, Wand2, Pin, Star, Trophy, TrendingUp } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useToast } from "@/hooks/use-toast";
import { analyticsStore, userBehaviorStore } from "@/lib/store";
import { useImageQueue, type ItemStatus } from "@/hooks/useImageQueue";
import ItemDetailModal from "@/components/ItemDetailModal";
import type { DeliveryMode } from "@/hooks/useDeliveryMode";

function MenuItemCard({
  item,
  restaurantColor,
  isOpen,
  added,
  onAdd,
  genStatus,
  outOfStock,
  displayPrice,
}: {
  item: MenuItem;
  restaurantColor: string;
  isOpen: boolean;
  added: boolean;
  onAdd: () => void;
  genStatus?: ItemStatus;
  outOfStock?: boolean;
  displayPrice?: number;
}) {
  const { t } = useLanguage();
  const imgSrc = item.image_url || item.image;
  const isGenerating = genStatus === "generating" || genStatus === "queued";
  const effectivePrice = displayPrice ?? item.price;
  const isDisabled = !isOpen || outOfStock;

  return (
    <motion.div
      layout
      className={`bg-card border rounded-2xl overflow-hidden flex flex-col ${outOfStock ? "border-amber-500/15 opacity-80" : "border-white/5"}`}
      data-testid={`card-menuitem-${item.id}`}
      whileHover={{ y: -2 }}
    >
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: 160, background: `${restaurantColor}15` }}
      >
        {isGenerating && !imgSrc ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <Wand2 size={20} className="text-purple-400 animate-pulse" />
              <span className="text-[10px] text-purple-400/80 font-medium">
                {genStatus === "queued" ? t("Queued…", "في الانتظار…") : t("Generating…", "جارٍ الإنشاء…")}
              </span>
            </div>
          </div>
        ) : imgSrc ? (
          <motion.img
            src={imgSrc}
            alt={t(item.name_en, item.name_ar)}
            className="w-full h-full object-cover"
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.07 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-amber-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
              {t("Out of Stock", "غير متوفر حالياً")}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {item.pinned && (
            <span className="text-[9px] bg-purple-600/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Pin size={7} /> {t("Pinned", "مثبت")}
            </span>
          )}
          {item.is_best_seller && (
            <span className="text-[9px] bg-red-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Trophy size={7} /> {t("Best Seller", "الأكثر مبيعاً")}
            </span>
          )}
          {item.featured && !item.pinned && !item.is_best_seller && (
            <span className="text-[9px] bg-amber-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Star size={7} /> {t("Featured", "مميز")}
            </span>
          )}
          {item.is_new && (
            <span className="text-[9px] bg-yellow-400/90 text-black font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles size={8} /> {t("New", "جديد")}
            </span>
          )}
          {item.is_popular && !item.featured && !item.is_best_seller && (
            <span className="text-[9px] bg-primary/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={7} /> {t("Popular", "الأكثر")}
            </span>
          )}
          {item.image_ai_generated && imgSrc && (
            <span className="text-[9px] bg-purple-600/80 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Wand2 size={7} /> AI
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
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ color: restaurantColor }}>
              {effectivePrice} ﷼
            </span>
            {displayPrice && displayPrice !== item.price && (
              <span className="text-[10px] text-muted-foreground/50 line-through">{item.price} ﷼</span>
            )}
          </div>
          <button
            onClick={onAdd}
            disabled={isDisabled}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
              isDisabled ? "opacity-30 cursor-not-allowed bg-white/5"
              : added ? "bg-green-500 scale-95"
              : "hover:opacity-90 active:scale-95"
            }`}
            style={!isDisabled && !added ? { background: restaurantColor } : {}}
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
  const { statuses, isRunning, total, completed, addToQueue } = useImageQueue();

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
  const branchItemOverrides = useStore(useCallback(
    () => branchItemOverrideStore.getForBranch(params.branchId),
    [params.branchId]
  ));
  const branchCatOverrides = useStore(useCallback(
    () => branchCategoryOverrideStore.getForBranch(params.branchId),
    [params.branchId]
  ));

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");

  const restaurant = restaurants.find((r) => r.id === params.restaurantId);
  const branch = allBranches.find((b) => b.id === params.branchId);

  // Auto-generate images for items that don't have one
  useEffect(() => {
    if (allMenuItems.length === 0) return;
    const needsImage = allMenuItems.filter(
      (m) => !m.image_url && !m.image && !m.image_locked
    );
    if (needsImage.length === 0) return;
    addToQueue(needsImage.map((item) => ({ item })));
  }, [params.restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!restaurant || !branch) {
    return <div className="pt-16 text-center text-muted-foreground">{t("Branch not found", "الفرع غير موجود")}</div>;
  }

  const isOpen = isBranchOpen(branch);

  // Build lookup maps for branch overrides (reactive via useStore)
  const overrideMap: Record<string, BranchItemOverride> = {};
  for (const o of branchItemOverrides) overrideMap[o.item_id] = o;
  const catOverrideHidden: Set<string> = new Set(
    branchCatOverrides.filter((o) => o.hidden).map((o) => o.category_id)
  );

  const visibleCategories = categories.filter((c) => !c.hidden && !catOverrideHidden.has(c.id));
  const displayCategory = activeCategory || (visibleCategories[0]?.id ?? null);

  // Items: exclude globally hidden + branch-hidden; include OOS so they render as disabled
  const filteredItems = allMenuItems.filter((m) => {
    if (m.category_id !== displayCategory) return false;
    if (!m.is_available) return false;
    if (m.hidden) return false;
    const ov = overrideMap[m.id];
    if (ov?.status === "hidden") return false;
    return true;
  });

  function getItemEffective(item: MenuItem): { outOfStock: boolean; displayPrice: number } {
    const ov = overrideMap[item.id];
    const price = ov?.price_override ?? item.price;
    if (!ov) return { outOfStock: false, displayPrice: item.price };
    if (ov.status === "out_of_stock") return { outOfStock: true, displayPrice: price };
    if (ov.schedule?.enabled && !checkSchedule(ov.schedule)) return { outOfStock: true, displayPrice: price };
    return { outOfStock: false, displayPrice: price };
  }

  const showDeliverySelector = !!(branch.is_delivery_enabled || branch.pickup_enabled);

  const handleItemClick = (item: MenuItem) => {
    if (!isOpen || getItemEffective(item).outOfStock) return;
    analyticsStore.track({ type: "view", item_id: item.id, restaurant_id: item.restaurant_id });
    userBehaviorStore.trackView(item.id);
    const groups = modifierGroupStore.getByItem(item.id).filter((g) => g.is_active);
    if (groups.length > 0) {
      setModalItem(item);
      setModalOpen(true);
    } else {
      const cartItem = {
        id: item.id,
        restaurant_id: item.restaurant_id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        price: item.price,
        category_id: item.category_id,
        description_en: item.description_en,
        description_ar: item.description_ar,
        image: item.image_url || item.image,
      };
      analyticsStore.track({ type: "add_to_cart", item_id: item.id, restaurant_id: item.restaurant_id });
      const result = addToCart(cartItem as any, restaurant.id, branch.id);
      if (result === "added") {
        setAddedItems((prev) => new Set(prev).add(item.id));
        setTimeout(() => setAddedItems((prev) => { const next = new Set(prev); next.delete(item.id); return next; }), 1500);
        toast({ title: t("Added to cart", "تمت الإضافة"), description: t(item.name_en, item.name_ar) });
      }
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
                  {restaurant.logoType === "image" && restaurant.logo
                    ? <ImageWithFallback src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover" preset="thumbnail" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">{restaurant.logo || "🍽️"}</div>
                  }
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
            {showDeliverySelector && (
              <DeliveryModeSelector
                branch={branch}
                restaurantColor={restaurant.color}
                restaurantId={restaurant.id}
                onModeChange={setDeliveryMode}
              />
            )}
          </div>
        </motion.div>

        {/* AI Image generation progress bar */}
        {isRunning && total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-purple-600/10 border border-purple-500/20 rounded-xl px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wand2 size={13} className="text-purple-400 animate-pulse" />
                <span className="text-xs text-purple-300 font-medium">
                  {t(`Generating AI food photos… ${completed} / ${total}`, `جارٍ إنشاء صور الطعام… ${completed} / ${total}`)}
                </span>
              </div>
              <span className="text-[10px] text-purple-400/60">{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-500 rounded-full"
                animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        {/* Restaurant banners */}
        {allOffers.some((o) => o.show_as_banner && o.image && (o.restaurant_id === restaurant.id || o.restaurant_id === "global")) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <HeroBannerSlider offers={allOffers} restaurantId={restaurant.id} />
          </motion.div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar" style={{ direction: "ltr" }}>
          {visibleCategories.map((cat) => (
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
            {filteredItems.map((item) => {
              const { outOfStock, displayPrice } = getItemEffective(item);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurantColor={restaurant.color}
                  isOpen={isOpen}
                  added={addedItems.has(item.id)}
                  onAdd={() => handleItemClick(item)}
                  genStatus={statuses[item.id]}
                  outOfStock={outOfStock}
                  displayPrice={displayPrice !== item.price ? displayPrice : undefined}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <WhatsAppSticky branchId={params.branchId} />
      <ItemDetailModal
        item={modalItem}
        restaurantId={restaurant.id}
        branchId={branch.id}
        restaurantColor={restaurant.color}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setModalItem(null); }}
      />
    </div>
  );
}
