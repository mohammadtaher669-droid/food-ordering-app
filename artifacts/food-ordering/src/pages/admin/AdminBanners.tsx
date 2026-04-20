import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, GripVertical, Check, X, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { bannerStore, restaurantStore } from "@/lib/store";
import type { Banner } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import ImageWithFallback from "@/components/ImageWithFallback";

const EMPTY: Omit<Banner, "id"> = {
  title_en: "",
  title_ar: "",
  subtitle_en: "",
  subtitle_ar: "",
  button_text_en: "",
  button_text_ar: "",
  link: "",
  active: true,
  type: "homepage",
  sort_order: 0,
};

export default function AdminBanners() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const banners = useStore(useCallback(() => bannerStore.getAll(), []));
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Banner, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleEdit = (banner: Banner) => {
    const { id, ...rest } = banner;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title_en.trim() && !form.title_ar.trim()) {
      toast({ title: t("Title is required", "العنوان مطلوب"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const id = editingId || ("b_" + Date.now());
    bannerStore.save({ id, ...form, sort_order: form.sort_order || banners.length });
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    toast({ title: t("Banner saved!", "تم حفظ البانر!") });
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    bannerStore.delete(id);
    toast({ title: t("Deleted", "تم الحذف") });
  };

  const toggleActive = (banner: Banner) => {
    bannerStore.save({ ...banner, active: !banner.active });
  };

  const typeColors: Record<Banner["type"], string> = {
    homepage: "#6366f1",
    restaurant: "#10b981",
    offer: "#f59e0b",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("📢 Banners & Marketing", "📢 البانرات والتسويق")}</h1>
            <p className="text-sm text-muted-foreground">{t("Manage homepage, restaurant, and offer banners.", "إدارة بانرات الصفحة الرئيسية والمطاعم والعروض.")}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setForm({ ...EMPTY, sort_order: banners.length }); setEditingId(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
              data-testid="btn-add-banner"
            >
              <Plus size={14} /> {t("Add Banner", "إضافة بانر")}
            </button>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-primary/20 rounded-2xl p-5 space-y-3"
          >
            <h2 className="text-sm font-bold text-foreground">{editingId ? t("Edit Banner", "تعديل البانر") : t("New Banner", "بانر جديد")}</h2>

            {/* Image */}
            <ImageUploader
              preset="hero_banner"
              label={t("Banner Image", "صورة البانر")}
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
              onDelete={() => setForm((f) => ({ ...f, image: undefined }))}
              data-testid="uploader-banner-image"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Title (EN)", "العنوان (EN)")}</label>
                <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="Summer Sale" data-testid="input-banner-title-en" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Title (AR)", "العنوان (AR)")}</label>
                <input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="تخفيضات الصيف" dir="rtl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Subtitle (EN)", "العنوان الفرعي (EN)")}</label>
                <input value={form.subtitle_en || ""} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="Limited offers" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Subtitle (AR)", "العنوان الفرعي (AR)")}</label>
                <input value={form.subtitle_ar || ""} onChange={(e) => setForm({ ...form, subtitle_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="عروض محدودة" dir="rtl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Button (EN)", "زر (EN)")}</label>
                <input value={form.button_text_en || ""} onChange={(e) => setForm({ ...form, button_text_en: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="Order Now" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("Button (AR)", "زر (AR)")}</label>
                <input value={form.button_text_ar || ""} onChange={(e) => setForm({ ...form, button_text_ar: e.target.value })} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" placeholder="اطلب الآن" dir="rtl" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("Link URL (optional)", "رابط (اختياري)")}</label>
              <div className="flex items-center gap-2 bg-background border border-white/10 rounded-xl px-3 py-2">
                <LinkIcon size={13} className="text-muted-foreground" />
                <input value={form.link || ""} onChange={(e) => setForm({ ...form, link: e.target.value })} className="flex-1 bg-transparent text-sm text-foreground focus:outline-none" placeholder="/restaurant/..." />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-32">
                <label className="text-xs text-muted-foreground mb-1 block">{t("Banner type", "نوع البانر")}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as Banner["type"] })}
                  className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="homepage">{t("Homepage", "الصفحة الرئيسية")}</option>
                  <option value="restaurant">{t("Restaurant", "مطعم")}</option>
                  <option value="offer">{t("Offer page", "صفحة العروض")}</option>
                </select>
              </div>
              {form.type === "restaurant" && (
                <div className="flex-1 min-w-32">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("Restaurant", "المطعم")}</label>
                  <select
                    value={form.restaurant_id || ""}
                    onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
                  >
                    <option value="">{t("All restaurants", "جميع المطاعم")}</option>
                    {restaurants.map((r) => <option key={r.id} value={r.id}>{t(r.name_en, r.name_ar)}</option>)}
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-primary" />
              <span className="text-muted-foreground">{t("Active", "نشط")}</span>
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium flex items-center gap-1 disabled:opacity-60" data-testid="btn-save-banner">
                <Check size={13} /> {saving ? t("Saving…", "جارٍ الحفظ…") : t("Save", "حفظ")}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground flex items-center gap-1">
                <X size={13} /> {t("Cancel", "إلغاء")}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Banner list */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-4xl opacity-30 block mb-3">📢</span>
            <p className="text-sm">{t("No banners yet. Add one to get started.", "لا توجد بانرات. أضف واحداً للبدء.")}</p>
          </div>
        ) : (
          banners.map((banner) => (
            <motion.div
              key={banner.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-white/5 rounded-2xl overflow-hidden"
              data-testid={`banner-row-${banner.id}`}
            >
              <div className="flex items-center gap-3 p-3">
                <GripVertical size={14} className="text-muted-foreground/40 flex-shrink-0" />
                {banner.image ? (
                  <ImageWithFallback src={banner.image} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" preset="hero_banner" />
                ) : (
                  <div className="w-16 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📢</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{banner.title_en || banner.title_ar}</p>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: typeColors[banner.type] }}
                    >
                      {banner.type}
                    </span>
                    {!banner.active && (
                      <span className="text-[10px] text-muted-foreground border border-white/10 px-1.5 py-0.5 rounded-full">{t("Inactive", "غير نشط")}</span>
                    )}
                  </div>
                  {(banner.subtitle_en || banner.subtitle_ar) && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle_en}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${banner.active ? "text-green-400 hover:bg-green-400/10" : "text-muted-foreground hover:bg-white/5"}`}
                  >
                    <Check size={14} />
                  </button>
                  <button onClick={() => handleEdit(banner)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
