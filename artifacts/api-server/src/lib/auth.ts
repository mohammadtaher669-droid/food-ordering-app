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
  const secret = getJwtSecret();
  
  // DETAILED LOGGING FOR DEBUGGING
  console.log("[requireAdmin] Authorization header received:", auth ? "YES" : "NO");
  if (auth) {
    console.log("[requireAdmin] Auth header value:", auth.substring(0, 20) + "...");
  }
  console.log("[requireAdmin] JWT_SECRET length:", secret.length);
  console.log("[requireAdmin] JWT_SECRET value:", secret);
  
  if (!auth?.startsWith("Bearer ")) {
    console.log("[requireAdmin] FAILED: Missing or invalid Authorization header");
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  
  const token = auth.slice(7);
  console.log("[requireAdmin] Token extracted, length:", token.length);
  console.log("[requireAdmin] Token value:", token.substring(0, 50) + "...");
  
  try {
    console.log("[requireAdmin] Attempting JWT verification...");
    const payload = jwt.verify(token, secret) as AdminTokenPayload;
    console.log("[requireAdmin] JWT verification SUCCESS");
    (req as any).adminToken = payload;
    next();
  } catch (err: any) {
    console.log("[requireAdmin] JWT verification FAILED");
    console.log("[requireAdmin] Error name:", err?.name);
    console.log("[requireAdmin] Error message:", err?.message);
    console.log("[requireAdmin] Full error:", JSON.stringify(err, null, 2));
    
    const expired = err?.name === "TokenExpiredError";
    const errorMsg = expired ? "Session expired. Please log in again." : "Invalid token.";
    console.log("[requireAdmin] Returning 401 with error:", errorMsg);
    res.status(401).json({ error: errorMsg });
  }
}

