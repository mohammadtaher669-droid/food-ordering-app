import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
// 25 MB limit to accommodate base64-encoded images in store snapshots
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ── REST API ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Static frontend (production single-server mode) ───────────────────────────
// When the Vite build is present (Railway or any single-server deploy), Express
// serves the compiled React SPA so no separate static host is needed.
//
// ESM-compatible __dirname (the banner in build.mjs also sets globalThis.__dirname
// but we redeclare locally for TypeScript clarity)
const _file = fileURLToPath(import.meta.url);
const _dir  = path.dirname(_file);

// Relative to the compiled dist/index.mjs:
//   ../../food-ordering/dist/public  →  artifacts/food-ordering/dist/public
const frontendDist = path.resolve(_dir, "../../food-ordering/dist/public");

if (existsSync(frontendDist)) {
  // Serve hashed JS/CSS chunks with a 1-year cache; never cache index.html
  app.use(
    express.static(frontendDist, {
      maxAge: "1y",
      setHeaders(res, filePath) {
        if (path.basename(filePath) === "index.html") {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }),
  );

  // SPA fallback — any request not matched by /api or a real static file
  // serves index.html so React Router handles client-side routing.
  // app.use() is required here: Express 5 / path-to-regexp v8 no longer
  // accepts the bare "*" wildcard in app.get().
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
