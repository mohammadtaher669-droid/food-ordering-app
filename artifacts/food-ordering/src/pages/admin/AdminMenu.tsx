import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore, categoryStore, menuStore } from "@/lib/store";
import type { Category, MenuItem } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { Plus, Trash2, Edit2, Check, X, FolderPlus, GripVertical, Star, Sparkles, Eye, EyeOff, Wand2, RefreshCw, Lock, Unlock, Link, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import ImageWithFallback from "@/components/ImageWithFallback";

// ─── helpers ──────────────────────────────────────────────────────────────────

function F({ label, value, onChange, ...p }: { label: string; value: string | number; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" {...p} />
    </div>
  );
}

function buildPrompt(item: Partial<MenuItem>, categoryName: string, restaurantName: string): string {
  const name = item.name_en || item.name_ar || "food dish";
  const desc = item.description_en || item.description_ar || "";
  const parts = [`Professional food photography of ${name}`];
  if (desc) parts.push(desc.slice(0, 80));
  if (categoryName) parts.push(`${categoryName} dish`);
  if (restaurantName) parts.push(`served at ${restaurantName}`);
  parts.push("cinematic lighting, 45-degree angle, realistic, ultra high quality, restaurant menu style, clean minimal background, vibrant appetizing colors, shallow depth of field");
  return parts.join(", ");
}

async function compressB64ToDataUrl(b64: string, w = 500, h = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      const url = canvas.toDataURL("image/webp", 0.82);
      resolve(url);
    };
    img.onerror = reject;
    img.src = `data:image/png;base64,${b64}`;
  });
}

async function generateAndCompress(prompt: string, cacheKey: string, size: "1024x1024" | "1024x1536" = "1024x1024"): Promise<string> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, cacheKey, size }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const { b64_json } = await res.json() as { b64_json: string };
  const [tw, th] = size === "1024x1536" ? [400, 500] : [500, 500];
  return compressB64ToDataUrl(b64_json, tw, th);
}

// ─── main component ────────────────────────────────────────────────────────────

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
    is_available: true, is_popular: false, is_new: false, category_id: "", image_url: undefined,
    image_locked: false, image_ai_generated: false,
  });
  const [urlError, setUrlError] = useState("");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [formGenerating, setFormGenerating] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const categories = allCategories.filter((c) => c.restaurant_id === selectedRestaurant);
  const items = allItems.filter((m) => m.restaurant_id === selectedRestaurant);
  const restaurant = restaurants.find((r) => r.id === selectedRestaurant);

  const getCategoryName = (catId: string) => {
    const cat = allCategories.find((c) => c.id === catId);
    return cat ? t(cat.name_en, cat.name_ar) : "";
  };

  // ─────────────────── AI IMAGE ───────────────────
  const generateForItem = async (item: MenuItem, force = false) => {
    if (item.image_locked && !force) return;
    if (generatingIds.has(item.id)) return;

    setGeneratingIds((prev) => new Set(prev).add(item.id));
    try {
      const catName = getCategoryName(item.category_id);
      const restName = t(restaurant?.name_en || "", restaurant?.name_ar || "");
      const prompt = buildPrompt(item, catName, restName);
      const cacheKey = force ? `regen_${item.id}_${Date.now()}` : item.id;
      const dataUrl = await generateAndCompress(prompt, cacheKey);
      const updated: MenuItem = {
        ...item,
        image: dataUrl,
        image_url: undefined,
        image_ai_generated: true,
      };
      menuStore.save(updated);
      toast({ title: t("✓ Image generated", "✓ تم إنشاء الصورة") });
    } catch (err) {
      toast({
        title: t("Image generation failed", "فشل إنشاء الصورة"),
        description: err instanceof Error ? err.message : t("Unknown error", "خطأ"),
        variant: "destructive",
      });
    } finally {
      setGeneratingIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  };

  const generateForForm = async (force = false) => {
    if (itemForm.image_locked && !force) return;
    setFormGenerating(true);
    try {
      const catName = getCategoryName(itemForm.category_id || "");
      const restName = t(restaurant?.name_en || "", restaurant?.name_ar || "");
      const prompt = buildPrompt(itemForm, catName, restName);
      const cacheKey = force ? `regen_form_${Date.now()}` : `form_${itemForm.name_en || "item"}`;
      const dataUrl = await generateAndCompress(prompt, cacheKey);
      setItemForm((f) => ({ ...f, image: dataUrl, image_url: undefined, image_ai_generated: true }));
      toast({ title: t("✓ Image generated", "✓ تم إنشاء الصورة") });
    } catch (err) {
      toast({
        title: t("Image generation failed", "فشل إنشاء الصورة"),
        description: err instanceof Error ? err.message : t("Unknown error", "خطأ"),
        variant: "destructive",
      });
    } finally {
      setFormGenerating(false);
    }
  };

  const hasImage = (item: Partial<MenuItem>) => !!(item.image || item.image_url);

  // ─────────────────── CATEGORY CRUD ───────────────────
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
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : t("Unknown error", "خطأ غير معروف"), variant: "destructive" });
    }
  };
  const deleteCat = (id: string) => {
    if (!confirm(t("Delete category and all its items?", "حذف الفئة وجميع عناصرها؟"))) return;
    categoryStore.delete(id);
    allItems.filter((m) => m.category_id === id).forEach((m) => menuStore.delete(m.id));
  };
  const editCat = (cat: Category) => { setEditingCatId(cat.id); setCatForm({ name_en: cat.name_en, name_ar: cat.name_ar }); setShowCatForm(true); };

  // ─────────────────── ITEM CRUD ───────────────────
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
    if (rawUrl) {
      const err = validateUrl(rawUrl);
      if (err) { setUrlError(err); return; }
    }
    const usingUrl = !!rawUrl;
    const newItem: MenuItem = {
      id: editingItemId || `item-${Date.now()}`,
      restaurant_id: selectedRestaurant,
      category_id: itemForm.category_id!,
      name_en: itemForm.name_en!, name_ar: itemForm.name_ar!,
      description_en: itemForm.description_en || "", description_ar: itemForm.description_ar || "",
      price: itemForm.price || 0,
      image_url: usingUrl ? rawUrl : undefined,
      image: usingUrl ? undefined : itemForm.image,
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
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : t("Unknown error", "خطأ غير معروف"), variant: "destructive" });
    }
  };

  const editItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm({ ...item });
    setUrlError("");
    setShowUrlInput(!!item.image_url);
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
        <form onSubmit={(e) => { e.preventDefault(); saveCat(); }} className="bg-card border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-foreground text-sm">{editingCatId ? t("Edit Category", "تعديل الفئة") : t("New Category", "فئة جديدة")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <F label={t("Name (EN)", "الاسم (EN)")} value={catForm.name_en} onChange={(v) => setCatForm({ ...catForm, name_en: v })} />
            <F label={t("Name (AR)", "الاسم (AR)")} value={catForm.name_ar} onChange={(v) => setCatForm({ ...catForm, name_ar: v })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-category"><Check size={13} className="inline mr-1" /> {t("Save", "حفظ")}</button>
            <button type="button" onClick={() => { setShowCatForm(false); setEditingCatId(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" /> {t("Cancel", "إلغاء")}</button>
          </div>
        </form>
      )}

      {/* Item Form */}
      {showItemForm && (
        <div ref={formRef} className="bg-card border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
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

          {/* ─── Image Section ─── */}
          <div className="border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("Item Image", "صورة العنصر")}</span>
              {/* Lock toggle */}
              <button
                type="button"
                onClick={() => setItemForm((f) => ({ ...f, image_locked: !f.image_locked }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition border ${itemForm.image_locked ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
                title={t("Lock image to prevent auto-regeneration", "قفل الصورة لمنع إعادة التوليد")}
              >
                {itemForm.image_locked ? <Lock size={11} /> : <Unlock size={11} />}
                {itemForm.image_locked ? t("Locked", "مقفل") : t("Lock", "قفل")}
              </button>
            </div>

            {/* Image preview */}
            {hasImage(itemForm) && (
              <div className="relative">
                <img
                  src={itemForm.image_url || itemForm.image}
                  alt="preview"
                  className="w-full h-44 object-cover rounded-xl border border-white/10"
                  onError={() => setUrlError(t("Image failed to load", "تعذّر تحميل الصورة"))}
                />
                {itemForm.image_ai_generated && (
                  <span className="absolute top-2 left-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Wand2 size={9} /> AI
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
                  title={t("Remove image", "حذف الصورة")}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* AI Generate buttons */}
            <div className="flex gap-2 flex-wrap">
              {!hasImage(itemForm) ? (
                <button
                  type="button"
                  disabled={formGenerating || itemForm.image_locked}
                  onClick={() => generateForForm(false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/90 text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-purple-600 transition"
                  data-testid="btn-generate-image"
                >
                  {formGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {t("Generate Image (AI)", "إنشاء صورة بالذكاء الاصطناعي")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={formGenerating || itemForm.image_locked}
                  onClick={() => generateForForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-medium disabled:opacity-50 hover:bg-purple-600/30 transition"
                  data-testid="btn-regenerate-image"
                >
                  {formGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {t("Regenerate (AI)", "إعادة إنشاء (AI)")}
                </button>
              )}

              {/* Toggle URL input */}
              <button
                type="button"
                onClick={() => { setShowUrlInput((v) => !v); setUrlError(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition ${showUrlInput ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"}`}
              >
                <Link size={11} /> {t("Image URL", "رابط الصورة")}
              </button>

              {/* Upload */}
              {!itemForm.image_url && !showUrlInput && (
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 text-muted-foreground">
                  <ImageIcon size={11} /> {t("or upload below", "أو ارفع أدناه")}
                </span>
              )}
            </div>

            {formGenerating && (
              <div className="flex items-center gap-2 text-xs text-purple-400">
                <Loader2 size={12} className="animate-spin" />
                {t("Generating professional food photo…", "جارٍ إنشاء صورة احترافية…")}
              </div>
            )}

            {/* URL input */}
            {showUrlInput && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground block">{t("Image URL", "رابط الصورة")}</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.webp"
                  value={itemForm.image_url || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemForm((f) => ({ ...f, image_url: val || undefined, image: val ? undefined : f.image, image_ai_generated: false }));
                    setUrlError("");
                  }}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  data-testid="input-item-image-url"
                />
                {urlError && <p className="text-xs text-red-400">{urlError}</p>}
              </div>
            )}

            {/* File Upload — only when no image and no URL mode */}
            {!hasImage(itemForm) && !showUrlInput && (
              <ImageUploader
                preset="product"
                label={t("Upload Image (optional)", "رفع صورة (اختياري)")}
                value={itemForm.image}
                onChange={(url) => setItemForm((f) => ({ ...f, image: url, image_ai_generated: false }))}
                onDelete={() => setItemForm((f) => ({ ...f, image: undefined }))}
                data-testid="uploader-item-image"
              />
            )}
          </div>

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
            <button type="button" onClick={saveItem} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-menu-item"><Check size={13} className="inline mr-1" />{t("Save", "حفظ")}</button>
            <button type="button" onClick={() => { setShowItemForm(false); setEditingItemId(null); setShowUrlInput(false); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground"><X size={13} className="inline mr-1" />{t("Cancel", "إلغاء")}</button>
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
                {catItems.map((item) => {
                  const isGenerating = generatingIds.has(item.id);
                  const itemHasImage = !!(item.image || item.image_url);
                  return (
                    <div key={item.id} className="bg-card border border-white/5 rounded-xl p-3 flex items-center gap-3" data-testid={`admin-menu-item-${item.id}`}>
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <ImageWithFallback src={item.image_url || item.image} alt={item.name_en} className="w-12 h-12 rounded-lg object-cover" preset="thumbnail" />
                        {item.image_ai_generated && (
                          <span className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5">
                            <Wand2 size={8} />
                          </span>
                        )}
                        {item.image_locked && (
                          <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5">
                            <Lock size={8} />
                          </span>
                        )}
                      </div>

                      {/* Info */}
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

                      {/* Action buttons */}
                      <div className="flex gap-1 flex-shrink-0 items-center">
                        {/* AI generate / regenerate */}
                        {!itemHasImage ? (
                          <button
                            onClick={() => generateForItem(item, false)}
                            disabled={isGenerating}
                            className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition disabled:opacity-50"
                            title={t("Generate AI image", "إنشاء صورة بالذكاء الاصطناعي")}
                            data-testid={`btn-generate-${item.id}`}
                          >
                            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                          </button>
                        ) : (
                          <button
                            onClick={() => generateForItem(item, true)}
                            disabled={isGenerating || item.image_locked}
                            className="p-1.5 rounded-lg bg-purple-600/10 text-purple-400/70 hover:bg-purple-600/20 transition disabled:opacity-30"
                            title={item.image_locked ? t("Image locked", "الصورة مقفلة") : t("Regenerate AI image", "إعادة إنشاء الصورة")}
                            data-testid={`btn-regen-${item.id}`}
                          >
                            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          </button>
                        )}

                        {/* Lock */}
                        <button
                          onClick={() => toggleLock(item)}
                          className={`p-1.5 rounded-lg transition ${item.image_locked ? "text-yellow-400 hover:text-yellow-300 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-400"}`}
                          title={item.image_locked ? t("Unlock image", "إلغاء قفل الصورة") : t("Lock image", "قفل الصورة")}
                        >
                          {item.image_locked ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>

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
