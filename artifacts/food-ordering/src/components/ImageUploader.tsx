import { useRef, useState } from "react";
import { Upload, Trash2, RefreshCw, ImageOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { type ImagePreset, IMAGE_PRESETS, PLACEHOLDERS, validateImageFile, processImage } from "@/lib/imageUtils";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  onDelete?: () => void;
  preset: ImagePreset;
  label?: string;
  className?: string;
  "data-testid"?: string;
}

export default function ImageUploader({ value, onChange, onDelete, preset, label, className = "", "data-testid": testId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const config = IMAGE_PRESETS[preset];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const err = validateImageFile(file);
    if (err) {
      toast({ title: t("Invalid image", "صورة غير صالحة"), description: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await processImage(file, preset);
      onChange(dataUrl);
      setImgError(false);
      toast({ title: t("Image uploaded successfully", "تم رفع الصورة بنجاح") });
    } catch {
      toast({ title: t("Upload failed", "فشل الرفع"), description: t("Could not process the image. Please try again.", "تعذّر معالجة الصورة. حاول مرة أخرى."), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setImgError(false);
  };

  const preview = value && !imgError ? value : null;
  const placeholder = PLACEHOLDERS[preset];

  return (
    <div className={`space-y-2 ${className}`} data-testid={testId}>
      {label && <label className="text-xs text-muted-foreground block">{label}</label>}

      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
        <ImageOff size={10} />
        {t("Recommended size", "الحجم الموصى به")}: <span className="font-mono text-primary/70">{config.label}</span>
        &nbsp;·&nbsp; JPG / PNG / WebP · {t("max 2 MB", "حد أقصى 2 ميجا")}
      </p>

      <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-background/50" style={{ aspectRatio: `${config.width}/${config.height}`, maxHeight: 220 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <RefreshCw size={22} className="text-primary" />
              </motion.div>
              <span className="text-xs text-muted-foreground">{t("Processing…", "جارٍ المعالجة…")}</span>
            </motion.div>
          ) : preview ? (
            <motion.img key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              src={preview} alt={t("Image preview", "معاينة الصورة")}
              className="w-full h-full object-cover" loading="lazy"
              onError={() => setImgError(true)} />
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
              <img src={placeholder} alt="" className="w-1/3 h-1/3 object-contain opacity-60" />
              <span className="text-xs">{t("No image", "لا توجد صورة")}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {preview && onDelete && (
            <button type="button" onClick={handleDelete}
              className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition"
              title={t("Delete image", "حذف الصورة")}>
              <Trash2 size={13} />
            </button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-medium transition"
            title={preview ? t("Replace image", "استبدال الصورة") : t("Upload image", "رفع صورة")}>
            <Upload size={12} />
            {preview ? t("Replace", "استبدال") : t("Upload", "رفع")}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}
