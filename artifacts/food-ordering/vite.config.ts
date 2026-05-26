import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// PORT is required for the dev server; defaults to 3000 for production builds
// where the port is determined at runtime by the host (Railway, etc.)
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

// BASE_PATH defaults to "/" — correct for Railway and any standard deployment
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          // Framer Motion (large animation lib)
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-motion";
          }
          // Recharts + D3 (charting)
          if (id.includes("node_modules/recharts/") || id.includes("node_modules/d3") || id.includes("node_modules/victory-vendor/")) {
            return "vendor-charts";
          }
          // DnD Kit
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd";
          }
          // Radix UI
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // XLSX (heavy excel lib — isolated because it's ~420KB)
          if (id.includes("node_modules/xlsx/")) {
            return "vendor-xlsx";
          }
          // Tanstack Query
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }
          // Lucide icons (large)
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          // Other node_modules (including leaflet — merging avoids circular chunk)
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
