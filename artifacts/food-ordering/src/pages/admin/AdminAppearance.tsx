import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Palette, Type, ImageIcon, RotateCcw, Check, Monitor,
  LayoutGrid, AlignJustify, Rows3, Maximize2, Minimize2,
  Circle, Square, Minus,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { settingsStore } from "@/lib/store";
import type { AppSettings } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import {
  FONT_OPTIONS, AR_FONT_OPTIONS, applyTheme, hexToHsl, hslToHex,
} from "@/lib/themeUtils";
import matAmiLogo from "@assets/لوجو_الموقع_مطعمي_1776635393637.png";

interface Template {
  name: string;
  name_ar: string;
  bg: string;
  primary: string;
  text: string;
  card: string;
  font: string;
  ar_font: string;
  radius: AppSettings["card_radius"];
  density: AppSettings["layout_density"];
  border: AppSettings["border_style"];
  preview_emoji: string;
}

const TEMPLATES: Template[] = [
  {
    name: "Mat'ami Dark", name_ar: "مطعمي الداكن",
    bg: "#0F0F0F", primary: "#FF7A00", text: "#FAFAFA", card: "#1C1C1C",
    font: "Plus Jakarta Sans", ar_font: "Cairo",
    radius: "rounded", density: "normal", border: "subtle",
    preview_emoji: "🔥",
  },
  {
    name: "Midnight Gold", name_ar: "الذهب الليلي",
    bg: "#0A0A0A", primary: "#D4AF37", text: "#F0E6C8", card: "#141414",
    font: "Raleway", ar_font: "Tajawal",
    radius: "sharp", density: "compact", border: "subtle",
    preview_emoji: "✨",
  },
  {
    name: "Warm Ember", name_ar: "الجمر الدافئ",
    bg: "#1A0E08", primary: "#FF5722", text: "#FFE4C4", card: "#231208",
    font: "Poppins", ar_font: "Tajawal",
    radius: "rounded", density: "normal", border: "subtle",
    preview_emoji: "🌅",
  },
  {
    name: "Ocean Night", name_ar: "محيط الليل",
    bg: "#0D1B2A", primary: "#29B6F6", text: "#E0F7FA", card: "#142233",
    font: "DM Sans", ar_font: "Cairo",
    radius: "rounded", density: "normal", border: "subtle",
    preview_emoji: "🌊",
  },
  {
    name: "Clean Light", name_ar: "النظافة الفاتحة",
    bg: "#F5F5F5", primary: "#FF5722", text: "#1A1A1A", card: "#FFFFFF",
    font: "Nunito", ar_font: "Almarai",
    radius: "pill", density: "spacious", border: "strong",
    preview_emoji: "☀️",
  },
  {
    name: "Royal Plum", name_ar: "البنفسجي الملكي",
    bg: "#130A2E", primary: "#AB47BC", text: "#F3E5F5", card: "#1E1040",
    font: "Plus Jakarta Sans", ar_font: "Tajawal",
    radius: "rounded", density: "normal", border: "subtle",
    preview_emoji: "👑",
  },
  {
    name: "Forest Night", name_ar: "الغابة الليلية",
    bg: "#0A1A0E", primary: "#4CAF50", text: "#E8F5E9", card: "#111E14",
    font: "DM Sans", ar_font: "Cairo",
    radius: "rounded", density: "normal", border: "subtle",
    preview_emoji: "🌿",
  },
  {
    name: "Rose Noir", name_ar: "الوردة السوداء",
    bg: "#1A0A0E", primary: "#F06292", text: "#FCE4EC", card: "#230F13",
    font: "Sora", ar_font: "Almarai",
    radius: "pill", density: "normal", border: "subtle",
    preview_emoji: "🌹",
  },
];

const PRIMARY_PRESETS = [
  "#FF7A00","#FF5500","#FF3B30","#E53935","#D81B60","#AB47BC",
  "#3949AB","#0097A7","#00897B","#43A047","#F9A825","#D4AF37",
  "#FF9800","#29B6F6","#4CAF50","#F06292",
];
const BG_PRESETS = [
  "#0F0F0F","#0A0A0A","#111111","#181818","#1A0E08","#0D1B2A",
  "#130A2E","#0A1A0E","#1A0A0E","#1A1A2E","#192734","#0F1923",
  "#FFFFFF","#F8F8F8","#F5F5F5","#FFFDF7",
];
const TEXT_PRESETS = [
  "#FAFAFA","#F0F0F0","#E0E0E0","#FFE4C4","#F0E6C8","#E0F7FA",
  "#F3E5F5","#E8F5E9","#FCE4EC","#CCCCCC","#1A1A1A","#000000",
];
const CARD_PRESETS = [
  "#1C1C1C","#141414","#231208","#142233","#FFFFFF","#1E1040",
  "#111E14","#230F13","#1A1A2E","#222222","#F8F8F8","#F0EDE8",
];

function SectionCard({ title, icon, children, delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
          <h2 className="font-semibold text-foreground text-sm">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </motion.div>
  );
}

function ColorRow({ label, value, presets, onChange }: {
  label: string; value: string; presets: string[]; onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
            className="w-24 bg-background border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:border-primary/50"
          />
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 cursor-pointer">
            <input type="color" value={value.length === 7 ? value : "#FF7A00"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="w-full h-full" style={{ background: value }} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)}
            className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
            style={{ background: p, borderColor: value.toLowerCase() === p.toLowerCase() ? "hsl(var(--primary))" : "transparent" }}
            title={p}
          />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_SETTINGS: Partial<AppSettings> = {
  primary_color: "#FF7A00", bg_color: "#0F0F0F", text_color: "#FAFAFA",
  card_color: "#1C1C1C", font_family: "Plus Jakarta Sans", ar_font_family: "Cairo",
  font_size_scale: 1, logo_size: "md", card_radius: "rounded",
  layout_density: "normal", menu_display_mode: "grid",
  image_quality: 80, border_style: "subtle",
};

export default function AdminAppearance() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const saved = useStore(useCallback(() => settingsStore.get(), []));

  const [primary, setPrimary] = useState(saved.primary_color || "#FF7A00");
  const [bg, setBg] = useState(saved.bg_color || "#0F0F0F");
  const [text, setText] = useState(saved.text_color || "#FAFAFA");
  const [card, setCard] = useState(saved.card_color || "#1C1C1C");
  const [fontFamily, setFontFamily] = useState(saved.font_family || "Plus Jakarta Sans");
  const [arFont, setArFont] = useState(saved.ar_font_family || "Cairo");
  const [fontScale, setFontScale] = useState(saved.font_size_scale ?? 1);
  const [logoSize, setLogoSize] = useState<"sm" | "md" | "lg">(saved.logo_size || "md");
  const [platformLogoUrl, setPlatformLogoUrl] = useState(saved.platform_logo_url || "");
  const [platformNameEn, setPlatformNameEn] = useState(saved.platform_name_en || "");
  const [platformNameAr, setPlatformNameAr] = useState(saved.platform_name_ar || "");
  const [cardRadius, setCardRadius] = useState<AppSettings["card_radius"]>(saved.card_radius || "rounded");
  const [density, setDensity] = useState<AppSettings["layout_density"]>(saved.layout_density || "normal");
  const [displayMode, setDisplayMode] = useState<AppSettings["menu_display_mode"]>(saved.menu_display_mode || "grid");
  const [imgQuality, setImgQuality] = useState(saved.image_quality ?? 80);
  const [borderStyle, setBorderStyle] = useState<AppSettings["border_style"]>(saved.border_style || "subtle");
  const [activeTemplate, setActiveTemplate] = useState(saved.active_template || "");

  const buildSettings = (): AppSettings => ({
    ...saved,
    primary_color: primary, bg_color: bg, text_color: text, card_color: card,
    font_family: fontFamily, ar_font_family: arFont,
    font_size_scale: fontScale, logo_size: logoSize,
    platform_logo_url: platformLogoUrl || undefined,
    platform_name_en: platformNameEn || undefined,
    platform_name_ar: platformNameAr || undefined,
    card_radius: cardRadius, layout_density: density,
    menu_display_mode: displayMode, image_quality: imgQuality,
    border_style: borderStyle, active_template: activeTemplate,
  });

  const livePreview = (overrides: Partial<AppSettings> = {}) => {
    applyTheme({ ...buildSettings(), ...overrides });
  };

  const applyTemplate = (tmpl: Template) => {
    setPrimary(tmpl.primary); setBg(tmpl.bg); setText(tmpl.text); setCard(tmpl.card);
    setFontFamily(tmpl.font); setArFont(tmpl.ar_font);
    setCardRadius(tmpl.radius); setDensity(tmpl.density); setBorderStyle(tmpl.border);
    setActiveTemplate(tmpl.name);
    const s: AppSettings = {
      ...saved,
      primary_color: tmpl.primary, bg_color: tmpl.bg, text_color: tmpl.text, card_color: tmpl.card,
      font_family: tmpl.font, ar_font_family: tmpl.ar_font,
      card_radius: tmpl.radius, layout_density: tmpl.density, border_style: tmpl.border,
      active_template: tmpl.name,
    };
    applyTheme(s);
  };

  const saveAll = () => {
    try {
      const s = buildSettings();
      settingsStore.save(s);
      applyTheme(s);
      toast({ title: t("Appearance saved!", "تم حفظ المظهر!") });
    } catch (err) {
      toast({ title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const resetAll = () => {
    setPrimary(DEFAULT_SETTINGS.primary_color!); setBg(DEFAULT_SETTINGS.bg_color!);
    setText(DEFAULT_SETTINGS.text_color!); setCard(DEFAULT_SETTINGS.card_color!);
    setFontFamily(DEFAULT_SETTINGS.font_family!); setArFont(DEFAULT_SETTINGS.ar_font_family!);
    setFontScale(DEFAULT_SETTINGS.font_size_scale!); setLogoSize(DEFAULT_SETTINGS.logo_size!);
    setCardRadius(DEFAULT_SETTINGS.card_radius); setDensity(DEFAULT_SETTINGS.layout_density);
    setDisplayMode(DEFAULT_SETTINGS.menu_display_mode); setImgQuality(DEFAULT_SETTINGS.image_quality!);
    setBorderStyle(DEFAULT_SETTINGS.border_style); setActiveTemplate("");
    const reset: AppSettings = { ...saved, ...DEFAULT_SETTINGS };
    settingsStore.save(reset);
    applyTheme(reset);
    toast({ title: t("Reset to defaults", "تمت إعادة الضبط") });
  };

  const logoClasses = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("Design Studio", "استوديو التصميم")}</h1>
            <p className="text-sm text-muted-foreground">{t("Templates, colors, fonts, layout — live preview as you edit.", "قوالب، ألوان، خطوط، تخطيط — معاينة فورية.")}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-white/10 text-muted-foreground hover:text-foreground transition">
              <RotateCcw size={12} /> {t("Reset", "إعادة ضبط")}
            </button>
            <button type="button" onClick={saveAll} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm bg-primary text-white font-medium" data-testid="btn-save-appearance">
              <Check size={13} /> {t("Save All", "حفظ الكل")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live Preview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
            <Monitor size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("Live preview", "معاينة مباشرة")}</span>
          </div>
          <div className="p-5 flex items-center gap-4" style={{ background: bg, fontFamily: `'${fontFamily}', sans-serif`, fontSize: `${fontScale * 14}px` }}>
            <img src={platformLogoUrl || matAmiLogo} alt="" className={`${logoClasses[logoSize]} object-contain rounded-full flex-shrink-0`} onError={(e) => { (e.target as HTMLImageElement).src = matAmiLogo; }} />
            <div className="flex-1">
              <p style={{ color: text, fontWeight: 700, fontSize: `${fontScale * 16}px` }}>{platformNameEn || "Mat'ami"}</p>
              <p style={{ color: `${text}88`, fontSize: `${fontScale * 12}px` }}>{t("Order from the best restaurants", "اطلب من أفضل المطاعم")}</p>
            </div>
            <div style={{ background: card, borderRadius: cardRadius === "sharp" ? "4px" : cardRadius === "pill" ? "20px" : "12px", padding: "10px 14px", border: `1px solid ${text}15` }}>
              <p style={{ color: text, fontWeight: 600, fontSize: `${fontScale * 12}px` }}>🍔 {t("Burger", "برجر")}</p>
              <p style={{ color: primary, fontWeight: 700, fontSize: `${fontScale * 13}px` }}>35 ﷼</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0" style={{ background: primary, fontSize: `${fontScale * 11}px`, borderRadius: cardRadius === "pill" ? "999px" : "8px" }}>
              {t("Order", "اطلب")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Templates */}
      <SectionCard title={t("🎨 Templates", "🎨 القوالب")} icon={<Palette size={16} />} delay={0.05}>
        <p className="text-xs text-muted-foreground mb-3">{t("One-click to apply a full design theme.", "انقر مرة واحدة لتطبيق ثيم كامل.")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => applyTemplate(tmpl)}
              className={`relative group flex flex-col items-start p-3 rounded-xl border transition-all text-left overflow-hidden ${activeTemplate === tmpl.name ? "border-primary ring-1 ring-primary/50" : "border-white/10 hover:border-white/25"}`}
              style={{ background: tmpl.bg }}
            >
              <div className="flex items-center gap-1.5 mb-2 w-full">
                <span className="text-lg leading-none">{tmpl.preview_emoji}</span>
                <div className="flex gap-1 ml-auto">
                  <div className="w-3 h-3 rounded-full" style={{ background: tmpl.primary }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: tmpl.card }} />
                </div>
              </div>
              <span className="text-[11px] font-bold leading-tight" style={{ color: tmpl.text }}>{t(tmpl.name, tmpl.name_ar)}</span>
              {activeTemplate === tmpl.name && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Colors */}
      <SectionCard title={t("🎨 Colors", "🎨 الألوان")} icon={<Palette size={16} />} delay={0.08}>
        <div className="space-y-5">
          <ColorRow label={t("Accent / Brand color", "لون العلامة التجارية")} value={primary} presets={PRIMARY_PRESETS}
            onChange={(v) => { setPrimary(v); livePreview({ primary_color: v }); }} />
          <div className="border-t border-white/5" />
          <ColorRow label={t("Background color", "لون الخلفية")} value={bg} presets={BG_PRESETS}
            onChange={(v) => { setBg(v); livePreview({ bg_color: v }); }} />
          <div className="border-t border-white/5" />
          <ColorRow label={t("Text color", "لون النص")} value={text} presets={TEXT_PRESETS}
            onChange={(v) => { setText(v); livePreview({ text_color: v }); }} />
          <div className="border-t border-white/5" />
          <ColorRow label={t("Card color", "لون البطاقات")} value={card} presets={CARD_PRESETS}
            onChange={(v) => { setCard(v); livePreview({ card_color: v }); }} />
        </div>
      </SectionCard>

      {/* Typography */}
      <SectionCard title={t("🔤 Typography", "🔤 الخطوط")} icon={<Type size={16} />} delay={0.1}>
        <div className="space-y-6">
          {/* EN Font */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("English font", "خط اللغة الإنجليزية")}</label>
            <div className="grid grid-cols-1 gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button key={f.value} type="button"
                  onClick={() => { setFontFamily(f.value); livePreview({ font_family: f.value }); }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition ${fontFamily === f.value ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                >
                  <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                  <span className="text-xs opacity-50" style={{ fontFamily: `'${f.value}', sans-serif` }}>Aa Bb 123</span>
                  {fontFamily === f.value && <Check size={12} className="text-primary ml-2 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* AR Font */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("Arabic font", "خط اللغة العربية")}</label>
            <div className="grid grid-cols-1 gap-1.5">
              {AR_FONT_OPTIONS.map((f) => (
                <button key={f.value} type="button"
                  onClick={() => { setArFont(f.value); livePreview({ ar_font_family: f.value }); }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition ${arFont === f.value ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                >
                  <span style={{ fontFamily: `'${f.value}', sans-serif` }}>{f.label}</span>
                  <span className="text-xs opacity-50" dir="rtl" style={{ fontFamily: `'${f.value}', sans-serif` }}>أب ت ١٢٣</span>
                  {arFont === f.value && <Check size={12} className="text-primary ml-2 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">{t("Font size", "حجم الخط")}</label>
              <span className="text-xs font-mono text-primary">{Math.round(fontScale * 100)}%</span>
            </div>
            <input type="range" min={80} max={130} step={5} value={Math.round(fontScale * 100)}
              onChange={(e) => { const s = parseInt(e.target.value) / 100; setFontScale(s); livePreview({ font_size_scale: s }); }}
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

      {/* Card Style */}
      <SectionCard title={t("🃏 Card Style", "🃏 نمط البطاقات")} icon={<Square size={16} />} delay={0.12}>
        <div className="space-y-5">
          {/* Radius */}
          <div>
            <label className="text-xs text-muted-foreground mb-2.5 block">{t("Corner radius", "انحناء الزوايا")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["sharp", "rounded", "pill"] as const).map((r) => {
                const icons = { sharp: <Square size={18} />, rounded: <Circle size={18} />, pill: <Maximize2 size={18} /> };
                const labels = { sharp: t("Sharp", "حاد"), rounded: t("Rounded", "مدور"), pill: t("Pill", "بيضاوي") };
                return (
                  <button key={r} type="button"
                    onClick={() => { setCardRadius(r); livePreview({ card_radius: r }); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${cardRadius === r ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
                  >
                    {icons[r]}
                    <span className="text-xs font-medium">{labels[r]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Border */}
          <div>
            <label className="text-xs text-muted-foreground mb-2.5 block">{t("Border style", "نمط الحدود")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["none", "subtle", "strong"] as const).map((b) => {
                const labels = { none: t("None", "بدون"), subtle: t("Subtle", "خفيف"), strong: t("Strong", "واضح") };
                const borders = { none: "0px solid", subtle: "1px solid rgba(255,255,255,0.07)", strong: "1px solid rgba(255,255,255,0.2)" };
                return (
                  <button key={b} type="button"
                    onClick={() => { setBorderStyle(b); livePreview({ border_style: b }); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${borderStyle === b ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
                  >
                    <div className="w-8 h-5 rounded bg-card/50" style={{ border: borders[b] }} />
                    <span className="text-xs font-medium">{labels[b]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Layout */}
      <SectionCard title={t("📐 Layout & Display", "📐 التخطيط والعرض")} icon={<LayoutGrid size={16} />} delay={0.14}>
        <div className="space-y-5">
          {/* Density */}
          <div>
            <label className="text-xs text-muted-foreground mb-2.5 block">{t("Spacing density", "كثافة التباعد")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["compact", "normal", "spacious"] as const).map((d) => {
                const icons = { compact: <Minimize2 size={16} />, normal: <AlignJustify size={16} />, spacious: <Maximize2 size={16} /> };
                const labels = { compact: t("Compact", "مضغوط"), normal: t("Normal", "عادي"), spacious: t("Spacious", "مريح") };
                return (
                  <button key={d} type="button"
                    onClick={() => { setDensity(d); livePreview({ layout_density: d }); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${density === d ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
                  >
                    {icons[d]}
                    <span className="text-xs font-medium">{labels[d]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Menu display mode */}
          <div>
            <label className="text-xs text-muted-foreground mb-2.5 block">{t("Default menu layout", "تخطيط القائمة الافتراضي")}</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "grid", label_en: "Grid", label_ar: "شبكة", icon: <LayoutGrid size={16} /> },
                { key: "compact_grid", label_en: "Compact", label_ar: "مضغوط", icon: <Rows3 size={16} /> },
                { key: "list", label_en: "List", label_ar: "قائمة", icon: <AlignJustify size={16} /> },
              ] as const).map((dm) => (
                <button key={dm.key} type="button"
                  onClick={() => setDisplayMode(dm.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition ${displayMode === dm.key ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
                >
                  {dm.icon}
                  <span className="text-xs font-medium">{t(dm.label_en, dm.label_ar)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Image Quality */}
      <SectionCard title={t("🖼 Image Quality", "🖼 جودة الصور")} icon={<ImageIcon size={16} />} delay={0.16}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("Controls compression quality when uploading new images. Higher = better quality but larger file size.", "يتحكم في جودة الضغط عند رفع الصور. أعلى = جودة أفضل لكن حجم أكبر.")}</p>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">{t("Quality", "الجودة")}</label>
            <span className="text-xs font-mono text-primary font-bold">{imgQuality}%</span>
          </div>
          <input type="range" min={60} max={100} step={5} value={imgQuality}
            onChange={(e) => setImgQuality(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{t("60% — Smaller files", "60% — ملفات أصغر")}</span>
            <span>{t("80% — Balanced", "80% — متوازن")} ✓</span>
            <span>{t("100% — Max quality", "100% — أعلى جودة")}</span>
          </div>
        </div>
      </SectionCard>

      {/* Platform Identity */}
      <SectionCard title={t("🏷 Platform Identity", "🏷 هوية المنصة")} icon={<ImageIcon size={16} />} delay={0.18}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">{t("Customize the platform name and logo in the navbar.", "خصص اسم وشعار المنصة في شريط التنقل.")}</p>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("Logo URL (optional)", "رابط الشعار (اختياري)")}</label>
            <input type="url" value={platformLogoUrl} onChange={(e) => setPlatformLogoUrl(e.target.value)} placeholder="https://example.com/logo.png"
              className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("Name (EN)", "الاسم (EN)")}</label>
              <input type="text" value={platformNameEn} onChange={(e) => setPlatformNameEn(e.target.value)} placeholder="Mat'ami"
                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("Name (AR)", "الاسم (AR)")}</label>
              <input type="text" value={platformNameAr} onChange={(e) => setPlatformNameAr(e.target.value)} placeholder="مطعمي" dir="rtl"
                className="w-full bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Logo Size */}
      <SectionCard title={t("🖼 Logo Size", "🖼 حجم الشعار")} icon={<ImageIcon size={16} />} delay={0.2}>
        <div className="grid grid-cols-3 gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <button key={size} type="button"
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
      </SectionCard>

      {/* Save bottom */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <button type="button" onClick={saveAll} className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2">
          <Check size={15} /> {t("Save All Changes", "حفظ جميع التغييرات")}
        </button>
      </motion.div>
    </div>
  );
}
