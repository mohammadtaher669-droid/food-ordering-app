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
  
  if (!auth?.startsWith("Bearer ")) {
    console.log("[requireAdmin] FAILED: Missing or invalid Authorization header");
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  
  const token = auth.slice(7);
  
  // DETAILED LOGGING BEFORE JWT VERIFICATION
  console.log("TOKEN_LENGTH", token.length);
  console.log("TOKEN_PREFIX", token.substring(0, 20));
  console.log("SECRET_LENGTH", secret.length);
  
  // Log decoded header
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log("JWT_HEADER", JSON.stringify(decoded?.header));
  } catch (decodeErr: any) {
    console.log("JWT_DECODE_ERROR", decodeErr?.name, decodeErr?.message);
  }
  
  // ATTEMPT JWT VERIFICATION WITH DETAILED ERROR LOGGING
  try {
    console.log("[requireAdmin] Attempting JWT verification...");
    const payload = jwt.verify(token, secret) as AdminTokenPayload;
    console.log("[requireAdmin] JWT verification SUCCESS");
    (req as any).adminToken = payload;
    next();
  } catch (err: any) {
    console.error("JWT_VERIFY_ERROR", err?.name, err?.message);
    
    const expired = err?.name === "TokenExpiredError";
    const errorMsg = expired ? "Session expired. Please log in again." : "Invalid token.";
    console.log("[requireAdmin] Returning 401 with error:", errorMsg);
    res.status(401).json({ error: errorMsg });
  }
}

