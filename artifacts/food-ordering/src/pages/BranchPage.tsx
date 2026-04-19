import { useParams } from "wouter";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { restaurantStore, branchStore, categoryStore, menuStore } from "@/lib/store";
import type { MenuItem } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import WorkingHoursStatus, { isBranchOpen } from "@/components/WorkingHoursStatus";
import { Plus, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const restaurant = restaurants.find((r) => r.id === params.restaurantId);
  const branch = allBranches.find((b) => b.id === params.branchId);

  if (!restaurant || !branch) return <div className="pt-24 text-center text-muted-foreground">{t("Branch not found", "الفرع غير موجود")}</div>;

  const isOpen = isBranchOpen(branch);
  const displayCategory = activeCategory || (categories[0]?.id ?? null);
  const filteredItems = allMenuItems.filter((m) => m.category_id === displayCategory && m.is_available);

  const handleAddToCart = (item: MenuItem) => {
    if (!isOpen) return;
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
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-4">
        {/* Branch Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="rounded-2xl p-6"
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
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${displayCategory === cat.id ? "text-primary-foreground" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`}
              style={displayCategory === cat.id ? { background: restaurant.color } : {}}
              data-testid={`tab-category-${cat.id}`}
            >
              {t(cat.name_en, cat.name_ar)}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={displayCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {filteredItems.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-2 text-center py-8">{t("No items in this category", "لا توجد عناصر في هذه الفئة")}</p>
            )}
            {filteredItems.map((item) => {
              const added = addedItems.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-4"
                  data-testid={`card-menuitem-${item.id}`}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: `${restaurant.color}15` }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name_en} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm leading-tight">{t(item.name_en, item.name_ar)}</h3>
                          {item.is_new && (
                            <span className="text-[10px] bg-yellow-400/15 text-yellow-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Sparkles size={9} /> {t("New", "جديد")}
                            </span>
                          )}
                          {item.is_popular && (
                            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                              ⭐ {t("Popular", "الأكثر طلباً")}
                            </span>
                          )}
                        </div>
                        {(item.description_en || item.description_ar) && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(item.description_en, item.description_ar)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-base" style={{ color: restaurant.color }}>
                        {item.price} {t("SAR", "ريال")}
                      </span>
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!isOpen}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${!isOpen ? "opacity-30 cursor-not-allowed bg-white/5" : added ? "bg-green-500 scale-95" : "hover:opacity-90"}`}
                        style={isOpen && !added ? { background: restaurant.color } : {}}
                        data-testid={`btn-add-${item.id}`}
                      >
                        {added ? <Check size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
