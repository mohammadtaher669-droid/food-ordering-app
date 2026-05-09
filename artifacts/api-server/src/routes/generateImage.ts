import { Router } from "express";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router = Router();

const cache = new Map<string, string>();

router.post("/generate-image", async (req, res) => {
  const { prompt, size = "1024x1024", cacheKey } = req.body as {
    prompt?: string;
    size?: "1024x1024" | "1024x1536";
    cacheKey?: string;
  };

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const key = cacheKey || prompt.trim().toLowerCase();

  if (cache.has(key)) {
    res.json({ b64_json: cache.get(key) });
    return;
  }

  try {
    const buffer = await generateImageBuffer(prompt.trim(), size);
    const b64 = buffer.toString("base64");
    cache.set(key, b64);
    res.json({ b64_json: b64 });
  } catch (err) {
    req.log.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
