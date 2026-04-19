import { Link } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore, offerStore } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import OffersCarousel from "@/components/OffersCarousel";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import { useCallback } from "react";

export default function Home() {
  const { t, isRTL } = useLanguage();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));
  const offers = useStore(useCallback(() => offerStore.getActive(), []));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {t("Order food your way", "اطلب طعامك بطريقتك")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t(
              "Order directly from your favorite restaurants and get fresh meals delivered to your door",
              "اطلب مباشرة من مطاعمك المفضلة واحصل على وجبات طازجة على بابك"
            )}
          </p>
        </motion.div>

        {/* Offers Carousel */}
        {offers.length > 0 && <OffersCarousel offers={offers} />}

        {/* Restaurants Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {t("Our Restaurants", "مطاعمنا")}
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {restaurants.map((restaurant, i) => {
              const branchCount = branches.filter((b) => b.restaurant_id === restaurant.id).length;
              return (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/restaurant/${restaurant.id}`}>
                    <div
                      className="bg-card border border-white/5 rounded-2xl overflow-hidden cursor-pointer group hover:border-white/10 transition-all duration-300"
                      data-testid={`card-restaurant-${restaurant.id}`}
                      style={{ boxShadow: `0 0 40px ${restaurant.color}10` }}
                    >
                      <div
                        className="h-2 w-full"
                        style={{ background: `linear-gradient(90deg, ${restaurant.color}, ${restaurant.color}80)` }}
                      />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{ background: `${restaurant.color}20` }}
                          >
                            {restaurant.logoType === "image" && restaurant.logo ? (
                              <img src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">{restaurant.logo}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={11} />
                            <span>{branchCount} {t("branches", "فروع")}</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {t(restaurant.name_en, restaurant.name_ar)}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {t(restaurant.description_en, restaurant.description_ar)}
                        </p>
                        <div
                          className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2"
                          style={{ color: restaurant.color }}
                        >
                          <span>{t("View Menu", "عرض القائمة")}</span>
                          <ChevronIcon size={14} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
