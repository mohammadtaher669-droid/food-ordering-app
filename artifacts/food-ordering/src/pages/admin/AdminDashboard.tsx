import { useLanguage } from "@/contexts/LanguageContext";
import { restaurants, menuItems, coupons } from "@/data/restaurants";
import { UtensilsCrossed, MapPin, BookOpen, Star } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useLanguage();

  const reviews = JSON.parse(localStorage.getItem("admin_reviews") || "[]");
  const pendingReviews = reviews.filter((r: { approved: boolean }) => !r.approved).length;

  const stats = [
    { label_en: "Restaurants", label_ar: "المطاعم", value: restaurants.length, icon: UtensilsCrossed, color: "#FF7A00" },
    { label_en: "Branches", label_ar: "الفروع", value: restaurants.reduce((s, r) => s + r.branches.length, 0), icon: MapPin, color: "#6A0DAD" },
    { label_en: "Menu Items", label_ar: "عناصر القائمة", value: menuItems.length, icon: BookOpen, color: "#C1121F" },
    { label_en: "Pending Reviews", label_ar: "التقييمات المعلقة", value: pendingReviews, icon: Star, color: "#FF3D00" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("Dashboard", "لوحة التحكم")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label_en} className="bg-card border border-white/5 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${stat.color}15` }}>
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{t(stat.label_en, stat.label_ar)}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-5">
        <h2 className="font-semibold text-foreground mb-4">{t("Quick Info", "معلومات سريعة")}</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• {t("Admin password: admin123", "كلمة مرور الإدارة: admin123")}</li>
          <li>• {t("Available coupons: SAVE10, FIRST20, FREESHIP", "الأكواد المتاحة: SAVE10, FIRST20, FREESHIP")}</li>
          <li>• {t("Auto discount: 10% for orders over 50 SAR", "خصم تلقائي: 10% للطلبات فوق 50 ريال")}</li>
          <li>• {t("Pickup discount: 2 SAR", "خصم الاستلام: 2 ريال")}</li>
        </ul>
      </div>
    </div>
  );
}
