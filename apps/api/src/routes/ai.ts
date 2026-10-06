import { Router } from "express";
import { generateText, stepCountIs, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getSingleton, listCmsItems, createCmsItem, updateCmsItem } from "@workspace/db";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

const CREATE_INTENT_RE = /\b(ajoute|ajouter|crée|créer|cree|creer|nouveau|nouvelle|rajoute|publie|add|create)\b/i;
const CLARIFICATION_RE = /\b(?:quel(?:le|s|les)?\s+(?:est|serait|sera)|peux-tu préciser|peux-tu décrire|donner une brève description|indiquer le sujet|précise(?:r)?\s+(?:le|la|les))\b/i;
const GENERIC_REQUEST_WORDS = new Set([
  "a", "alors", "avec", "ce", "cela", "de", "des", "du", "en", "et", "faire", "fais", "fait", "je", "la", "le", "les", "ma", "me", "moi", "mon", "ne", "nous", "on", "ou", "par", "pour", "qu", "que", "quel", "quelle", "quels", "quelles", "qui", "sa", "se", "son", "sur", "te", "un", "une", "vous", "votre", "vos", "y",
  "ajoute", "ajouter", "cree", "creer", "nouveau", "nouvelle", "publie", "rajoute", "create", "add", "projet", "projets", "contenu", "service", "services", "competence", "competences", "technologie", "technologies", "outil", "outils", "parcours", "formation", "formations", "social", "reseau", "publication",
]);

function meaningfulCreationTerms(value: unknown): string[] {
  const normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (normalized.match(/[a-z0-9]+/g) ?? []).filter(
    (word) => !GENERIC_REQUEST_WORDS.has(word),
  );
}

function toPlainText(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/```[\w-]*\s*([\s\S]*?)```/g, "$1")
      .replace(/\*\*|__|~~|[*_`]/g, "")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^\s*>\s?/gm, "")
      .trim();
  }
  if (Array.isArray(value)) return value.map(toPlainText);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toPlainText(item)]),
    );
  }
  return value;
}

router.post("/chat", requireAdmin, async (req: any, res: any, next: any) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array required" });
      return;
    }

    let latestUserIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "user") {
        latestUserIndex = index;
        break;
      }
    }
    const latestUserText = latestUserIndex >= 0 ? String(messages[latestUserIndex]?.content ?? "") : "";
    const normalizedLatestRequest = String(latestUserText).toLowerCase();
    const latestPriorAssistant = latestUserIndex > 0 ? messages[latestUserIndex - 1] : null;
    const previousUserMessage = latestUserIndex > 1
      ? [...messages.slice(0, latestUserIndex - 1)].reverse().find((message: any) => message?.role === "user")
      : null;
    const isAnsweringCreationClarification =
      latestPriorAssistant?.role === "assistant" &&
      CLARIFICATION_RE.test(String(latestPriorAssistant.content ?? "")) &&
      CREATE_INTENT_RE.test(String(previousUserMessage?.content ?? ""));
    const asksToCreate = CREATE_INTENT_RE.test(latestUserText) || isAnsweringCreationClarification;
    const requestsDonBoscoEducation = asksToCreate &&
      normalizedLatestRequest.includes("don bosco") &&
      (normalizedLatestRequest.includes("parcours") || normalizedLatestRequest.includes("formation") || normalizedLatestRequest.includes("diplôm") || normalizedLatestRequest.includes("diplom"));

    if (asksToCreate && !requestsDonBoscoEducation && meaningfulCreationTerms(latestUserText).length < 3) {
      res.json({
        message: {
          role: "assistant",
          text: toPlainText(isAnsweringCreationClarification
            ? "Il me manque encore quelques éléments pour rédiger une proposition utile. Peux-tu préciser le sujet du projet, son objectif et ce que tu as réalisé ou souhaites réaliser ?"
            : "Bien sûr. Pour préparer un projet pertinent, indique son sujet ou son titre, son objectif et quelques détails sur sa réalisation (contexte, résultat ou technologies). Je ne le publierai qu’après t’avoir montré une proposition complète."),
        },
        proposals: [],
        steps: [],
      });
      return;
    }

    if (requestsDonBoscoEducation) {
      res.json({
        message: {
          role: "assistant",
          text: toPlainText("J’ai préparé cette étape de formation à partir des informations que tu as données. Vérifie-la ci-dessous, puis valide-la pour l’ajouter au parcours."),
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
  2. Pour toute demande d'ajout/création, vérifie d'abord que l'utilisateur a donné un sujet identifiable et assez de détails pour rédiger un contenu fidèle. Si des informations essentielles manquent, pose une question courte et ciblée et n'appelle aucun outil de proposition. Ne déduis pas les réalisations, technologies ou résultats à sa place. Quand il répond à une question de clarification, tiens compte de l'intention exprimée plus tôt dans la conversation. Une fois les détails suffisants, appelle 'proposeContent' avec une proposition complète et adaptée au portfolio. Pour les projets, place le problème, l'objectif et le contexte fournis par l'utilisateur dans 'context'; place la solution, la réalisation et les résultats explicitement donnés dans 'details'; renseigne 'technologies' uniquement avec les outils cités. Rédige description, contexte, détails et réponse en texte simple : aucun Markdown, aucun astérisque, aucune emphase ni titre Markdown. Ne publie jamais toi-même : l'administrateur doit valider le bouton dans le chat.
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
            type: z.enum(["project", "skill", "technology", "service", "timeline", "social", "certification"]),
            title: z.string(),
            data: z.object({
              description: z.string().optional(),
              url: z.string().optional(),
              icon: z.string().optional(),
              category: z.string().optional(),
              image: z.string().optional(),
              date: z.string().optional(),
              context: z.string().optional(),
              details: z.string().optional(),
              technologies: z.union([z.string(), z.array(z.string())]).optional(),
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
              date: z.string().optional(),
              context: z.string().optional(),
              details: z.string().optional(),
              technologies: z.union([z.string(), z.array(z.string())]).optional(),
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

    let finalText = typeof toPlainText(text) === "string" ? toPlainText(text) as string : text;
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
             const proposal = toPlainText({ ...r }) as Record<string, any>;
             if (proposal.action === "PROPOSE_CREATE" && proposal.type === "project") {
               const suppliedDetails = messages
                 .filter((message: any, index: number) => message?.role === "user" && index !== 0)
                 .map((message: any) => String(message.content ?? "").trim())
                 .filter(Boolean)
                 .join(" ");
               if (suppliedDetails) {
                 proposal.data = { ...(proposal.data ?? {}) };
                 proposal.data.context = suppliedDetails;
                 if (!String(proposal.data.details ?? "").trim()) proposal.data.details = suppliedDetails;
                 const statedTechs = ["PowerShell", "API REST", "Windows Server", "Linux", "Ubuntu", "Debian", "Docker", "Kubernetes", "Python", "Node.js", "React", "TypeScript", "PostgreSQL", "MySQL", "SQL Server", "Prometheus", "Grafana", "Zabbix", "Ansible", "Terraform", "VMware", "Hyper-V", "FortiGate", "Cisco", "VLAN", "VPN", "Bash"]
                   .filter((technology) => suppliedDetails.toLowerCase().includes(technology.toLowerCase()));
                 proposal.data.technologies = statedTechs;
               }
             }
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

    const assistantIsAskingForDetails = /\?|peux-tu me donner|peux-tu preciser|pourrais-tu preciser|quel est le probleme|quel est l'objectif/i.test(
      String(finalText ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    );
    if (asksToCreate && proposals.length === 0 && assistantIsAskingForDetails) {
      res.json({
        message: {
          role: "assistant",
          text: String(finalText).trim(),
        },
        proposals: [],
        steps,
      });
      return;
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
      message: { role: "assistant", text: toPlainText(finalText) },
      proposals,
      steps
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur inconnue de l'IA" });
  }
});

export default router;
