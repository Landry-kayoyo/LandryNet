import express from "express";
import cors from "cors";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pinoHttp } from "pino-http";
import { db } from "@workspace/db";
import { getPublicCmsData } from "@workspace/db";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const uploadsDir = process.env.VERCEL ? "/tmp/uploads" : resolve(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });

const SITE_URL = process.env.VITE_SITE_URL || "https://landrynet.vercel.app";

// User-agents of known social media crawlers
const BOT_UA_RE =
  /facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|telegrambot|slackbot|discordbot|pinterest|vkShare|W3C_Validator|Googlebot|bingbot|DuckDuckBot/i;

const STATIC_OG: Record<string, { title: string; description: string; image: string }> = {
  "/": {
    title: "Landry Kayoyo | Administrateur systèmes et réseaux",
    description:
      "Portfolio de Landry Kayoyo, administrateur systèmes et réseaux, infrastructure IT, sécurité et monitoring.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
  "/a-propos": {
    title: "À propos | Landry Kayoyo",
    description:
      "Découvrez le profil de Landry Kayoyo : infrastructure IT, systèmes, réseaux et sécurité informatique.",
    image: `${SITE_URL}/og-about.jpg`,
  },
  "/services": {
    title: "Services | Landry Kayoyo",
    description:
      "Les services proposés par Landry Kayoyo : administration systèmes, réseaux, monitoring et sécurité.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
  "/projets": {
    title: "Publications & Projets | Landry Kayoyo",
    description:
      "Consultez les projets et réalisations de Landry Kayoyo.",
    image: `${SITE_URL}/og-cover.jpg`,
  },
};

function buildOgHtml(meta: { title: string; description: string; image: string; url: string }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Landry Net" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:url" content="${meta.url}" />
  <meta property="og:image" content="${meta.image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="twitter:image" content="${meta.image}" />
</head>
<body></body>
</html>`;
}

async function resolveOgMeta(path: string): Promise<{ title: string; description: string; image: string }> {
  if (STATIC_OG[path]) return STATIC_OG[path];

  const pubMatch = path.match(/^\/publication\/(.+)$/);
  if (pubMatch) {
    try {
      const data = await getPublicCmsData();
      const project = (data as any).projects?.find((p: any) => String(p.id) === String(pubMatch[1]));
      if (project) {
        return {
          title: `${project.title} | Landry Kayoyo`,
          description:
            typeof project.data?.description === "string"
              ? project.data.description
              : "Projet de Landry Kayoyo — infrastructure IT, réseaux et systèmes.",
          image:
            typeof project.data?.coverImage === "string" && project.data.coverImage
              ? project.data.coverImage
              : `${SITE_URL}/og-cover.jpg`,
        };
      }
    } catch (_err) { /* fall through */ }
  }

  return STATIC_OG["/"];
}

const app = express();

// ── Social bot middleware (must come before static/SPA serving) ──────────────
app.use(async (req: any, res: any, next: any) => {
  const ua = req.headers["user-agent"] || "";
  const isBot = BOT_UA_RE.test(ua);
  // Only intercept non-API, non-asset requests from bots
  if (!isBot || req.path.startsWith("/api") || req.path.includes(".")) return next();

  try {
    const meta = await resolveOgMeta(req.path);
    const url = `${SITE_URL}${req.path}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    return res.send(buildOgHtml({ ...meta, url }));
  } catch (err) {
    logger.warn({ err, path: req.path }, "OG bot middleware error");
    return next();
  }
});
// ─────────────────────────────────────────────────────────────────────────────

app.use((req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === "production" && req.path.startsWith("/api/admin")) {
    const start = Date.now();
    res.on("finish", () => {
      if (Date.now() - start > 25000) {
        logger.warn({ path: req.path, ms: Date.now() - start }, "Slow admin request");
      }
    });
  }
  next();
});

app.use(
  pinoHttp({
    logger,
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

export default app;

