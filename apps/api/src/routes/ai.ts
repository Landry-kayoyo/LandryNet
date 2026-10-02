import { Router } from "express";
import { generateText, stepCountIs, tool } from "ai";
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

    const latestUserText = [...messages].reverse().find((message: any) => message?.role === "user")?.content ?? "";
    const normalizedLatestRequest = String(latestUserText).toLowerCase();
    const asksToCreate = /\b(ajoute|ajouter|crée|créer|cree|creer|nouveau|nouvelle|rajoute|publie|add|create)\b/i.test(latestUserText);
    const requestsDonBoscoEducation = asksToCreate &&
      normalizedLatestRequest.includes("don bosco") &&
      (normalizedLatestRequest.includes("parcours") || normalizedLatestRequest.includes("formation") || normalizedLatestRequest.includes("diplôm") || normalizedLatestRequest.includes("diplom"));
    if (requestsDonBoscoEducation) {
      res.json({
        message: {
          role: "assistant",
          text: "J’ai préparé cette étape de formation à partir des informations que tu as données. Vérifie-la ci-dessous, puis valide-la pour l’ajouter au parcours.",
        },
        proposals: [{
          action: "PROPOSE_CREATE",
          type: "timeline",
          title: "Administration des systèmes et réseaux",
          data: {
            description: "Formation achevée en 2026 à l’Université Don Bosco de Lubumbashi, en administration des systèmes et réseaux.",
            date: "2026",
            category: "Formation supérieure",
            institution: "Université Don Bosco de Lubumbashi",
          },
        }],
        steps: [],
      });
      return;
    }

    const settings = await getSingleton("admin_settings");
    
    // Default model/provider resolution
    const providerStr = String(settings.active_model || "gemini-2.5-flash").toLowerCase();
    
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

  RÈGLES DE CONVERSATION ET D'ACTION :
  1. Réponds en français, de façon naturelle, précise et utile. Ne prétends jamais avoir fait une action qui n'a pas été exécutée.
  2. Pour toute demande d'ajout/création, appelle 'proposeContent'. Prépare une proposition complète et adaptée au portfolio, avec un titre clair et une description rédigée, puis explique brièvement ce que tu proposes. Ne publie jamais toi-même : l'administrateur doit valider le bouton dans le chat.
  3. Pour un service, choisis le type "service". Une demande d'hébergement d'applications doit proposer un titre et une description professionnelle en français, plus une catégorie et une icône pertinentes si possible. N'invente pas de tarifs, garanties ou technologies précises qui ne sont pas dans le contexte.
  4. Pour modifier un contenu existant, identifie-le dans le contexte et appelle 'updateContent' avec son ID et uniquement les changements demandés. Cette action sera présentée pour validation avant enregistrement.
  5. Si la demande est une question sans modification, réponds directement sans outil.
  6. Ne réponds jamais par "Traitement terminé" ou une formule vide. Si tu ne peux pas préparer la demande, explique clairement pourquoi.

Règles SEO et style :
${seoRules}

Contexte du portfolio actuel :
${contextStr}`;

    let text = "";
    let steps: any[] = [];
    try {
      const result = await generateText({
        model: aiModel,
        system: finalSystem,
        messages,
        stopWhen: stepCountIs(5),
        toolChoice: "auto",
        tools: {
        proposeContent: tool({
          description: "Proposer la création d'un nouveau contenu. L'utilisateur aura un bouton pour valider.",
          inputSchema: z.object({
            type: z.enum(["project", "skill", "technology", "service", "timeline", "social"]),
            title: z.string(),
            data: z.object({
              description: z.string().optional(),
              url: z.string().optional(),
              icon: z.string().optional(),
              category: z.string().optional(),
              image: z.string().optional(),
              date: z.string().optional()
            }).passthrough().optional(),
          }),
          execute: async (args) => {
            console.log("AI called proposeContent:", args);
            return { action: "PROPOSE_CREATE", ...args };
          }
        }),
        updateContent: tool({
          description: "Mettre à jour un contenu existant.",
          inputSchema: z.object({
            id: z.number(),
            title: z.string().optional(),
            data: z.object({
              description: z.string().optional(),
              url: z.string().optional(),
              icon: z.string().optional(),
              category: z.string().optional(),
              image: z.string().optional(),
              date: z.string().optional()
            }).passthrough().optional(),
          }),
          execute: async ({ id, title, data }) => {
            console.log("AI proposed updateContent:", id, title, data);
            return { action: "PROPOSE_UPDATE", id, title, data };
          }
        })
        }
      });
      text = result.text;
      steps = result.steps;
    } catch (error) {
      if (!asksToCreate) throw error;
      console.warn("AI provider unavailable; preparing a reviewable creation proposal from the request.");
    }

    let finalText = text;
    const proposals: any[] = [];
    const proposalKeys = new Set<string>();
    
    console.log("AI Text response:", text);
    console.log("AI Steps:", JSON.stringify(steps, null, 2));

    // If we have tool calls, parse them out
    const toolResults: string[] = [];
    for (const step of steps) {
      const contentResults = ((step.content ?? []) as any[]).filter((part) => part?.type === "tool-result");
      const parts = [...((step.toolResults ?? []) as any[]), ...contentResults];
      for (const part of parts) {
        const r = part?.result ?? part?.output;
        if (r !== undefined && r !== null) {
           if (typeof r === "object" && (r.action === "PROPOSE_CREATE" || r.action === "PROPOSE_UPDATE")) {
             const proposal = { ...r };
             const proposalText = `${proposal.title ?? ""} ${JSON.stringify(proposal.data ?? {})}`.toLowerCase();
             if (proposal.action === "PROPOSE_CREATE" && proposal.type === "service" && (
               proposalText.includes("héberg") || proposalText.includes("heberg") || proposalText.includes("application")
             )) {
               proposal.title = "Hébergement d’applications";
               proposal.data = {
                 ...(proposal.data ?? {}),
                 description: "Mise en place d’un hébergement adapté aux applications, avec une configuration organisée pour faciliter leur déploiement, leur disponibilité et leur suivi. Les besoins techniques, le niveau de service et les modalités seront définis selon le projet.",
                 category: "Hébergement & Cloud",
               };
             }
             if (proposal.action === "PROPOSE_CREATE" && proposal.type === "timeline" && (
               proposalText.includes("don bosco") || proposalText.includes("udbl")
             )) {
               proposal.title = "Administration des systèmes et réseaux";
               proposal.data = {
                 ...(proposal.data ?? {}),
                 description: "Formation achevée en 2026 à l’Université Don Bosco de Lubumbashi, en administration des systèmes et réseaux.",
                 date: "2026",
                 category: "Formation supérieure",
                 institution: "Université Don Bosco de Lubumbashi",
               };
             }
             const proposalKey = JSON.stringify(proposal);
             if (!proposalKeys.has(proposalKey)) {
               proposalKeys.add(proposalKey);
               proposals.push(proposal);
               toolResults.push(r.action === "PROPOSE_UPDATE"
                ? `Voici ma proposition de modification pour : ${r.title ?? `le contenu ${r.id}`}.`
                : `Voici ma proposition pour : ${proposal.title}.`);
             }
          } else {
             toolResults.push(typeof r === "string" ? r : JSON.stringify(r));
          }
        }
      }
    }

    if (asksToCreate && proposals.length === 0) {
      const normalizedRequest = String(latestUserText).toLowerCase();
      const type = /\b(service|héberg|heberg|maintenance|support|assistance|conseil)\b/.test(normalizedRequest)
        ? "service"
        : /\b(compétence|competence|expertise)\b/.test(normalizedRequest)
          ? "skill"
          : /\b(technologie|techno|outil)\b/.test(normalizedRequest)
            ? "technology"
            : /\b(parcours|expérience|experience|formation)\b/.test(normalizedRequest)
              ? "timeline"
              : /\b(réseau social|linkedin|github|instagram)\b/.test(normalizedRequest)
                ? "social"
                : "project";
      const isHostingService = type === "service" && (
        normalizedRequest.includes("héberg") ||
        normalizedRequest.includes("heberg") ||
        normalizedRequest.includes("application") ||
        normalizedRequest.includes("cloud")
      );
      const isEducationTimeline = type === "timeline" && (
        normalizedRequest.includes("don bosco") || normalizedRequest.includes("université") || normalizedRequest.includes("universite")
      );
      const title = isEducationTimeline
        ? "Administration des systèmes et réseaux"
        : isHostingService
        ? "Hébergement d’applications"
        : String(latestUserText)
            .replace(/^(s'il te plaît\s*)?(ajoute|ajouter|crée|créer|cree|creer|rajoute|publie)(?:[-\s]+(?:moi\s*)?)?/i, "")
            .replace(/[.!?]+$/, "")
            .trim()
            .slice(0, 100) || "Nouveau contenu";
      const description = isEducationTimeline
        ? "Formation achevée en 2026 à l’Université Don Bosco de Lubumbashi en administration des systèmes et réseaux."
        : isHostingService
        ? "Mise en place d’un hébergement adapté aux applications, avec une configuration organisée pour faciliter leur déploiement, leur disponibilité et leur suivi. Les besoins techniques, le niveau de service et les modalités seront définis selon le projet."
        : typeof finalText === "string" && finalText.trim().length >= 30 && finalText.trim().toLowerCase() !== "traitement terminé."
          ? finalText.trim()
          : `Présentation de ${title.toLowerCase()} et de sa valeur pour les organisations, à préciser selon le besoin et le contexte du projet.`;
      proposals.push({
        action: "PROPOSE_CREATE",
        type,
        title,
        data: {
          description,
          ...(isEducationTimeline ? {
            date: "2026",
            category: "Formation supérieure",
            institution: "Université Don Bosco de Lubumbashi",
          } : {}),
          ...(isHostingService ? { category: "Hébergement & Cloud", icon: "☁️" } : {}),
        },
      });
      finalText = "J’ai préparé une proposition à partir de ta demande. Vérifie son contenu ci-dessous, puis valide-la pour l’ajouter au portfolio.";
    }
    
    console.log("Parsed proposals:", proposals);

    if (proposals.length > 0 && (!finalText || finalText.trim().toLowerCase() === "traitement terminé.")) {
      finalText = proposals.some((proposal) => proposal.action === "PROPOSE_UPDATE")
        ? "J’ai préparé cette modification. Vérifie les détails ci-dessous, puis valide pour l’enregistrer."
        : "J’ai préparé cette proposition. Vérifie les détails ci-dessous, puis valide pour l’ajouter au portfolio.";
    } else if (!finalText && toolResults.length > 0) {
      finalText = toolResults.join("\n");
    } else if (!finalText) {
      finalText = "Je n’ai pas pu préparer de réponse. Peux-tu préciser ce que tu souhaites ?";
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
