import { Router } from "express";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getSingleton, listCmsItems, createCmsItem, updateCmsItem } from "@workspace/db";
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
    
    // Default model/provider resolution
    const providerStr = String(settings.active_model || "gemini-2.0-flash").toLowerCase();
    
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
    
    // Simplified context to avoid token limits
    const simplifiedContext = allItems.map(i => ({ id: i.id, type: i.type, title: i.title, data: i.data }));
    const contextStr = `Données du portfolio actuel : ${JSON.stringify(simplifiedContext)}`;
    
    const sysPrompt = String(settings.system_prompt || "Tu es l'assistant de Landry. Tu as accès à son portfolio via des outils.");
    const seoRules = String(settings.seo_rules || "");
    const finalSystem = `${sysPrompt}\n\nRègles à suivre (SEO, style) :\n${seoRules}\n\nContexte:\n${contextStr}`;

    const { text, steps } = await generateText({
      model: aiModel,
      system: finalSystem,
      messages,
      maxSteps: 5,
      tools: {
        createContent: tool({
          description: "Créer un nouveau contenu (projet, compétence, service, etc.). Fournis le plus de détails possible dans l'objet 'data' (category, description, technologies, coverImage, link, date, etc.).",
          parameters: z.object({
            type: z.enum(["project", "skill", "technology", "service", "timeline", "social"]),
            title: z.string(),
            data: z.record(z.any()),
          }),
          execute: async ({ type, title, data }) => {
            const id = await createCmsItem({ type, title, data, visible: false, published: false });
            return `Le contenu '${title}' a été créé avec succès (ID: ${id}).`;
          }
        }),
        updateContent: tool({
          description: "Mettre à jour un contenu existant. Modifie uniquement les champs nécessaires dans 'data'.",
          parameters: z.object({
            id: z.number(),
            title: z.string().optional(),
            data: z.record(z.any()).optional(),
          }),
          execute: async ({ id, title, data }) => {
            await updateCmsItem(id, { title, data });
            return `Le contenu ID ${id} a été mis à jour avec succès.`;
          }
        })
      }
    });

    res.json({ 
      message: { role: "assistant", text },
      steps // Send steps if we want to show tools calls in UI
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur inconnue de l'IA" });
  }
});

export default router;
