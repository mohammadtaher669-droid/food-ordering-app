/**
 * POST /api/images/upload — Cloudinary upload (requires CLOUDINARY_URL env var)
 * Falls back gracefully if Cloudinary is not configured.
 */
import { Router } from "express";
import { requireAdmin } from "../lib/auth";
import { asyncHandler } from "../lib/validate";
import { logger } from "../lib/logger";

const router = Router();

router.post("/images/upload", requireAdmin, asyncHandler(async (req, res) => {
  const cloudinaryUrl = process.env["CLOUDINARY_URL"];

  if (!cloudinaryUrl) {
    res.status(503).json({
      error: "Cloudinary not configured",
      message: "Set CLOUDINARY_URL environment variable to enable cloud image uploads. Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
    });
    return;
  }

  const { data, folder = "matami", preset } = req.body as {
    data?: string;
    folder?: string;
    preset?: string;
  };

  if (!data || !data.startsWith("data:")) {
    res.status(400).json({ error: "data must be a base64 data URL" });
    return;
  }

  // Parse cloudinary credentials from URL
  const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) {
    res.status(500).json({ error: "CLOUDINARY_URL format is invalid" });
    return;
  }
  const [, apiKey, apiSecret, cloudName] = match;

  // Build upload request
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = await import("crypto");
  const signature = crypto.createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const form = new URLSearchParams();
  form.append("file", data);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  if (preset) form.append("upload_preset", preset);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    logger.error({ err }, "Cloudinary upload failed");
    res.status(500).json({ error: "Upload failed", details: err });
    return;
  }

  const json = await uploadRes.json() as any;
  res.json({
    url: json.secure_url as string,
    public_id: json.public_id as string,
    width: json.width as number,
    height: json.height as number,
  });
}));

export default router;
