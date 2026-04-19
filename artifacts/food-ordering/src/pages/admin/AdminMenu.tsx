import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { menuItems as defaultMenu, restaurants } from "@/data/restaurants";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface MenuItem {
  id: string;
  restaurant_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  category_en: string;
  category_ar: string;
  description_en: string;
  description_ar: string;
  popular?: boolean;
}

export default function AdminMenu() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>(() => {
    const stored = localStorage.getItem("admin_menu");
    return stored ? JSON.parse(stored) : defaultMenu;
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRestaurant, setFilterRestaurant] = useState("");
  const [form, setForm] = useState<Partial<MenuItem>>({ restaurant_id: restaurants[0].id, category_en: "Mains", category_ar: "الأطباق الرئيسية", price: 0, popular: false });

  const save = (updated: MenuItem[]) => {
    setItems(updated);
    localStorage.setItem("admin_menu", JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.name_en || !form.name_ar || !form.restaurant_id) return;
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      restaurant_id: form.restaurant_id!,
      name_en: form.name_en!,
      name_ar: form.name_ar!,
      price: form.price || 0,
      category_en: form.category_en || "Mains",
      category_ar: form.category_ar || "الأطباق الرئيسية",
      description_en: form.description_en || "",
      description_ar: form.description_ar || "",
      popular: form.popular || false,
    };
    save([...items, newItem]);
    setShowAdd(false);
    setForm({ restaurant_id: restaurants[0].id, category_en: "Mains", category_ar: "الأطباق الرئيسية", price: 0, popular: false });
  };

  const removeItem = (id: string) => save(items.filter((i) => i.id !== id));

  const filtered = filterRestaurant ? items.filter((i) => i.restaurant_id === filterRestaurant) : items;

  const getRestaurantColor = (restId: string) => restaurants.find((r) => r.id === restId)?.color || "#FF7A00";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("Menu Items", "عناصر القائمة")}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition" data-testid="btn-add-menu-item">
          <Plus size={14} /> {t("Add Item", "إضافة عنصر")}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setFilterRestaurant("")} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filterRestaurant ? "bg-primary text-primary-foreground" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`}>
          {t("All", "الكل")}
        </button>
        {restaurants.map((r) => (
          <button key={r.id} onClick={() => setFilterRestaurant(r.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterRestaurant === r.id ? "text-white" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`} style={filterRestaurant === r.id ? { background: r.color } : {}}>
            {t(r.name_en, r.name_ar)}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-card border border-white/5 rounded-2xl p-5 mb-5 space-y-3">
          <h3 className="font-medium">{t("New Menu Item", "عنصر جديد")}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Restaurant", "المطعم")}</label>
              <select value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none">
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Price (SAR)", "السعر (ريال)")}</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Name (EN)", "الاسم (EN)")}</label>
              <input value={form.name_en || ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none" data-testid="input-item-name-en" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Name (AR)", "الاسم (AR)")}</label>
              <input value={form.name_ar || ""} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none" data-testid="input-item-name-ar" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Category (EN)", "الفئة (EN)")}</label>
              <input value={form.category_en || ""} onChange={(e) => setForm({ ...form, category_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Category (AR)", "الفئة (AR)")}</label>
              <input value={form.category_ar || ""} onChange={(e) => setForm({ ...form, category_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-foreground focus:outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.popular || false} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="accent-primary" />
            <span className="text-muted-foreground">{t("Mark as popular", "تحديد كـ \"الأكثر طلباً\"")}</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-menu-item">{t("Save", "حفظ")}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground">{t("Cancel", "إلغاء")}</button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const color = getRestaurantColor(item.restaurant_id);
          const rest = restaurants.find((r) => r.id === item.restaurant_id);
          return (
            <div key={item.id} className="bg-card border border-white/5 rounded-xl p-4 flex items-center gap-3" data-testid={`admin-menu-item-${item.id}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${color}15` }}>
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name_en} / {item.name_ar}</p>
                <p className="text-xs text-muted-foreground">{rest ? t(rest.name_en, rest.name_ar) : item.restaurant_id} · {item.category_en}</p>
              </div>
              <span className="font-bold text-sm flex-shrink-0" style={{ color }}>{item.price} SAR</span>
              <button onClick={() => removeItem(item.id)} className="text-destructive/60 hover:text-destructive transition flex-shrink-0" data-testid={`btn-delete-item-${item.id}`}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
