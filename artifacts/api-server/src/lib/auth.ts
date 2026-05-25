import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    // Log a warning but don't crash — use a default in dev only
    console.warn("[auth] JWT_SECRET not set — using insecure dev default. Set JWT_SECRET in production.");
    return "matami-insecure-dev-secret-change-in-production";
  }
  return secret;
}

export interface AdminTokenPayload {
  role: "admin";
  iat: number;
  exp: number;
}

/**
 * Express middleware that requires a valid admin JWT.
 * On success, attaches decoded payload to req.adminToken.
 * On failure, returns 401 JSON.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
    (req as any).adminToken = payload;
    next();
  } catch (err: any) {
    const expired = err?.name === "TokenExpiredError";
    res.status(401).json({ error: expired ? "Session expired. Please log in again." : "Invalid token." });
  }
}
