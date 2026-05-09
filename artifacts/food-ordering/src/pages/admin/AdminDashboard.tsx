import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, branchStore, menuStore, reviewStore, couponStore, modifierGroupStore, modifierOptionStore, addOnStore } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { UtensilsCrossed, MapPin, BookOpen, Star, Tag, Download, Upload, RotateCcw } from "lucide-react";
import { resetStore } from "@/lib/store";
import { initializeStore, } from "@/lib/initStore";
import { useToast } from "@/hooks/use-toast";
import { markInitialized } from "@/lib/store";

// Override initializeStore to force re-seed
function forceReseed() {
  localStorage.removeItem("store_initialized");
  initializeStore();
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const branches = useStore(useCallback(() => branchStore.getAll(), []));
  const menuItems = useStore(useCallback(() => menuStore.getAll(), []));
  const reviews = useStore(useCallback(() => reviewStore.getAll(), []));
  const coupons = useStore(useCallback(() => couponStore.getAll(), []));

  const pendingReviews = reviews.filter((r) => !r.approved).length;

  const stats = [
    { label_en: "Restaurants", label_ar: "المطاعم", value: restaurants.length, icon: UtensilsCrossed, color: "#FF7A00" },
    { label_en: "Branches", label_ar: "الفروع", value: branches.length, icon: MapPin, color: "#6A0DAD" },
    { label_en: "Menu Items", label_ar: "عناصر القائمة", value: menuItems.length, icon: BookOpen, color: "#C1121F" },
    { label_en: "Pending Reviews", label_ar: "التقييمات المعلقة", value: pendingReviews, icon: Star, color: "#FF5722" },
    { label_en: "Coupons", label_ar: "الأكواد", value: coupons.length, icon: Tag, color: "#10B981" },
  ];

  const handleExport = () => {
    const data = {
      restaurants: restaurantStore.getAll(),
      branches: branchStore.getAll(),
      categories: (JSON.parse(localStorage.getItem("store_categories") || "[]")),
      menuItems: menuStore.getAll(),
      offers: (JSON.parse(localStorage.getItem("store_offers") || "[]")),
      coupons: couponStore.getAll(),
      modifierGroups: modifierGroupStore.getAll(),
      modifierOptions: modifierOptionStore.getAll(),
      addOns: addOnStore.getAll(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matami-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("Exported!", "تم التصدير!"), description: t("Data exported as JSON", "تم تصدير البيانات كـ JSON") });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.restaurants) restaurantStore.set(data.restaurants);
          if (data.branches) branchStore.set(data.branches);
          if (data.categories) localStorage.setItem("store_categories", JSON.stringify(data.categories));
          if (data.menuItems) menuStore.set(data.menuItems);
          if (data.offers) localStorage.setItem("store_offers", JSON.stringify(data.offers));
          if (data.coupons) couponStore.set(data.coupons);
          if (data.modifierGroups) modifierGroupStore.set(data.modifierGroups);
          if (data.modifierOptions) modifierOptionStore.set(data.modifierOptions);
          if (data.addOns) addOnStore.set(data.addOns);
          markInitialized();
          toast({ title: t("Imported!", "تم الاستيراد!"), description: t("Data loaded successfully", "تم تحميل البيانات بنجاح") });
        } catch {
          toast({ title: t("Error", "خطأ"), description: t("Invalid JSON file", "ملف JSON غير صالح"), variant: "destructive" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirm(t("Reset all data to defaults? This cannot be undone.", "إعادة تعيين جميع البيانات؟ لا يمكن التراجع."))) return;
    resetStore();
    setTimeout(() => forceReseed(), 100);
    toast({ title: t("Reset complete", "تمت إعادة التعيين") });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("Dashboard", "لوحة التحكم")}</h1>
        <div className="flex gap-2">
          <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition" data-testid="btn-import">
            <Upload size={14} /> {t("Import", "استيراد")}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground transition" data-testid="btn-export">
            <Download size={14} /> {t("Export", "تصدير")}
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-sm text-destructive/70 hover:text-destructive transition">
            <RotateCcw size={14} /> {t("Reset", "إعادة تعيين")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("Quick Info", "معلومات سريعة")}</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• {t("Admin password: admin123", "كلمة مرور الإدارة: admin123")}</li>
            <li>• {t("Available coupons: SAVE10, FIRST20, FREESHIP", "الأكواد المتاحة: SAVE10, FIRST20, FREESHIP")}</li>
            <li>• {t("Auto discount: 10% for orders over 50 SAR", "خصم تلقائي: 10% للطلبات فوق 50 ريال")}</li>
          </ul>
        </div>
        <div className="bg-card border border-white/5 rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("Data Tools", "أدوات البيانات")}</h2>
          <p className="text-sm text-muted-foreground mb-3">{t("Export all data as JSON backup or import from file.", "تصدير جميع البيانات كـ JSON أو استيرادها من ملف.")}</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
              <Download size={14} /> {t("Export JSON", "تصدير JSON")}
            </button>
            <button onClick={handleImport} className="flex items-center gap-1.5 px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground">
              <Upload size={14} /> {t("Import JSON", "استيراد JSON")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
