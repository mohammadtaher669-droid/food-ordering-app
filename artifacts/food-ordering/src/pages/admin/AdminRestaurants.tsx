import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurants as defaultRestaurants } from "@/data/restaurants";
import { MapPin } from "lucide-react";

export default function AdminRestaurants() {
  const { t } = useLanguage();
  const [restaurants] = useState(defaultRestaurants);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("Restaurants", "المطاعم")}</h1>
      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-card border border-white/5 rounded-2xl p-5" data-testid={`admin-restaurant-${restaurant.id}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${restaurant.color}20` }}>
                {restaurant.logo}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{restaurant.name_en} / {restaurant.name_ar}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{restaurant.description_en}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MapPin size={11} />
                  <span>{restaurant.branches.length} {t("branches", "فروع")}</span>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: restaurant.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">{t("Restaurant management is configured in the data file. Contact developer to add/remove restaurants.", "إدارة المطاعم مهيأة في ملف البيانات.")}</p>
    </div>
  );
}
