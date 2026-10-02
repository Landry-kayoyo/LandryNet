import { Router } from "express";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getSingleton, listCmsItems, updateCmsItem } from "@workspace/db";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

const inferProposalType = (text: string) => {
  const lower = text.toLowerCase();

  if (/(projet|project|réalisation|case study|portfolio)/.test(lower)) return "project";
  if (/(compétence|skill|expertise|formation|stack)/.test(lower)) return "skill";
  if (/(technolog|tech|framework|stack|langage)/.test(lower)) return "technology";
  if (/(service|prestation|offre|mission)/.test(lower)) return "service";
  if (/(timeline|parcours|expérience|cv|historique)/.test(lower)) return "timeline";
  if (/(réseau|social|linkedin|instagram|github|twitter|x)/.test(lower)) return "social";

  return null;
};

const extractProposalTitle = (text: string) => {
  const patterns = [
    /(?:titre|title)\s*[:=]\s*["'`]?([^\n"'`]+)["'`]?/i,
    /(?:crée|ajoute|propose|génère|rédige)\s+(?:un|une|des)?\s*([^\n.!?]{2,80})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].trim().replace(/[.!?]+$/, "");
      if (cleaned.length > 2 && cleaned.length < 80) return cleaned;
    }
  }

  return "Nouvelle proposition IA";
};

const buildFallbackProposal = (messages: any[]) => {
  const lastUserMessage = [...messages].reverse().find((m) => m?.role === "user")?.content;
  if (typeof lastUserMessage !== "string" || !lastUserMessage.trim()) return null;

  const type = inferProposalType(lastUserMessage);
  if (!type) return null;

  return {
    action: "PROPOSE_CREATE",
    type,
    title: extractProposalTitle(lastUserMessage),
    data: {
      description: lastUserMessage,
      source: "fallback_auto_proposal",
    },
  };
};

router.post("/chat", requireAdmin, async (req: any, res: any, next: any) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array required" });
      return;
    }

    const settings = await getSingleton("admin_settings");

    // Default model/provider resolution
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

    // Simplified context to avoid token limits
    const simplifiedContext = allItems.map(i => ({ id: i.id, type: i.type, title: i.title, data: i.data }));
    const contextStr = `Données du portfolio actuel : ${JSON.stringify(simplifiedContext)}`;

    const sysPrompt = String(settings.system_prompt || "Tu es l'assistant de Landry. Tu as accès à son portfolio via des outils.");
    const seoRules = String(settings.seo_rules || "");
    const finalSystem = `${sysPrompt}

RÈGLES IMPORTANTES :
1. N'ajoute PAS le contenu directement dans la base de données.
2. Utilise toujours l'outil 'proposeContent' pour proposer une création à l'utilisateur.
3. Il verra un bouton "Valider" dans son chat pour approuver et publier.

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
        proposeContent: tool({
          description: "Proposer la création d'un nouveau contenu. L'utilisateur aura un bouton pour valider.",
          parameters: z.object({
            type: z.enum(["project", "skill", "technology", "service", "timeline", "social"]),
            title: z.string(),
            data: z.record(z.any()),
          }),
          execute: async (args) => {
            return { action: "PROPOSE_CREATE", ...args };
          }
        }),
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
          }
        })
      }
    });

    let finalText = text;
    const proposals: any[] = [];

    // If we have tool calls, parse them out
    const toolResults: string[] = [];
    for (const step of steps) {
      for (const part of (step.toolResults ?? []) as any[]) {
        const r = part?.result;
        if (r !== undefined && r !== null) {
          if (typeof r === "object" && r.action === "PROPOSE_CREATE") {
            proposals.push(r);
            toolResults.push(`Voici ma proposition pour : ${r.title}. Vous pouvez valider ci-dessous.`);
          } else {
            toolResults.push(typeof r === "string" ? r : JSON.stringify(r));
          }
        }
      }
    }

    const fallbackProposal = proposals.length === 0 ? buildFallbackProposal(messages) : null;
    if (fallbackProposal) {
      proposals.push(fallbackProposal);
      toolResults.push(`Voici ma proposition pour : ${fallbackProposal.title}. Vous pouvez valider ci-dessous.`);
    }

    if (!finalText && toolResults.length > 0) {
      finalText = toolResults.join("\n");
    } else if (!finalText) {
      finalText = "Traitement terminé.";
    }

    res.json({
      message: { role: "assistant", text: finalText },
      proposals,
      steps
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur inconnue de l'IA" });
  }
});

export default router;
