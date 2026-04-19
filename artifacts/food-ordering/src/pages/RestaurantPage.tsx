import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { restaurants, menuItems } from "@/data/restaurants";
import { useLanguage } from "@/contexts/LanguageContext";
import WorkingHoursStatus, { isBranchOpen } from "@/components/WorkingHoursStatus";
import { ChevronRight, ChevronLeft, MapPin, Star } from "lucide-react";

export default function RestaurantPage() {
  const params = useParams<{ restaurantId: string }>();
  const { t, isRTL } = useLanguage();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const restaurant = restaurants.find((r) => r.id === params.restaurantId);
  if (!restaurant) return <div className="pt-24 text-center text-muted-foreground">{t("Restaurant not found", "المطعم غير موجود")}</div>;

  const popularItems = menuItems.filter((m) => m.restaurant_id === restaurant.id && m.popular);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div
            className="rounded-2xl p-8 mb-6 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${restaurant.color}20, ${restaurant.color}05)`, border: `1px solid ${restaurant.color}30` }}
          >
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: `${restaurant.color}30` }}
              >
                {restaurant.logo}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t(restaurant.name_en, restaurant.name_ar)}</h1>
                <p className="text-muted-foreground mt-1">{t(restaurant.description_en, restaurant.description_ar)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Most Ordered */}
        {popularItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-primary fill-primary" />
              <h2 className="text-lg font-bold text-foreground">{t("Most Ordered", "الأكثر طلباً")}</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {popularItems.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 bg-card border border-white/5 rounded-xl p-4 w-48"
                  data-testid={`card-popular-${item.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3"
                    style={{ background: `${restaurant.color}20` }}
                  >
                    🍽️
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{t(item.name_en, item.name_ar)}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: restaurant.color }}>{item.price} {t("SAR", "ريال")}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Branches */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-bold text-foreground mb-4">{t("Select a Branch", "اختر الفرع")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {restaurant.branches.map((branch, i) => {
              const isOpen = isBranchOpen(branch);
              return (
                <Link key={branch.id} href={`/restaurant/${restaurant.id}/branch/${branch.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`bg-card border rounded-2xl p-5 cursor-pointer group transition-all hover:border-white/15 ${isOpen ? "border-white/5" : "border-white/5 opacity-70"}`}
                    data-testid={`card-branch-${branch.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-foreground">{t(branch.name_en, branch.name_ar)}</h3>
                      <WorkingHoursStatus branch={branch} />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin size={13} />
                      <span>{t(branch.address_en, branch.address_ar)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("Delivery fee:", "رسوم التوصيل:")} <span className="text-foreground font-medium">{branch.delivery_fee} {t("SAR", "ريال")}</span>
                      </span>
                      <div className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2" style={{ color: restaurant.color }}>
                        <span>{t("Order Now", "اطلب الآن")}</span>
                        <ChevronIcon size={14} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
