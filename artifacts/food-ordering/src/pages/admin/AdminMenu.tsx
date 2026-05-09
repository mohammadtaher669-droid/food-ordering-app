import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, categoryStore, menuStore } from "@/lib/store";
import type { Category, MenuItem } from "@/lib/store";
import ModifierGroupsPanel from "@/components/ModifierGroupsPanel";
import { useStore } from "@/hooks/useStore";
import { useImageQueue } from "@/hooks/useImageQueue";
import { generateImageForItem } from "@/lib/aiImageUtils";
import { useTranslate } from "@/hooks/useTranslate";
import {
  Plus, Trash2, Edit2, Check, X, FolderPlus, GripVertical, Star, Sparkles, Eye, EyeOff,
  Wand2, RefreshCw, Lock, Unlock, Link, Image as ImageIcon, Loader2, Zap, StopCircle, Languages,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import ImageWithFallback from "@/components/ImageWithFallback";
import { motion, AnimatePresence } from "framer-motion";

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
  const { translate, loading: translating } = useTranslate();
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
    is_available: true, is_popular: false, is_new: false, category_id: "", image_url: undefined,
    image_locked: false, image_ai_generated: false,
  });
  const [urlError, setUrlError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formGenerating, setFormGenerating] = useState(false);

  const { statuses, isRunning, total, completed, failed, addToQueue, stop, reset } = useImageQueue();

  const categories = allCategories.filter((c) => c.restaurant_id === selectedRestaurant);
  const items = allItems.filter((m) => m.restaurant_id === selectedRestaurant);
  const restaurant = restaurants.find((r) => r.id === selectedRestaurant);

  const getCategoryName = (catId: string) => {
    const cat = allCategories.find((c) => c.id === catId);
    return cat ? t(cat.name_en, cat.name_ar) : "";
  };

  // ─── Bulk Generate All ───────────────────────────────────────────────────────
  const handleGenerateAll = () => {
    const needsImage = items.filter((m) => !m.image_url && !m.image && !m.image_locked);
    if (needsImage.length === 0) {
      toast({ title: t("All items already have images!", "جميع الأصناف لديها صور بالفعل!") });
      return;
    }
    reset();
    addToQueue(needsImage.map((item) => ({ item })));
    toast({ title: t(`Queued ${needsImage.length} items for AI generation`, `تم إضافة ${needsImage.length} صنف لقائمة الإنشاء`) });
  };

  // ─── Single Item AI ──────────────────────────────────────────────────────────
  const generateForItem = async (item: MenuItem, force = false) => {
    if (item.image_locked && !force) return;
    addToQueue([{ item, force }]);
  };

  const generateForForm = async (force = false) => {
    if (itemForm.image_locked && !force) return;
    if (!itemForm.name_en && !itemForm.name_ar) {
      toast({ title: t("Enter item name first", "أدخل اسم الصنف أولاً"), variant: "destructive" });
      return;
    }
    setFormGenerating(true);
    try {
      const tempItem: MenuItem = {
        id: editingItemId || `temp-${Date.now()}`,
        restaurant_id: selectedRestaurant,
        category_id: itemForm.category_id || categories[0]?.id || "",
        name_en: itemForm.name_en || "",
        name_ar: itemForm.name_ar || "",
        description_en: itemForm.description_en || "",
        description_ar: itemForm.description_ar || "",
        price: itemForm.price || 0,
        is_available: true,
        is_popular: false,
        is_new: false,
        image_ai_generated: false,
        image_locked: false,
      };
      const url = await generateImageForItem(tempItem, { force });
      setItemForm((f) => ({ ...f, image_url: url, image: undefined, image_ai_generated: true }));
      toast({ title: t("✓ Image generated", "✓ تم إنشاء الصورة") });
    } catch (err) {
      toast({ title: t("Generation failed", "فشل الإنشاء"), description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setFormGenerating(false);
    }
  };

  const hasImage = (item: Partial<MenuItem>) => !!(item.image || item.image_url);

  // ─── Category CRUD ────────────────────────────────────────────────────────────
  const saveCat = () => {
    if (!catForm.name_en.trim() || !catForm.name_ar.trim()) {
      toast({ title: t("Required: name in EN and AR", "مطلوب: الاسم بالعربي والإنجليزي"), variant: "destructive" }); return;
    }
    const cat: Category = {
      id: editingCatId || `cat-${Date.now()}`,
      restaurant_id: selectedRestaurant,
      name_en: catForm.name_en, name_ar: catForm.name_ar,
      sort_order: editingCatId ? (allCategories.find((c) => c.id === editingCatId)?.sort_order || 99) : allCategories.filter((c) => c.restaurant_id === selectedRestaurant).length + 1,
    };
    try {
      categoryStore.save(cat);
      toast({ title: editingCatId ? t("Category updated", "تم تحديث الفئة") : t("Category added", "تمت إضافة الفئة") });
      setShowCatForm(false); setEditingCatId(null); setCatForm({ name_en: "", name_ar: "" });
    } catch (err) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };
  const deleteCat = (id: string) => {
    if (!confirm(t("Delete category and all its items?", "حذف الفئة وجميع عناصرها؟"))) return;
    categoryStore.delete(id);
    allItems.filter((m) => m.category_id === id).forEach((m) => menuStore.delete(m.id));
  };
  const editCat = (cat: Category) => { setEditingCatId(cat.id); setCatForm({ name_en: cat.name_en, name_ar: cat.name_ar }); setShowCatForm(true); };

  // ─── Item CRUD ────────────────────────────────────────────────────────────────
  const validateUrl = (url: string): string => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol)) return t("URL must start with http:// or https://", "يجب أن يبدأ الرابط بـ http:// أو https://");
      return "";
    } catch {
      return t("Invalid URL format", "صيغة الرابط غير صحيحة");
    }
  };

  const saveItem = () => {
    if (!itemForm.name_en?.trim() || !itemForm.name_ar?.trim() || !itemForm.category_id) {
      toast({ title: t("Required: name (EN, AR) and category", "مطلوب: الاسم والفئة"), variant: "destructive" }); return;
    }
    const rawUrl = itemForm.image_url?.trim() || "";
    if (rawUrl && !rawUrl.startsWith("/api/images/")) {
      const err = validateUrl(rawUrl);
      if (err) { setUrlError(err); return; }
    }
    const newItem: MenuItem = {
      id: editingItemId || `item-${Date.now()}`,
      restaurant_id: selectedRestaurant,
      category_id: itemForm.category_id!,
      name_en: itemForm.name_en!, name_ar: itemForm.name_ar!,
      description_en: itemForm.description_en || "", description_ar: itemForm.description_ar || "",
      price: itemForm.price || 0,
      image_url: rawUrl || undefined,
      image: rawUrl ? undefined : itemForm.image,
      calories: itemForm.calories || undefined,
      is_available: itemForm.is_available ?? true,
      is_popular: itemForm.is_popular || false,
      is_new: itemForm.is_new || false,
      image_ai_generated: itemForm.image_ai_generated || false,
      image_locked: itemForm.image_locked || false,
    };
    try {
      menuStore.save(newItem);
      toast({ title: editingItemId ? t("Item updated", "تم تحديث العنصر") : t("Item added", "تمت الإضافة") });
      setShowItemForm(false); setEditingItemId(null); setUrlError(""); setShowUrlInput(false);
      setItemForm({ name_en: "", name_ar: "", price: 0, description_en: "", description_ar: "", is_available: true, is_popular: false, is_new: false, category_id: "", image_url: undefined, image_locked: false, image_ai_generated: false });
    } catch (err) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm({ ...item });
    setUrlError("");
    setShowUrlInput(!!(item.image_url && !item.image_url.startsWith("/api/images/")));
    setShowItemForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteItem = (id: string) => { menuStore.delete(id); };
  const toggleField = (item: MenuItem, field: "is_available" | "is_popular" | "is_new") => {
    menuStore.save({ ...item, [field]: !item[field] });
  };
  const toggleLock = (item: MenuItem) => {
    const updated = { ...item, image_locked: !item.image_locked };
    menuStore.save(updated);
    toast({ title: updated.image_locked ? t("Image locked 🔒", "الصورة مقفلة 🔒") : t("Image unlocked 🔓", "الصورة غير مقفلة 🔓") });
  };

  const itemsWithoutImages = items.filter((m) => !m.image_url && !m.image && !m.image_locked).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("Menu Builder", "قائمة الطعام")}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowCatForm(true); setEditingCatId(null); setCatForm({ name_en: "", name_ar: "" }); }} className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition" data-testid="btn-add-category">
            <FolderPlus size={14} /> {t("Add Category", "إضافة فئة")}
          </button>
          <button onClick={() => { setShowItemForm(true); setEditingItemId(null); setShowUrlInput(false); setItemForm({ name_en: "", name_ar: "", price: 0, description_en: "", description_ar: "", is_available: true, is_popular: false, is_new: false, category_id: categories[0]?.id || "", image_locked: false, image_ai_generated: false }); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-add-menu-item">
            <Plus size={14} /> {t("Add Item", "إضافة عنصر")}
          </button>
          {!isRunning ? (
            <button
              onClick={handleGenerateAll}
              disabled={itemsWithoutImages === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-purple-700 transition"
              data-testid="btn-generate-all"
            >
              <Zap size={14} /> {t(`Generate All (${itemsWithoutImages})`, `إنشاء الكل (${itemsWithoutImages})`)}
            </button>
          ) : (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600/80 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition"
            >
              <StopCircle size={14} /> {t("Stop", "إيقاف")}
            </button>
          )}
        </div>
      </div>

      {/* Bulk progress bar */}
      <AnimatePresence>
        {(isRunning || (total > 0 && completed < total)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 bg-purple-600/10 border border-purple-500/20 rounded-2xl px-5 py-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-purple-400 animate-pulse" />
                <span className="text-sm font-medium text-purple-300">
                  {t("AI Image Generation in Progress", "جارٍ إنشاء صور الذكاء الاصطناعي")}
                </span>
              </div>
              <span className="text-xs text-purple-400 font-mono">
                {completed}/{total} {failed > 0 && <span className="text-red-400 ml-2">({failed} {t("failed", "فشل")})</span>}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
              <span>✅ {t("Done", "منجز")}: {completed}</span>
              <span>⏳ {t("Pending", "معلق")}: {total - completed - failed}</span>
              {failed > 0 && <span>❌ {t("Failed", "فشل")}: {failed}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restaurant Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {restaurants.map((r) => (
          <button key={r.id} onClick={() => { setSelectedRestaurant(r.id); reset(); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition ${selectedRestaurant === r.id ? "text-white" : "bg-card border border-white/5 text-muted-foreground hover:text-foreground"}`}
            style={selectedRestaurant === r.id ? { background: r.color } : {}}>
            {t(r.name_en, r.name_ar)}
          </button>
        ))}
      </div>

      {/* Category Form */}
      {showCatForm && (
        <form onSubmit={(e) => { e.preventDefault(); saveCat(); }} className="bg-card border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-foreground text-sm">{editingCatId ? t("Edit Category", "تعديل الفئة") : t("New Category", "فئة جديدة")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Name (EN)", "الاسم (EN)")}</label>
                <button type="button" disabled={translating || !catForm.name_ar}
                  onClick={async () => { const r = await translate(catForm.name_ar, "ar", "en"); if (r) setCatForm(f => ({ ...f, name_en: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} AR→EN
                </button>
              </div>
              <input value={catForm.name_en} onChange={(e) => setCatForm({ ...catForm, name_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Name (AR)", "الاسم (AR)")}</label>
                <button type="button" disabled={translating || !catForm.name_en}
                  onClick={async () => { const r = await translate(catForm.name_en, "en", "ar"); if (r) setCatForm(f => ({ ...f, name_ar: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} EN→AR
                </button>
              </div>
              <input value={catForm.name_ar} onChange={(e) => setCatForm({ ...catForm, name_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" dir="rtl" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-category"><Check size={13} className="inline mr-1" /> {t("Save", "حفظ")}</button>
            <button type="button" onClick={() => { setShowCatForm(false); setEditingCatId(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" /> {t("Cancel", "إلغاء")}</button>
          </div>
        </form>
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

            {/* Name EN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Name (EN)", "الاسم (EN)")}</label>
                <button type="button" disabled={translating || !itemForm.name_ar}
                  onClick={async () => { const r = await translate(itemForm.name_ar!, "ar", "en"); if (r) setItemForm(f => ({ ...f, name_en: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} AR→EN
                </button>
              </div>
              <input value={itemForm.name_en || ""} onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" data-testid="input-item-name-en" />
            </div>

            {/* Name AR */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Name (AR)", "الاسم (AR)")}</label>
                <button type="button" disabled={translating || !itemForm.name_en}
                  onClick={async () => { const r = await translate(itemForm.name_en!, "en", "ar"); if (r) setItemForm(f => ({ ...f, name_ar: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} EN→AR
                </button>
              </div>
              <input value={itemForm.name_ar || ""} onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" dir="rtl" data-testid="input-item-name-ar" />
            </div>

            {/* Description EN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Description (EN)", "الوصف (EN)")}</label>
                <button type="button" disabled={translating || !itemForm.description_ar}
                  onClick={async () => { const r = await translate(itemForm.description_ar!, "ar", "en"); if (r) setItemForm(f => ({ ...f, description_en: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} AR→EN
                </button>
              </div>
              <input value={itemForm.description_en || ""} onChange={(e) => setItemForm({ ...itemForm, description_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>

            {/* Description AR */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">{t("Description (AR)", "الوصف (AR)")}</label>
                <button type="button" disabled={translating || !itemForm.description_en}
                  onClick={async () => { const r = await translate(itemForm.description_en!, "en", "ar"); if (r) setItemForm(f => ({ ...f, description_ar: r })); }}
                  className="flex items-center gap-1 text-[10px] text-primary hover:opacity-80 disabled:opacity-40 transition">
                  {translating ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />} EN→AR
                </button>
              </div>
              <input value={itemForm.description_ar || ""} onChange={(e) => setItemForm({ ...itemForm, description_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" dir="rtl" />
            </div>

            <F label={t("Calories (optional)", "السعرات الحرارية (اختياري)")} value={itemForm.calories || ""} onChange={(v) => setItemForm({ ...itemForm, calories: v ? Number(v) : undefined })} type="number" min="0" placeholder="e.g. 650" data-testid="input-item-calories" />
          </div>

          {/* Image Section */}
          <div className="border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("Item Image", "صورة العنصر")}</span>
              <button
                type="button"
                onClick={() => setItemForm((f) => ({ ...f, image_locked: !f.image_locked }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${itemForm.image_locked ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
              >
                {itemForm.image_locked ? <Lock size={11} /> : <Unlock size={11} />}
                {itemForm.image_locked ? t("Locked", "مقفل") : t("Lock", "قفل")}
              </button>
            </div>

            {/* Preview */}
            {hasImage(itemForm) && (
              <div className="relative">
                <img
                  src={itemForm.image_url || itemForm.image}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-xl border border-white/10"
                  onError={() => setUrlError(t("Image failed to load", "تعذّر تحميل الصورة"))}
                />
                {itemForm.image_ai_generated && (
                  <span className="absolute top-2 left-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Wand2 size={9} /> AI Generated
                  </span>
                )}
                {itemForm.image_locked && (
                  <span className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={9} /> {t("Locked", "مقفل")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setItemForm((f) => ({ ...f, image: undefined, image_url: undefined, image_ai_generated: false }))}
                  className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-lg text-white/70 hover:text-red-400 transition"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* AI Buttons */}
            <div className="flex gap-2 flex-wrap">
              {!hasImage(itemForm) ? (
                <button type="button" disabled={formGenerating || !!itemForm.image_locked} onClick={() => generateForForm(false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/90 text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-purple-600 transition" data-testid="btn-generate-image">
                  {formGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {t("Generate Image (AI)", "إنشاء صورة بالذكاء الاصطناعي")}
                </button>
              ) : (
                <button type="button" disabled={formGenerating || !!itemForm.image_locked} onClick={() => generateForForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-purple-600/30 transition" data-testid="btn-regenerate-image">
                  {formGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {t("Regenerate (AI)", "إعادة إنشاء (AI)")}
                </button>
              )}
              <button type="button" onClick={() => { setShowUrlInput((v) => !v); setUrlError(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition ${showUrlInput ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
                <Link size={11} /> {t("Image URL", "رابط الصورة")}
              </button>
            </div>
            {formGenerating && (
              <p className="text-xs text-purple-400 flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                {t("Generating professional food photo…", "جارٍ إنشاء صورة احترافية…")}
              </p>
            )}

            {/* URL Input */}
            {showUrlInput && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground block">{t("Image URL", "رابط الصورة")}</label>
                <input type="url" placeholder="https://example.com/image.webp"
                  value={itemForm.image_url?.startsWith("/api/images/") ? "" : (itemForm.image_url || "")}
                  onChange={(e) => { const val = e.target.value; setItemForm((f) => ({ ...f, image_url: val || undefined, image: val ? undefined : f.image, image_ai_generated: false })); setUrlError(""); }}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  data-testid="input-item-image-url" />
                {urlError && <p className="text-xs text-red-400">{urlError}</p>}
              </div>
            )}

            {/* File Upload */}
            {!hasImage(itemForm) && !showUrlInput && (
              <ImageUploader preset="product" label={t("Upload Image (optional)", "رفع صورة (اختياري)")}
                value={itemForm.image}
                onChange={(url) => setItemForm((f) => ({ ...f, image: url, image_ai_generated: false }))}
                onDelete={() => setItemForm((f) => ({ ...f, image: undefined }))}
                data-testid="uploader-item-image" />
            )}
          </div>

          {/* Flags */}
          <div className="flex gap-4 flex-wrap">
            {[
              { field: "is_available" as const, label_en: "Available", label_ar: "متاح" },
              { field: "is_popular" as const, label_en: "Popular", label_ar: "الأكثر طلباً" },
              { field: "is_new" as const, label_en: "New Item", label_ar: "عنصر جديد" },
            ].map(({ field, label_en, label_ar }) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!(itemForm as any)[field]} onChange={(e) => setItemForm({ ...itemForm, [field]: e.target.checked })} className="accent-primary" />
                <span className="text-muted-foreground">{t(label_en, label_ar)}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveItem} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-menu-item"><Check size={13} className="inline mr-1" />{t("Save", "حفظ")}</button>
            <button type="button" onClick={() => { setShowItemForm(false); setEditingItemId(null); setShowUrlInput(false); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" />{t("Cancel", "إلغاء")}</button>
          </div>
        </div>
      )}

      {/* Item List */}
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
                  <button onClick={() => editCat(cat)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition"><Edit2 size={13} /></button>
                  <button onClick={() => deleteCat(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition" data-testid={`btn-delete-cat-${cat.id}`}><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="space-y-2 pl-5">
                {catItems.length === 0 && <p className="text-sm text-muted-foreground">{t("No items in this category", "لا توجد عناصر في هذه الفئة")}</p>}
                {catItems.map((item) => {
                  const genStatus = statuses[item.id];
                  const isGenerating = genStatus === "generating";
                  const isQueued = genStatus === "queued";
                  const isDone = genStatus === "done";
                  const isFailed = genStatus === "failed";
                  const imgSrc = item.image_url || item.image;

                  return (
                    <div key={item.id} className={`bg-card border rounded-xl overflow-hidden transition ${isGenerating ? "border-purple-500/30 bg-purple-600/5" : isDone ? "border-green-500/20" : isFailed ? "border-red-500/20" : "border-white/5"}`} data-testid={`admin-menu-item-${item.id}`}>
                    <div className="p-3 flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-12 h-12">
                        {isGenerating ? (
                          <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                            <Loader2 size={16} className="text-purple-400 animate-spin" />
                          </div>
                        ) : isQueued ? (
                          <div className="w-12 h-12 rounded-lg bg-purple-600/10 flex items-center justify-center">
                            <Wand2 size={14} className="text-purple-400/50" />
                          </div>
                        ) : (
                          <ImageWithFallback src={imgSrc} alt={item.name_en} className="w-12 h-12 rounded-lg object-cover" preset="thumbnail" />
                        )}
                        {item.image_ai_generated && imgSrc && !isGenerating && (
                          <span className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5"><Wand2 size={8} /></span>
                        )}
                        {item.image_locked && (
                          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5"><Lock size={8} /></span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{item.name_en}</p>
                          <p className="text-xs text-muted-foreground">/ {item.name_ar}</p>
                          {item.is_new && <span className="text-[10px] bg-yellow-400/15 text-yellow-400 px-1.5 rounded-full">{t("New", "جديد")}</span>}
                          {item.is_popular && <span className="text-[10px] bg-primary/15 text-primary px-1.5 rounded-full">⭐</span>}
                          {!item.is_available && <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 rounded-full">{t("Off", "مغلق")}</span>}
                          {isGenerating && <span className="text-[10px] bg-purple-500/15 text-purple-400 px-1.5 rounded-full flex items-center gap-0.5"><Loader2 size={8} className="animate-spin" /> {t("Generating", "جارٍ الإنشاء")}</span>}
                          {isQueued && <span className="text-[10px] bg-purple-500/10 text-purple-400/70 px-1.5 rounded-full">{t("Queued", "في الانتظار")}</span>}
                          {isDone && !imgSrc && <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 rounded-full">{t("✓ Generated", "✓ تم")}</span>}
                          {isFailed && <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 rounded-full">{t("✗ Failed", "✗ فشل")}</span>}
                        </div>
                      </div>

                      <span className="font-bold text-sm flex-shrink-0" style={{ color: restaurant?.color || "#FF7A00" }}>{item.price} ﷼</span>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0 items-center">
                        {!imgSrc ? (
                          <button onClick={() => generateForItem(item)} disabled={isGenerating || isQueued}
                            className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition disabled:opacity-40"
                            title={t("Generate AI image", "إنشاء صورة بالذكاء الاصطناعي")} data-testid={`btn-generate-${item.id}`}>
                            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                          </button>
                        ) : (
                          <button onClick={() => generateForItem(item, true)} disabled={isGenerating || isQueued || item.image_locked}
                            className="p-1.5 rounded-lg bg-purple-600/10 text-purple-400/70 hover:bg-purple-600/20 transition disabled:opacity-30"
                            title={item.image_locked ? t("Locked", "مقفل") : t("Regenerate", "إعادة إنشاء")} data-testid={`btn-regen-${item.id}`}>
                            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          </button>
                        )}
                        <button onClick={() => toggleLock(item)}
                          className={`p-1.5 rounded-lg transition ${item.image_locked ? "text-yellow-400 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-400"}`}
                          title={item.image_locked ? t("Unlock", "إلغاء القفل") : t("Lock", "قفل")}>
                          {item.image_locked ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>
                        <button onClick={() => toggleField(item, "is_available")} className={`p-1 rounded transition ${item.is_available ? "text-green-400 hover:text-red-400" : "text-red-400 hover:text-green-400"}`}>
                          {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button onClick={() => toggleField(item, "is_popular")} className={`p-1 rounded transition ${item.is_popular ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                          <Star size={13} fill={item.is_popular ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => toggleField(item, "is_new")} className={`p-1 rounded transition ${item.is_new ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}>
                          <Sparkles size={13} />
                        </button>
                        <button onClick={() => editItem(item)} className="p-1 rounded text-muted-foreground hover:text-foreground transition"><Edit2 size={13} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 rounded text-destructive/60 hover:text-destructive transition" data-testid={`btn-delete-item-${item.id}`}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <ModifierGroupsPanel
                      menuItem={item}
                      restaurantId={selectedRestaurant}
                      color={restaurant?.color || "#FF7A00"}
                    />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
