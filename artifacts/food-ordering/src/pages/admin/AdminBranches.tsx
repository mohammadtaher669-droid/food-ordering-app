import { useLanguage } from "@/contexts/LanguageContext";
import { restaurants } from "@/data/restaurants";
import WorkingHoursStatus from "@/components/WorkingHoursStatus";
import { Phone, MapPin, DollarSign } from "lucide-react";

export default function AdminBranches() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("Branches", "الفروع")}</h1>
      <div className="space-y-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{restaurant.logo}</span>
              <h2 className="font-bold text-foreground">{t(restaurant.name_en, restaurant.name_ar)}</h2>
            </div>
            <div className="space-y-3">
              {restaurant.branches.map((branch) => (
                <div key={branch.id} className="bg-card border border-white/5 rounded-2xl p-5" data-testid={`admin-branch-${branch.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{t(branch.name_en, branch.name_ar)}</h3>
                    <WorkingHoursStatus branch={branch} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={13} />
                      <span className="font-mono">+{branch.whatsapp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign size={13} />
                      <span>{branch.delivery_fee} {t("SAR delivery", "ريال توصيل")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <MapPin size={13} />
                      <span>{t(branch.address_en, branch.address_ar)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">{t("Branch configuration is in the data file. Contact developer to modify branch details.", "تكوين الفروع في ملف البيانات.")}</p>
    </div>
  );
}
