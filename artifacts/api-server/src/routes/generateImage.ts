import { Router } from "express";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { randomUUID } from "crypto";

const router = Router();

interface ImageEntry {
  buffer: Buffer;
  prompt: string;
}

const imageStore = new Map<string, ImageEntry>();
const keyToId = new Map<string, string>();

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

  if (keyToId.has(key)) {
    const id = keyToId.get(key)!;
    res.json({ url: `/api/images/${id}` });
    return;
  }

  try {
    const buffer = await generateImageBuffer(prompt.trim(), size);
    const id = randomUUID();
    imageStore.set(id, { buffer, prompt: prompt.trim() });
    keyToId.set(key, id);
    res.json({ url: `/api/images/${id}` });
  } catch (err) {
    req.log.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

router.get("/images/:id", (req, res) => {
  const entry = imageStore.get(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(entry.buffer);
});

export default router;
