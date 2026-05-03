import type { AppSettings } from "./store";

export const FONT_OPTIONS = [
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans", url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" },
  { label: "Inter", value: "Inter", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" },
  { label: "Poppins", value: "Poppins", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" },
  { label: "Nunito", value: "Nunito", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" },
  { label: "DM Sans", value: "DM Sans", url: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap" },
  { label: "Raleway", value: "Raleway", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&display=swap" },
  { label: "Cairo (Arabic)", value: "Cairo", url: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" },
  { label: "Tajawal (Arabic)", value: "Tajawal", url: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" },
];

export function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "0 0% 50%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#111111";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

export function loadFont(family: string): void {
  const id = `gfont-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const font = FONT_OPTIONS.find((f) => f.value === family);
  if (!font) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = font.url;
  document.head.appendChild(link);
}

export function applyTheme(settings: AppSettings): void {
  const root = document.documentElement;
  if (settings.primary_color) root.style.setProperty("--primary", hexToHsl(settings.primary_color));
  if (settings.bg_color) {
    root.style.setProperty("--background", hexToHsl(settings.bg_color));
    root.style.setProperty("--sidebar", hexToHsl(settings.bg_color));
  }
  if (settings.text_color) {
    root.style.setProperty("--foreground", hexToHsl(settings.text_color));
    root.style.setProperty("--card-foreground", hexToHsl(settings.text_color));
  }
  if (settings.font_family) {
    loadFont(settings.font_family);
    root.style.setProperty("--font-sans", `'${settings.font_family}', sans-serif`);
  }
  const scale = settings.font_size_scale ?? 1;
  root.style.fontSize = `${Math.round(scale * 15)}px`;
}
