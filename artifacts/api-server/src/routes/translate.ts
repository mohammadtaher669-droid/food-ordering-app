import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/translate", async (req, res) => {
  const { text, from, to } = req.body as { text?: string; from?: string; to?: string };

  if (!text || !from || !to) {
    res.status(400).json({ error: "Missing required fields: text, from, to" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a professional Arabic-English translator for a food delivery app. Translate from ${from} to ${to}. Return ONLY the translated text — no explanations, no quotes, no extra content. Preserve food terms and names accurately.`,
        },
        { role: "user", content: text },
      ],
    });

    const translated = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ translated });
  } catch (err) {
    req.log.error({ err }, "Translation failed");
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;
