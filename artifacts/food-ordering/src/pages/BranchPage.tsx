import { useParams } from "wouter";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  restaurantStore, branchStore, categoryStore, menuStore, offerStore,
  branchItemOverrideStore, branchCategoryOverrideStore, checkSchedule,
  settingsStore,
} from "@/lib/store";
import WhatsAppSticky from "@/components/WhatsAppSticky";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import DeliveryModeSelector from "@/components/DeliveryModeSelector";
import type { MenuItem, BranchItemOverride } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import WorkingHoursStatus, { isBranchOpen } from "@/components/WorkingHoursStatus";
import { Plus, Check, Sparkles, Pin, Star, Trophy, TrendingUp, LayoutGrid, AlignJustify, Rows3 } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useToast } from "@/hooks/use-toast";
import { analyticsStore, userBehaviorStore } from "@/lib/store";
import ItemDetailModal from "@/components/ItemDetailModal";
import type { DeliveryMode } from "@/hooks/useDeliveryMode";

type DisplayMode = "grid" | "list" | "compact_grid";

function BadgeRow({ item }: { item: MenuItem }) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-1 flex-wrap">
      {item.pinned && <span className="text-[9px] bg-purple-600/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Pin size={7} /> {t("Pinned","مثبت")}</span>}
      {item.is_best_seller && <span className="text-[9px] bg-red-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Trophy size={7} /> {t("Best Seller","الأكثر مبيعاً")}</span>}
      {item.featured && !item.pinned && !item.is_best_seller && <span className="text-[9px] bg-amber-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Star size={7} /> {t("Featured","مميز")}</span>}
      {item.is_new && <span className="text-[9px] bg-yellow-400/90 text-black font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Sparkles size={8} /> {t("New","جديد")}</span>}
      {item.is_popular && !item.featured && !item.is_best_seller && <span className="text-[9px] bg-primary/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp size={7} /> {t("Popular","الأكثر")}</span>}
    </div>
  );
}

function MenuItemCard({
  item, restaurantColor, isOpen, added, onAdd, outOfStock, displayPrice,
}: {
  item: MenuItem; restaurantColor: string; isOpen: boolean;
  added: boolean; onAdd: () => void; outOfStock?: boolean; displayPrice?: number;
}) {
  const { t } = useLanguage();
  const imgSrc = item.image_url || item.image;
  const effectivePrice = displayPrice ?? item.price;
  const isDisabled = !isOpen || outOfStock;

  return (
    <motion.div layout className={`bg-card border rounded-2xl overflow-hidden flex flex-col ${outOfStock ? "border-amber-500/15 opacity-80" : "border-white/5"}`} data-testid={`card-menuitem-${item.id}`} whileHover={{ y: -2 }}>
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 160, background: `${restaurantColor}15` }}>
        {imgSrc
          ? <ImageWithFallback src={imgSrc} alt={t(item.name_en, item.name_ar)} className="w-full h-full object-cover" preset="product" />
          : <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🍽️</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-amber-500/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">{t("Out of Stock","غير متوفر حالياً")}</span>
          </div>
        )}
        <div className="absolute top-2 left-2"><BadgeRow item={item} /></div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">{t(item.name_en, item.name_ar)}</h3>
        {(item.description_en || item.description_ar) && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1 flex-1">{t(item.description_en, item.description_ar)}</p>
        )}
        {item.calories != null && item.calories > 0 && (
          <p className="text-[10px] text-muted-foreground/60 mb-1">🔥 {item.calories} {t("kcal","سعرة")}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ color: restaurantColor }}>{effectivePrice} ﷼</span>
            {displayPrice && displayPrice !== item.price && <span className="text-[10px] text-muted-foreground/50 line-through">{item.price} ﷼</span>}
          </div>
          <button onClick={onAdd} disabled={isDisabled}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isDisabled ? "opacity-30 cursor-not-allowed bg-white/5" : added ? "bg-green-500 scale-95" : "hover:opacity-90 active:scale-95"}`}
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

function MenuItemListCard({
  item, restaurantColor, isOpen, added, onAdd, outOfStock, displayPrice,
}: {
  item: MenuItem; restaurantColor: string; isOpen: boolean;
  added: boolean; onAdd: () => void; outOfStock?: boolean; displayPrice?: number;
}) {
  const { t } = useLanguage();
  const imgSrc = item.image_url || item.image;
  const effectivePrice = displayPrice ?? item.price;
  const isDisabled = !isOpen || outOfStock;

  return (
    <motion.div layout className={`bg-card border rounded-2xl overflow-hidden flex flex-row items-center gap-3 p-3 ${outOfStock ? "border-amber-500/15 opacity-80" : "border-white/5"}`} data-testid={`card-menuitem-${item.id}`} whileHover={{ x: 2 }}>
      <div className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ width: 72, height: 72, background: `${restaurantColor}15` }}>
        {imgSrc
          ? <ImageWithFallback src={imgSrc} alt={t(item.name_en, item.name_ar)} className="w-full h-full object-cover" preset="thumbnail" />
          : <div className="w-full h-full flex items-center justify-center text-2xl opacity-40">🍽️</div>
        }
        {outOfStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-[8px] text-white font-bold text-center px-1">{t("Out","غير متوفر")}</span></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1 mb-0.5">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 flex-1">{t(item.name_en, item.name_ar)}</h3>
        </div>
        <BadgeRow item={item} />
        {(item.description_en || item.description_ar) && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t(item.description_en, item.description_ar)}</p>
        )}
        {item.calories != null && item.calories > 0 && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">🔥 {item.calories} {t("kcal","سعرة")}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="font-bold text-sm" style={{ color: restaurantColor }}>{effectivePrice} ﷼</span>
        {displayPrice && displayPrice !== item.price && <span className="text-[10px] text-muted-foreground/50 line-through">{item.price} ﷼</span>}
        <button onClick={onAdd} disabled={isDisabled}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isDisabled ? "opacity-30 cursor-not-allowed bg-white/5" : added ? "bg-green-500 scale-95" : "hover:opacity-90 active:scale-95"}`}
          style={!isDisabled && !added ? { background: restaurantColor } : {}}
          data-testid={`btn-add-${item.id}`}
        >
          {added ? <Check size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
        </button>
      </div>
    </motion.div>
  );
}

function MenuItemCompactCard({
  item, restaurantColor, isOpen, added, onAdd, outOfStock, displayPrice,
}: {
  item: MenuItem; restaurantColor: string; isOpen: boolean;
  added: boolean; onAdd: () => void; outOfStock?: boolean; displayPrice?: number;
}) {
  const { t } = useLanguage();
  const imgSrc = item.image_url || item.image;
  const effectivePrice = displayPrice ?? item.price;
  const isDisabled = !isOpen || outOfStock;

  return (
    <motion.div layout className={`bg-card border rounded-xl overflow-hidden flex flex-col ${outOfStock ? "border-amber-500/15 opacity-80" : "border-white/5"}`} data-testid={`card-menuitem-${item.id}`} whileHover={{ y: -1 }}>
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 100, background: `${restaurantColor}15` }}>
        {imgSrc
          ? <ImageWithFallback src={imgSrc} alt={t(item.name_en, item.name_ar)} className="w-full h-full object-cover" preset="thumbnail" />
          : <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🍽️</div>
        }
        {outOfStock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-amber-500/90 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">{t("Out","نفد")}</span></div>}
        {item.is_new && <div className="absolute top-1 left-1"><span className="text-[8px] bg-yellow-400/90 text-black font-bold px-1.5 py-0.5 rounded-full">New</span></div>}
      </div>
      <div className="p-2 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-2 mb-1">{t(item.name_en, item.name_ar)}</h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-xs" style={{ color: restaurantColor }}>{effectivePrice} ﷼</span>
          <button onClick={onAdd} disabled={isDisabled}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isDisabled ? "opacity-30 cursor-not-allowed bg-white/5" : added ? "bg-green-500 scale-95" : "hover:opacity-90 active:scale-95"}`}
            style={!isDisabled && !added ? { background: restaurantColor } : {}}
            data-testid={`btn-add-${item.id}`}
          >
            {added ? <Check size={12} className="text-white" /> : <Plus size={12} className="text-white" />}
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

  const settings = useStore(useCallback(() => settingsStore.get(), []));
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const allBranches = useStore(useCallback(() => branchStore.getAll(), []));
  const categories = useStore(useCallback(() => categoryStore.getByRestaurant(params.restaurantId), [params.restaurantId]));
  const allMenuItems = useStore(useCallback(() => menuStore.getByRestaurant(params.restaurantId), [params.restaurantId]));
  const allOffers = useStore(useCallback(() => offerStore.getActive(), []));
  const branchItemOverrides = useStore(useCallback(() => branchItemOverrideStore.getForBranch(params.branchId), [params.branchId]));
  const branchCatOverrides = useStore(useCallback(() => branchCategoryOverrideStore.getForBranch(params.branchId), [params.branchId]));

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => (settings.menu_display_mode as DisplayMode) || "grid");

  const restaurant = restaurants.find((r) => r.id === params.restaurantId);
  const branch = allBranches.find((b) => b.id === params.branchId);

  if (!restaurant || !branch) {
    return <div className="pt-16 text-center text-muted-foreground">{t("Branch not found","الفرع غير موجود")}</div>;
  }

  const isOpen = isBranchOpen(branch);

  const overrideMap: Record<string, BranchItemOverride> = {};
  for (const o of branchItemOverrides) overrideMap[o.item_id] = o;
  const catOverrideHidden = new Set(branchCatOverrides.filter((o) => o.hidden).map((o) => o.category_id));

  const visibleCategories = categories.filter((c) => !c.hidden && !catOverrideHidden.has(c.id));
  const displayCategory = activeCategory || (visibleCategories[0]?.id ?? null);

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
    setModalItem(item);
    setModalOpen(true);
  };

  const gridClass =
    displayMode === "list"
      ? "flex flex-col gap-2"
      : displayMode === "compact_grid"
      ? "grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      : "grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-background pt-16 pb-28" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <div className="max-w-5xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${restaurant.color}15, transparent)`, border: `1px solid ${restaurant.color}25` }}>
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
                {t("This branch is currently closed. Orders are not available.","هذا الفرع مغلق حالياً. الطلبات غير متاحة.")}
              </div>
            )}
            {showDeliverySelector && (
              <DeliveryModeSelector branch={branch} restaurantColor={restaurant.color} restaurantId={restaurant.id} onModeChange={setDeliveryMode} />
            )}
          </div>
        </motion.div>

        {allOffers.some((o) => o.show_as_banner && o.image && (o.restaurant_id === restaurant.id || o.restaurant_id === "global")) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <HeroBannerSlider offers={allOffers} restaurantId={restaurant.id} />
          </motion.div>
        )}

        {/* Category tabs + display mode toggle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1 no-scrollbar" style={{ direction: "ltr" }}>
            {visibleCategories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${displayCategory === cat.id ? "text-primary-foreground" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`}
                style={displayCategory === cat.id ? { background: restaurant.color } : {}}
                data-testid={`tab-category-${cat.id}`}
              >
                {t(cat.name_en, cat.name_ar)}
              </button>
            ))}
          </div>

          {/* Display mode toggle */}
          <div className="flex gap-1 flex-shrink-0 bg-card border border-white/5 rounded-xl p-1">
            {([
              { mode: "grid" as const, icon: <LayoutGrid size={14} /> },
              { mode: "compact_grid" as const, icon: <Rows3 size={14} /> },
              { mode: "list" as const, icon: <AlignJustify size={14} /> },
            ]).map(({ mode, icon }) => (
              <button key={mode} type="button" onClick={() => setDisplayMode(mode)}
                title={mode}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${displayMode === mode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${displayCategory}-${displayMode}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={gridClass}>
            {filteredItems.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                {t("No items in this category","لا توجد عناصر في هذه الفئة")}
              </p>
            )}
            {filteredItems.map((item) => {
              const { outOfStock, displayPrice } = getItemEffective(item);
              const cardProps = {
                item,
                restaurantColor: restaurant.color,
                isOpen,
                added: addedItems.has(item.id),
                onAdd: () => handleItemClick(item),
                outOfStock,
                displayPrice: displayPrice !== item.price ? displayPrice : undefined,
              };
              if (displayMode === "list") return <MenuItemListCard key={item.id} {...cardProps} />;
              if (displayMode === "compact_grid") return <MenuItemCompactCard key={item.id} {...cardProps} />;
              return <MenuItemCard key={item.id} {...cardProps} />;
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
        onAdded={(itemId) => {
          setAddedItems((prev) => new Set(prev).add(itemId));
          setTimeout(() => setAddedItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; }), 1500);
        }}
      />
    </div>
  );
}
