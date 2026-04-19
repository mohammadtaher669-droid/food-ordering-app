import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { restaurantStore } from "@/lib/store";
import type { Restaurant } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { Plus, Trash2, Edit2, Check, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" {...props} />
    </div>
  );
}

const COLOR_PRESETS = ["#6A9B3B", "#C1121F", "#FF5722", "#FF7A00", "#6A0DAD", "#0EA5E9", "#10B981", "#F59E0B"];

const emptyForm: Partial<Restaurant> = {
  name_en: "", name_ar: "", logo: "", logoType: "emoji", color: "#FF7A00",
  description_en: "", description_ar: "", tagline_en: "", tagline_ar: "", cover_image: undefined,
};

function LogoDisplay({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.logoType === "image" && restaurant.logo) {
    return <img src={restaurant.logo} alt={restaurant.name_en} className="w-full h-full object-cover rounded-xl" />;
  }
  return <span className="text-2xl">{restaurant.logo || "🍽️"}</span>;
}

export default function AdminRestaurants() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const restaurants = useStore(useCallback(() => restaurantStore.getAll(), []));
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Restaurant>>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast({ title: t("File too large", "الملف كبير جداً"), description: t("Max 3MB", "الحد الأقصى 3MB"), variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, cover_image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: t("File too large", "الملف كبير جداً"), description: t("Max 2MB", "الحد الأقصى 2MB"), variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, logo: ev.target?.result as string, logoType: "image" }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name_en?.trim() || !form.name_ar?.trim()) {
      toast({ title: t("Required fields missing", "حقول مطلوبة مفقودة"), variant: "destructive" }); return;
    }
    const restaurant: Restaurant = {
      id: editingId || `rest-${Date.now()}`,
      name_en: form.name_en!,
      name_ar: form.name_ar!,
      logo: form.logo || "",
      logoType: form.logoType || "emoji",
      color: form.color || "#FF7A00",
      description_en: form.description_en || "",
      description_ar: form.description_ar || "",
      cover_image: form.cover_image,
      tagline_en: form.tagline_en || "",
      tagline_ar: form.tagline_ar || "",
    };
    restaurantStore.save(restaurant);
    toast({ title: editingId ? t("Updated!", "تم التحديث!") : t("Added!", "تمت الإضافة!") });
    setShowAdd(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (r: Restaurant) => {
    setEditingId(r.id);
    setForm({ ...r });
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("Delete this restaurant?", "حذف هذا المطعم؟"))) return;
    restaurantStore.delete(id);
    toast({ title: t("Deleted", "تم الحذف") });
  };

  const handleCancel = () => { setShowAdd(false); setEditingId(null); setForm(emptyForm); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("Restaurants", "المطاعم")}</h1>
        <button onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition" data-testid="btn-add-restaurant">
          <Plus size={14} /> {t("Add Restaurant", "إضافة مطعم")}
        </button>
      </div>

      {/* Form */}
      {showAdd && (
        <div className="bg-card border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">{editingId ? t("Edit Restaurant", "تعديل المطعم") : t("New Restaurant", "مطعم جديد")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Name (EN)", "الاسم (EN)")} value={form.name_en || ""} onChange={(v) => setForm({ ...form, name_en: v })} data-testid="input-rest-name-en" />
            <Field label={t("Name (AR)", "الاسم (AR)")} value={form.name_ar || ""} onChange={(v) => setForm({ ...form, name_ar: v })} />
            <div className="col-span-2">
              <Field label={t("Description (EN)", "الوصف (EN)")} value={form.description_en || ""} onChange={(v) => setForm({ ...form, description_en: v })} />
            </div>
            <div className="col-span-2">
              <Field label={t("Description (AR)", "الوصف (AR)")} value={form.description_ar || ""} onChange={(v) => setForm({ ...form, description_ar: v })} />
            </div>
            <Field label={t("Tagline (EN) — shown on card", "الشعار القصير (EN)")} value={form.tagline_en || ""} onChange={(v) => setForm({ ...form, tagline_en: v })} placeholder={t("e.g. Fresh & crispy everyday", "مثال: الأفضل دائماً")} />
            <Field label={t("Tagline (AR) — shown on card", "الشعار القصير (AR)")} value={form.tagline_ar || ""} onChange={(v) => setForm({ ...form, tagline_ar: v })} placeholder="مثال: الأفضل دائماً" />
          </div>

          {/* Cover Image */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("Cover Image (shown on restaurant card & page)", "صورة الغلاف (تظهر على بطاقة المطعم والصفحة)")}</label>
            <div className="flex items-center gap-3">
              {form.cover_image && (
                <img src={form.cover_image} alt="cover" className="h-20 w-36 rounded-xl object-cover flex-shrink-0 border border-white/10" />
              )}
              <div className="space-y-2">
                <button
                  onClick={() => coverRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <Upload size={13} /> {t("Upload Cover Image", "رفع صورة الغلاف")}
                </button>
                {form.cover_image && (
                  <button onClick={() => setForm({ ...form, cover_image: undefined })} className="text-xs text-destructive/70 hover:text-destructive block">
                    {t("Remove cover", "إزالة الغلاف")}
                  </button>
                )}
                <p className="text-xs text-muted-foreground/60">{t("Max 3MB. Will display as a banner.", "الحد الأقصى 3MB.")}</p>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
          </div>

          {/* Logo Section */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("Logo", "الشعار")}</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden" style={{ background: `${form.color}20` }}>
                {form.logoType === "image" && form.logo ? (
                  <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{form.logo || "🍽️"}</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    placeholder={t("Emoji (e.g. 🍗)", "إيموجي (مثل 🍗)")}
                    value={form.logoType === "emoji" ? form.logo || "" : ""}
                    onChange={(e) => setForm({ ...form, logo: e.target.value, logoType: "emoji" })}
                    className="bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none w-36"
                  />
                  <span className="text-muted-foreground text-sm self-center">{t("or", "أو")}</span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    <Upload size={13} /> {t("Upload Image", "رفع صورة")}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                {form.logoType === "image" && form.logo && (
                  <button onClick={() => setForm({ ...form, logo: "", logoType: "emoji" })} className="text-xs text-destructive/70 hover:text-destructive">
                    {t("Remove image", "إزالة الصورة")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("Theme Color", "لون القالب")}</label>
            <div className="flex items-center gap-3 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.color || "#FF7A00"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-8 h-8 rounded-full border border-white/10 cursor-pointer"
                title={t("Custom color", "لون مخصص")}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium" data-testid="btn-save-restaurant">
              <Check size={14} className="inline mr-1" />{t("Save", "حفظ")}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-muted-foreground">
              <X size={14} className="inline mr-1" />{t("Cancel", "إلغاء")}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-card border border-white/5 rounded-2xl overflow-hidden" data-testid={`admin-restaurant-${restaurant.id}`}>
            {/* Cover image strip */}
            <div className="relative h-20 overflow-hidden">
              {restaurant.cover_image ? (
                <img src={restaurant.cover_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${restaurant.color}25, ${restaurant.color}08)` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 to-transparent" />
              <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: restaurant.color }} />
                <span className="text-xs text-white/60">{restaurant.color}</span>
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="-mt-8 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-[#1A1A1A] relative z-10" style={{ background: `${restaurant.color}20` }}>
                <LogoDisplay restaurant={restaurant} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground">{t(restaurant.name_en, restaurant.name_ar)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t(restaurant.tagline_en || restaurant.description_en, restaurant.tagline_ar || restaurant.description_ar)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(restaurant)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition" data-testid={`btn-edit-restaurant-${restaurant.id}`}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(restaurant.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition" data-testid={`btn-delete-restaurant-${restaurant.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
