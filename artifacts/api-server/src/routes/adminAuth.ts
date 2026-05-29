import { Router } from "express";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "crypto";
import { getJwtSecret } from "../lib/auth";

const router = Router();

// In-memory rate limiting: max 5 wrong attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

function checkAndRecordAttempt(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX_ATTEMPTS = 5;

  let entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    loginAttempts.set(ip, entry);
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

function getAdminPassword(): string {
  return process.env["ADMIN_PASSWORD"] || "admin123";
}

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) {
      timingSafeEqual(ba, Buffer.alloc(ba.length));
      return false;
    }
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

// POST /api/admin/login
router.post("/admin/login", (req, res) => {
  const ip = getClientIp(req);
  const { password } = req.body as { password?: string };

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const { allowed } = checkAndRecordAttempt(ip);
  if (!allowed) {
    res.status(429).json({ error: "Too many failed attempts. Try again in 15 minutes." });
    return;
  }

  if (!safeCompare(password, getAdminPassword())) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  clearAttempts(ip);

  const token = jwt.sign({ role: "admin" }, getJwtSecret(), { expiresIn: "24h" });
  res.json({ token });
});

// GET /api/admin/verify
router.get("/admin/verify", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ valid: false });
    return;
  }
  try {
    jwt.verify(auth.slice(7), getJwtSecret());
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// POST /api/admin/change-password
router.post("/admin/change-password", (req, res) => {
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

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Both fields are required" });
    return;
  }
  if (!safeCompare(currentPassword, getAdminPassword())) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  process.env["ADMIN_PASSWORD"] = newPassword;
  res.json({ success: true });
});

export default router;
