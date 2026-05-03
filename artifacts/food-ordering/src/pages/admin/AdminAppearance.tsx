import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Type, ImageIcon, RotateCcw, Check, Monitor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { settingsStore } from "@/lib/store";
import type { AppSettings } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import { FONT_OPTIONS, applyTheme, hexToHsl, hslToHex } from "@/lib/themeUtils";
import matAmiLogo from "@assets/لوجو_الموقع_مطعمي_1776635393637.png";

const PRIMARY_PRESETS = [
  "#FF7A00", "#FF5500", "#FF3B30", "#FF6B35",
  "#E53935", "#D81B60", "#8E24AA", "#3949AB",
  "#0097A7", "#00897B", "#43A047", "#F9A825",
  "#FF9800", "#FF6D00", "#FFFFFF", "#000000",
];

const BG_PRESETS = [
  "#0F0F0F", "#111111", "#0A0A0A", "#181818",
  "#1A1A2E", "#0D1B2A", "#1B1B2F", "#0F1923",
  "#2D1B69", "#192734", "#1A0A00", "#0A1A0A",
  "#FFFFFF", "#F8F8F8", "#F5F5F5", "#FFFDF7",
];

const TEXT_PRESETS = [
  "#FAFAFA", "#F0F0F0", "#E0E0E0", "#CCCCCC",
  "#AAAAAA", "#888888", "#555555", "#333333",
  "#111111", "#000000", "#FFFFFF", "#FFE4C4",
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
            }}
            className="w-24 bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:border-primary/50"
          />
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer">
            <input
              type="color"
              value={value.length === 7 ? value : "#FF7A00"}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ background: value }} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
            style={{
              background: p,
              borderColor: value.toLowerCase() === p.toLowerCase() ? "hsl(var(--primary))" : "transparent",
              boxShadow: value.toLowerCase() === p.toLowerCase() ? "0 0 0 1px rgba(255,255,255,0.2)" : "none",
            }}
            title={p}
          />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_APPEARANCE: Pick<AppSettings, "primary_color" | "bg_color" | "text_color" | "font_family" | "font_size_scale" | "logo_size"> = {
  primary_color: "#FF7A00",
  bg_color: "#0F0F0F",
  text_color: "#FAFAFA",
  font_family: "Plus Jakarta Sans",
  font_size_scale: 1,
  logo_size: "md",
};

export default function AdminAppearance() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const saved = useStore(useCallback(() => settingsStore.get(), []));

  const currentBgHex = saved.bg_color || "#0F0F0F";
  const currentTextHex = saved.text_color || "#FAFAFA";
  const currentPrimaryHex = saved.primary_color || "#FF7A00";

  const [primary, setPrimary] = useState(currentPrimaryHex);
  const [bg, setBg] = useState(currentBgHex);
  const [text, setText] = useState(currentTextHex);
  const [fontFamily, setFontFamily] = useState(saved.font_family || "Plus Jakarta Sans");
  const [fontScale, setFontScale] = useState(saved.font_size_scale ?? 1);
  const [logoSize, setLogoSize] = useState<"sm" | "md" | "lg">(saved.logo_size || "md");

  const saveAll = () => {
    const updated: AppSettings = {
      ...saved,
      primary_color: primary,
      bg_color: bg,
      text_color: text,
      font_family: fontFamily,
      font_size_scale: fontScale,
      logo_size: logoSize,
    };
    try {
      settingsStore.save(updated);
      applyTheme(updated);
      toast({ title: t("Appearance saved!", "تم حفظ المظهر!") });
    } catch (err) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const resetAll = () => {
    setPrimary(DEFAULT_APPEARANCE.primary_color!);
    setBg(DEFAULT_APPEARANCE.bg_color!);
    setText(DEFAULT_APPEARANCE.text_color!);
    setFontFamily(DEFAULT_APPEARANCE.font_family!);
    setFontScale(DEFAULT_APPEARANCE.font_size_scale!);
    setLogoSize(DEFAULT_APPEARANCE.logo_size!);
    const reset: AppSettings = { ...saved, ...DEFAULT_APPEARANCE };
    settingsStore.save(reset);
    applyTheme(reset);
    toast({ title: t("Reset to defaults", "تمت إعادة الضبط") });
  };

  const livePreview = (updates: Partial<AppSettings>) => {
    applyTheme({ ...saved, primary_color: primary, bg_color: bg, text_color: text, font_family: fontFamily, font_size_scale: fontScale, logo_size: logoSize, ...updates });
  };

  const logoClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("🎨 Appearance", "🎨 المظهر")}</h1>
            <p className="text-sm text-muted-foreground">{t("Customize colors, fonts, and layout of the app.", "تخصيص ألوان وخطوط ومظهر التطبيق.")}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-muted-foreground hover:text-foreground transition"
            >
              <RotateCcw size={12} /> {t("Reset", "إعادة ضبط")}
            </button>
            <button
              type="button"
              onClick={saveAll}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm bg-primary text-white font-medium"
              data-testid="btn-save-appearance"
            >
              <Check size={13} /> {t("Save", "حفظ")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live mini-preview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
            <Monitor size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("Live preview", "معاينة مباشرة")}</span>
          </div>
          <div className="p-5 flex items-center gap-4" style={{ background: bg, fontFamily: `'${fontFamily}', sans-serif`, fontSize: `${fontScale * 14}px` }}>
            <img src={matAmiLogo} alt="" className={`${logoClasses[logoSize]} object-contain rounded-full flex-shrink-0`} />
            <div className="flex-1">
              <p style={{ color: text, fontWeight: 700, fontSize: `${fontScale * 16}px` }}>Mat'ami</p>
              <p style={{ color: `${text}99`, fontSize: `${fontScale * 12}px` }}>{t("Order food from the best restaurants", "اطلب الطعام من أفضل المطاعم")}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: primary, fontSize: `${fontScale * 11}px` }}>
              {t("Order Now", "اطلب الآن")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Colors */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionCard title={t("🎨 Colors", "🎨 الألوان")} icon={<Palette size={16} />}>
          <div className="space-y-5">
            <ColorRow
              label={t("Accent / Brand color", "لون العلامة التجارية")}
              value={primary}
              presets={PRIMARY_PRESETS}
              onChange={(v) => { setPrimary(v); livePreview({ primary_color: v }); }}
            />
            <div className="border-t border-white/5" />
            <ColorRow
              label={t("Background color", "لون الخلفية")}
              value={bg}
              presets={BG_PRESETS}
              onChange={(v) => { setBg(v); livePreview({ bg_color: v }); }}
            />
            <div className="border-t border-white/5" />
            <ColorRow
              label={t("Text color", "لون النص")}
              value={text}
              presets={TEXT_PRESETS}
              onChange={(v) => { setText(v); livePreview({ text_color: v }); }}
            />
          </div>
        </SectionCard>
      </motion.div>

      {/* Typography */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionCard title={t("🔤 Typography", "🔤 الخطوط")} icon={<Type size={16} />}>
          <div className="space-y-5">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">{t("Font family", "نوع الخط")}</label>
              <div className="grid grid-cols-1 gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => { setFontFamily(f.value); livePreview({ font_family: f.value }); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition ${fontFamily === f.value ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                  >
                    <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                    <span className="text-xs opacity-60" style={{ fontFamily: `'${f.value}', sans-serif` }}>
                      Aa Bb — أب ت
                    </span>
                    {fontFamily === f.value && <Check size={13} className="text-primary ml-2 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">{t("Font size", "حجم الخط")}</label>
                <span className="text-xs font-mono text-primary">{Math.round(fontScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={130}
                step={5}
                value={Math.round(fontScale * 100)}
                onChange={(e) => {
                  const scale = parseInt(e.target.value) / 100;
                  setFontScale(scale);
                  livePreview({ font_size_scale: scale });
                }}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{t("Small", "صغير")} 80%</span>
                <span>{t("Default", "افتراضي")} 100%</span>
                <span>{t("Large", "كبير")} 130%</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Logo Size */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionCard title={t("🖼 Logo Size", "🖼 حجم الشعار")} icon={<ImageIcon size={16} />}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("Controls the logo size in the navigation bar.", "يتحكم في حجم الشعار في شريط التنقل.")}</p>
            <div className="grid grid-cols-3 gap-3">
              {(["sm", "md", "lg"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setLogoSize(size); livePreview({ logo_size: size }); }}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition ${logoSize === size ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/20"}`}
                >
                  <img src={matAmiLogo} alt="" className={`${logoClasses[size]} object-contain rounded-full`} />
                  <span className={`text-xs font-medium ${logoSize === size ? "text-primary" : "text-muted-foreground"}`}>
                    {size === "sm" ? t("Small", "صغير") : size === "md" ? t("Medium", "متوسط") : t("Large", "كبير")}
                  </span>
                  {logoSize === size && <Check size={11} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Save button bottom */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <button
          type="button"
          onClick={saveAll}
          className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          <Check size={15} /> {t("Save Appearance", "حفظ المظهر")}
        </button>
      </motion.div>
    </div>
  );
}
