import { Router } from "express";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getSingleton, listCmsItems, updateCmsItem } from "@workspace/db";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.post("/chat", requireAdmin, async (req: any, res: any, next: any) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array required" });
      return;
    }

    const settings = await getSingleton("admin_settings");

    const providerStr = String(settings.active_model || "gemini-3.8-flash").toLowerCase();

    let aiModel;
    if (providerStr.includes("gemini")) {
      const google = createGoogleGenerativeAI({
        apiKey: String(settings.api_key_gemini || ""),
      });
      aiModel = google(providerStr);
    } else {
      const openai = createOpenAI({
        baseURL: providerStr.includes("deepseek") ? "https://api.deepseek.com/v1" : undefined,
        apiKey: String(settings.api_key_deepseek || settings.api_key_openai || ""),
      });
      aiModel = openai(providerStr);
    }

    const allItems = await listCmsItems(undefined, true);
    const simplifiedContext = allItems.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      data: i.data,
    }));
    const contextStr = `Données du portfolio actuel : ${JSON.stringify(simplifiedContext)}`;

    const sysPrompt = String(
      settings.system_prompt ||
        "Tu es l'assistant de Landry. Tu as accès à son portfolio via des outils.",
    );
    const seoRules = String(settings.seo_rules || "");
    const finalSystem = `${sysPrompt}

RÈGLES IMPORTANTES :
1. N'ajoute PAS le contenu directement dans la base de données.
2. Réponds simplement en texte, sans proposer de validation dans le chat.
3. Tu peux conseiller ou rédiger du contenu, mais tu ne dois pas créer de proposition d'enregistrement.

Règles à suivre (SEO, style) :
${seoRules}

Contexte:
${contextStr}`;

    const { text, steps } = await generateText({
      model: aiModel,
      system: finalSystem,
      messages,
      maxSteps: 5,
      tools: {
        updateContent: tool({
          description: "Mettre à jour un contenu existant.",
          parameters: z.object({
            id: z.number(),
            title: z.string().optional(),
            data: z.record(z.any()).optional(),
          }),
          execute: async ({ id, title, data }) => {
            await updateCmsItem(id, { title, data });
            return `Le contenu ID ${id} a été mis à jour avec succès.`;
          },
        }),
      },
    });

    let finalText = text;

    if (!finalText) {
      finalText = "Traitement terminé.";
    }

    res.json({
      message: { role: "assistant", text: finalText },
      steps,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur inconnue de l'IA" });
  }
});

export default router;
