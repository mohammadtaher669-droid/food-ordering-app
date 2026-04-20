import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, categoryStore, menuStore } from "@/lib/store";
import type { Category, MenuItem } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { Plus, Trash2, Edit2, Check, X, FolderPlus, GripVertical, Star, Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import ImageWithFallback from "@/components/ImageWithFallback";

function F({ label, value, onChange, ...p }: { label: string; value: string | number; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" {...p} />
    </div>
  );
}

export default function AdminMenu() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const allCategories = useStore(useCallback(() => categoryStore.getAll(), []));
  const allItems = useStore(useCallback(() => menuStore.getAll(), []));

  const [selectedRestaurant, setSelectedRestaurant] = useState(() => restaurantStore.getAll()[0]?.id || "");
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name_en: "", name_ar: "" });
  const [itemForm, setItemForm] = useState<Partial<MenuItem & { category_id: string }>>({
    name_en: "", name_ar: "", price: 0, description_en: "", description_ar: "",
    is_available: true, is_popular: false, is_new: false, category_id: "",
  });
  const categories = allCategories.filter((c) => c.restaurant_id === selectedRestaurant);
  const items = allItems.filter((m) => m.restaurant_id === selectedRestaurant);
  const restaurant = restaurants.find((r) => r.id === selectedRestaurant);

  // ─────────────────── CATEGORY CRUD ───────────────────
  const saveCat = () => {
    if (!catForm.name_en.trim() || !catForm.name_ar.trim()) return;
    const cat: Category = {
      id: editingCatId || `cat-${Date.now()}`,
      restaurant_id: selectedRestaurant,
      name_en: catForm.name_en, name_ar: catForm.name_ar,
      sort_order: editingCatId ? (allCategories.find((c) => c.id === editingCatId)?.sort_order || 99) : allCategories.filter((c) => c.restaurant_id === selectedRestaurant).length + 1,
    };
    categoryStore.save(cat);
    toast({ title: editingCatId ? t("Category updated", "تم تحديث الفئة") : t("Category added", "تمت إضافة الفئة") });
    setShowCatForm(false); setEditingCatId(null); setCatForm({ name_en: "", name_ar: "" });
  };
  const deleteCat = (id: string) => {
    if (!confirm(t("Delete category and all its items?", "حذف الفئة وجميع عناصرها؟"))) return;
    categoryStore.delete(id);
    allItems.filter((m) => m.category_id === id).forEach((m) => menuStore.delete(m.id));
  };
  const editCat = (cat: Category) => { setEditingCatId(cat.id); setCatForm({ name_en: cat.name_en, name_ar: cat.name_ar }); setShowCatForm(true); };

  // ─────────────────── ITEM CRUD ───────────────────
  const saveItem = () => {
    if (!itemForm.name_en?.trim() || !itemForm.name_ar?.trim() || !itemForm.category_id) {
      toast({ title: t("Required: name (EN, AR) and category", "مطلوب: الاسم والفئة"), variant: "destructive" }); return;
    }
    const newItem: MenuItem = {
      id: editingItemId || `item-${Date.now()}`,
      restaurant_id: selectedRestaurant,
      category_id: itemForm.category_id!,
      name_en: itemForm.name_en!, name_ar: itemForm.name_ar!,
      description_en: itemForm.description_en || "", description_ar: itemForm.description_ar || "",
      price: itemForm.price || 0,
      image: itemForm.image,
      calories: itemForm.calories || undefined,
      is_available: itemForm.is_available ?? true,
      is_popular: itemForm.is_popular || false,
      is_new: itemForm.is_new || false,
    };
    menuStore.save(newItem);
    toast({ title: editingItemId ? t("Item updated", "تم تحديث العنصر") : t("Item added", "تمت الإضافة") });
    setShowItemForm(false); setEditingItemId(null);
    setItemForm({ name_en: "", name_ar: "", price: 0, description_en: "", description_ar: "", is_available: true, is_popular: false, is_new: false, category_id: "" });
  };
  const editItem = (item: MenuItem) => { setEditingItemId(item.id); setItemForm({ ...item }); setShowItemForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteItem = (id: string) => { menuStore.delete(id); };
  const toggleField = (item: MenuItem, field: "is_available" | "is_popular" | "is_new") => {
    menuStore.save({ ...item, [field]: !item[field] });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("Menu Builder", "قائمة الطعام")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowCatForm(true); setEditingCatId(null); setCatForm({ name_en: "", name_ar: "" }); }} className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition" data-testid="btn-add-category">
            <FolderPlus size={14} /> {t("Add Category", "إضافة فئة")}
          </button>
          <button onClick={() => { setShowItemForm(true); setEditingItemId(null); setItemForm({ name_en: "", name_ar: "", price: 0, description_en: "", description_ar: "", is_available: true, is_popular: false, is_new: false, category_id: categories[0]?.id || "" }); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-add-menu-item">
            <Plus size={14} /> {t("Add Item", "إضافة عنصر")}
          </button>
        </div>
      </div>

      {/* Restaurant Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {restaurants.map((r) => (
          <button key={r.id} onClick={() => setSelectedRestaurant(r.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${selectedRestaurant === r.id ? "text-white" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`}
            style={selectedRestaurant === r.id ? { background: r.color } : {}}>
            {t(r.name_en, r.name_ar)}
          </button>
        ))}
      </div>

      {/* Category Form */}
      {showCatForm && (
        <div className="bg-card border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-foreground text-sm">{editingCatId ? t("Edit Category", "تعديل الفئة") : t("New Category", "فئة جديدة")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <F label={t("Name (EN)", "الاسم (EN)")} value={catForm.name_en} onChange={(v) => setCatForm({ ...catForm, name_en: v })} />
            <F label={t("Name (AR)", "الاسم (AR)")} value={catForm.name_ar} onChange={(v) => setCatForm({ ...catForm, name_ar: v })} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveCat} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-category"><Check size={13} className="inline mr-1" /> {t("Save", "حفظ")}</button>
            <button onClick={() => { setShowCatForm(false); setEditingCatId(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" /> {t("Cancel", "إلغاء")}</button>
          </div>
        </div>
      )}

      {/* Item Form */}
      {showItemForm && (
        <div className="bg-card border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">{editingItemId ? t("Edit Item", "تعديل العنصر") : t("New Menu Item", "عنصر جديد")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Category", "الفئة")}</label>
              <select value={itemForm.category_id || ""} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
                <option value="">{t("Select category...", "اختر فئة...")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{t(c.name_en, c.name_ar)}</option>)}
              </select>
            </div>
            <F label={t("Price (SAR)", "السعر (ريال)")} value={itemForm.price || ""} onChange={(v) => setItemForm({ ...itemForm, price: Number(v) })} type="number" step="0.5" min="0" />
            <F label={t("Name (EN)", "الاسم (EN)")} value={itemForm.name_en || ""} onChange={(v) => setItemForm({ ...itemForm, name_en: v })} data-testid="input-item-name-en" />
            <F label={t("Name (AR)", "الاسم (AR)")} value={itemForm.name_ar || ""} onChange={(v) => setItemForm({ ...itemForm, name_ar: v })} data-testid="input-item-name-ar" />
            <F label={t("Description (EN)", "الوصف (EN)")} value={itemForm.description_en || ""} onChange={(v) => setItemForm({ ...itemForm, description_en: v })} />
            <F label={t("Description (AR)", "الوصف (AR)")} value={itemForm.description_ar || ""} onChange={(v) => setItemForm({ ...itemForm, description_ar: v })} />
            <F label={t("Calories (optional)", "السعرات الحرارية (اختياري)")} value={itemForm.calories || ""} onChange={(v) => setItemForm({ ...itemForm, calories: v ? Number(v) : undefined })} type="number" min="0" placeholder="e.g. 650" data-testid="input-item-calories" />
          </div>

          {/* Image Upload */}
          <ImageUploader
            preset="product"
            label={t("Item Image (optional)", "صورة العنصر (اختياري)")}
            value={itemForm.image}
            onChange={(url) => setItemForm((f) => ({ ...f, image: url }))}
            onDelete={() => setItemForm((f) => ({ ...f, image: undefined }))}
            data-testid="uploader-item-image"
          />

          {/* Flags */}
          <div className="flex gap-4 flex-wrap">
            {[
              { field: "is_available" as const, label_en: "Available", label_ar: "متاح" },
              { field: "is_popular" as const, label_en: "Popular (Most Ordered)", label_ar: "الأكثر طلباً" },
              { field: "is_new" as const, label_en: "New Item", label_ar: "عنصر جديد" },
            ].map(({ field, label_en, label_ar }) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!(itemForm as any)[field]} onChange={(e) => setItemForm({ ...itemForm, [field]: e.target.checked })} className="accent-primary" />
                <span className="text-muted-foreground">{t(label_en, label_ar)}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveItem} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-menu-item"><Check size={13} className="inline mr-1" />{t("Save", "حفظ")}</button>
            <button onClick={() => { setShowItemForm(false); setEditingItemId(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" />{t("Cancel", "إلغاء")}</button>
          </div>
        </div>
      )}

      {/* Categories & Items */}
      <div className="space-y-6">
        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("No categories yet. Add one to get started.", "لا توجد فئات بعد. أضف فئة للبدء.")}</p>
          </div>
        )}
        {categories.map((cat) => {
          const catItems = items.filter((m) => m.category_id === cat.id);
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-muted-foreground/40" />
                  <h3 className="font-bold text-foreground">{t(cat.name_en, cat.name_ar)}</h3>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{catItems.length} {t("items", "عناصر")}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => editCat(cat)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteCat(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition" data-testid={`btn-delete-cat-${cat.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 pl-5">
                {catItems.length === 0 && <p className="text-sm text-muted-foreground">{t("No items in this category", "لا توجد عناصر في هذه الفئة")}</p>}
                {catItems.map((item) => (
                  <div key={item.id} className="bg-card border border-white/5 rounded-xl p-3 flex items-center gap-3" data-testid={`admin-menu-item-${item.id}`}>
                    <ImageWithFallback src={item.image} alt={item.name_en} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" preset="thumbnail" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{item.name_en}</p>
                        <p className="text-xs text-muted-foreground">/ {item.name_ar}</p>
                        {item.is_new && <span className="text-[10px] bg-yellow-400/15 text-yellow-400 px-1.5 rounded-full">{t("New", "جديد")}</span>}
                        {item.is_popular && <span className="text-[10px] bg-primary/15 text-primary px-1.5 rounded-full">⭐ {t("Popular", "شهير")}</span>}
                        {!item.is_available && <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 rounded-full">{t("Unavailable", "غير متاح")}</span>}
                      </div>
                    </div>
                    <span className="font-bold text-sm flex-shrink-0" style={{ color: restaurant?.color || "#FF7A00" }}>{item.price} ﷼</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => toggleField(item, "is_available")} className={`p-1 rounded transition ${item.is_available ? "text-green-400 hover:text-red-400" : "text-red-400 hover:text-green-400"}`} title={t("Toggle availability", "تبديل التوفر")}>
                        {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => toggleField(item, "is_popular")} className={`p-1 rounded transition ${item.is_popular ? "text-primary" : "text-muted-foreground hover:text-primary"}`} title={t("Toggle popular", "تبديل الشهرة")}>
                        <Star size={13} fill={item.is_popular ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => toggleField(item, "is_new")} className={`p-1 rounded transition ${item.is_new ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} title={t("Toggle new", "تبديل جديد")}>
                        <Sparkles size={13} />
                      </button>
                      <button onClick={() => editItem(item)} className="p-1 rounded text-muted-foreground hover:text-foreground transition">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-1 rounded text-destructive/60 hover:text-destructive transition" data-testid={`btn-delete-item-${item.id}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
