import { Router } from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";

const router = Router();

const DATA_DIR = join(process.cwd(), "data");
const SNAPSHOT_FILE = join(DATA_DIR, "store-snapshot.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readSnapshot(): Record<string, unknown> | null {
  try {
    ensureDataDir();
    if (!existsSync(SNAPSHOT_FILE)) return null;
    return JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeSnapshot(data: Record<string, unknown>): void {
  ensureDataDir();
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(data), "utf-8");
}

function getJwtSecret(): string {
  return process.env["JWT_SECRET"] || "matami-insecure-dev-secret-set-in-production";
}

// GET /api/store — public, returns catalog snapshot for all devices
router.get("/store", (req, res) => {
  const snapshot = readSnapshot();
  if (!snapshot) {
    res.status(404).json({ error: "No store snapshot found yet" });
    return;
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json(snapshot);
});

// POST /api/store — requires valid admin JWT; saves catalog snapshot
router.post("/store", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    jwt.verify(auth.slice(7), getJwtSecret());
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
    return;
  }

  const data = req.body as Record<string, unknown>;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    res.status(400).json({ error: "Invalid snapshot data" });
    return;
  }

  try {
    writeSnapshot(data);
    res.json({ success: true, keys: Object.keys(data).length });
  } catch (err) {
    req.log.error({ err }, "Failed to write store snapshot");
    res.status(500).json({ error: "Failed to save snapshot" });
  }
});

export default router;
