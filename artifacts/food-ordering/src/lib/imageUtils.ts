export type ImagePreset = "hero_banner" | "category_icon" | "product" | "restaurant_cover" | "thumbnail" | "offer";

export interface ImagePresetConfig {
  width: number;
  height: number;
  label: string;
  quality: number;
}

export const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  hero_banner:       { width: 1200, height: 400,  label: "1200 × 400 px",  quality: 0.82 },
  category_icon:     { width: 200,  height: 200,  label: "200 × 200 px",   quality: 0.85 },
  product:           { width: 500,  height: 500,  label: "500 × 500 px",   quality: 0.85 },
  restaurant_cover:  { width: 1200, height: 600,  label: "1200 × 600 px",  quality: 0.82 },
  thumbnail:         { width: 150,  height: 150,  label: "150 × 150 px",   quality: 0.80 },
  offer:             { width: 500,  height: 500,  label: "500 × 500 px",   quality: 0.85 },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
  if (file.size > MAX_BYTES) return `Image is too large. Maximum size is 2 MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  return null;
}

function supportsWebP(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

export function processImage(file: File, preset: ImagePreset): Promise<string> {
  const { width: targetW, height: targetH, quality } = IMAGE_PRESETS[preset];
  const outputType = supportsWebP() ? "image/webp" : "image/jpeg";

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      const srcRatio = srcW / srcH;
      const tgtRatio = targetW / targetH;

      let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
      if (srcRatio > tgtRatio) {
        cropW = Math.round(srcH * tgtRatio);
        cropX = Math.round((srcW - cropW) / 2);
      } else {
        cropH = Math.round(srcW / tgtRatio);
        cropY = Math.round((srcH - cropH) / 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

      resolve(canvas.toDataURL(outputType, quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };

    img.src = objectUrl;
  });
}

export function makePlaceholderSvg(w: number, h: number, icon = "🍽️"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#1a1a2e"/>
    <text x="50%" y="50%" font-size="${Math.min(w, h) * 0.35}" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDERS: Record<ImagePreset, string> = {
  hero_banner:      makePlaceholderSvg(1200, 400, "🎉"),
  category_icon:    makePlaceholderSvg(200, 200, "🍴"),
  product:          makePlaceholderSvg(500, 500, "🍽️"),
  restaurant_cover: makePlaceholderSvg(1200, 600, "🏪"),
  thumbnail:        makePlaceholderSvg(150, 150, "🍽️"),
  offer:            makePlaceholderSvg(500, 500, "🎁"),
};
