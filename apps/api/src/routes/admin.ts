import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import {
  createAdminSession,
  createAdminUser,
  createCmsItem,
  db,
  deleteAdminSession,
  deleteCmsItem,
  deleteContactMessage,
  getAdminSession,
  getAdminUser,
  listCmsItems,
  listContactMessages,
  markContactMessageRead,
  updateCmsItem,
  updateSingleton,
} from "@workspace/db";

const scrypt = promisify(scryptCallback);
const router = Router();
const SESSION_COOKIE = "landry_admin_session";
const SESSION_DAYS = 7;
const uploadDirectory = process.env.VERCEL ? "/tmp/uploads" : resolve(process.cwd(), "uploads");

void ensureConfiguredAdminUser();
mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function ensureConfiguredAdminUser() {
  const configuredEmail = (process.env.ADMIN_EMAIL ?? "admin@localhost").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD ?? "landry-local-change-me";
  if (!configuredEmail || !configuredPassword) return;

  const existing = await getAdminUser(configuredEmail);
  if (existing) return;

  const passwordHash = await hashPassword(configuredPassword);
  await createAdminUser(configuredEmail, passwordHash);
}

function readSession(req: any) {
  const cookie = req.headers.cookie?.split(";").map((item: string) => item.trim()).find((item: string) => item.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(`${SESSION_COOKIE}=`.length);
}

async function requireAdmin(req: any, res: any, next: any) {
  const token = readSession(req);
  try {
    if (!db) {
      res.status(503).json({ error: "La base de données n’est pas disponible pour l’authentification." });
      return;
    }

    const session = token ? await getAdminSession(tokenHash(token)) : null;
    if (!session) {
      res.status(401).json({ error: "Authentification administrateur requise." });
      return;
    }
    res.locals.adminUserId = session.userId;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    res.status(503).json({ error: `Service d’authentification indisponible: ${message}` });
  }
}

router.post("/login", async (req: any, res: any, next: any) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const configuredEmail = (process.env.ADMIN_EMAIL ?? "admin@localhost").toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD ?? "landry-local-change-me";
    const hasConfiguredAdminCredentials = Boolean(process.env.ADMIN_EMAIL?.trim()) && Boolean(process.env.ADMIN_PASSWORD?.trim());
    if (!email || !password || email.length > 160 || password.length > 200) {
      res.status(400).json({ error: "E-mail et mot de passe requis." });
      return;
    }

    let user: { id: number; email: string; passwordHash: string } | null = null;

    const configuredUser = await getAdminUser(configuredEmail);
    if (!configuredUser && hasConfiguredAdminCredentials && email === configuredEmail && password === configuredPassword) {
      const passwordHash = await hashPassword(password);
      const id = await createAdminUser(configuredEmail, passwordHash);
      user = { id, email: configuredEmail, passwordHash };
    } else {
      const userCandidate = await getAdminUser(email);
      if (userCandidate) {
        user = userCandidate;
      } else if (!hasConfiguredAdminCredentials) {
        const passwordHash = await hashPassword(password);
        const id = await createAdminUser(email, passwordHash);
        user = { id, email, passwordHash };
      }
    }

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Identifiants invalides." });
      return;
    }

    const token = randomBytes(32).toString("hex");
    await createAdminSession(tokenHash(token), user.id, Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000, path: "/" });
    res.json({ email: user.email });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req: any, res: any, next: any) => {
  const token = readSession(req);
  try {
    if (token) await deleteAdminSession(tokenHash(token));
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get("/session", requireAdmin, (_req: any, res: any) => res.json({ authenticated: true }));

router.post("/upload", requireAdmin, upload.single("file"), async (req: any, res: any, next: any) => {
  if (!req.file) {
    res.status(400).json({ error: "Une image valide est requise." });
    return;
  }

  try {
    const originalPath = resolve(uploadDirectory, req.file.filename);
    const optimizedName = `${req.file.filename}.webp`;
    const optimizedPath = resolve(uploadDirectory, optimizedName);

    await sharp(originalPath)
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 74, effort: 6 })
      .toFile(optimizedPath);

    unlinkSync(originalPath);

    res.status(201).json({ url: `${req.protocol}://${req.get("host")}/api/uploads/${optimizedName}` });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", requireAdmin, async (_req: any, res: any, next: any) => {
 try {
  const items = await listCmsItems(undefined, true);
  const messages = await listContactMessages();
  const evolution = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return { date: date.toISOString().slice(0, 7), label: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""), contents: 0, messages: 0 };
  });
  for (const item of items) {
    const month = item.createdAt.slice(0, 7);
    const point = evolution.find((entry) => entry.date === month);
    if (point) point.contents += 1;
  }
  for (const message of messages) {
    const month = String(message.created_at).slice(0, 7);
    const point = evolution.find((entry) => entry.date === month);
    if (point) point.messages += 1;
  }
  res.json({
    counts: {
      projects: items.filter((item) => item.type === "project").length,
      skills: items.filter((item) => item.type === "skill").length,
      technologies: items.filter((item) => item.type === "technology").length,
      timeline: items.filter((item) => item.type === "timeline").length,
      messages: messages.length,
      unreadMessages: messages.filter((message) => !message.is_read).length,
      evolution,
    },
    recentMessages: messages.slice(0, 5),
  });
 } catch (error) { next(error); }
});

router.post("/demo-data", requireAdmin, async (_req: any, res: any, next: any) => {
 try {
  const demoItems = [
    { type: "project" as const, title: "[TEST] Continuité de service", data: { description: "Une base de continuité pour absorber les pannes sans perdre le fil opérationnel.", context: "Les services essentiels devaient rester disponibles malgré les incidents matériels.", details: "Identification des dépendances, stratégie de reprise et tests réguliers des scénarios de panne.", technologies: "Windows Server · WSFC · Storage Replica · Docker", category: "Infrastructure" } },
    { type: "project" as const, title: "[TEST] Automatisation système", data: { description: "Des scripts et interfaces pour supprimer les gestes répétitifs de l’exploitation.", context: "Les opérations quotidiennes reposaient encore sur des interventions manuelles et variables.", details: "Standardisation des tâches, contrôles avant exécution et journalisation des résultats.", technologies: "PowerShell · Bash · Node.js · REST API", category: "Automation" } },
    { type: "project" as const, title: "[TEST] Segmentation réseau", data: { description: "Une topologie réseau plus lisible, segmentée et simple à faire évoluer.", context: "La croissance des usages rendait les flux difficiles à comprendre et à sécuriser.", details: "Séparation des zones, clarification des règles d’accès et documentation des chemins critiques.", technologies: "TCP/IP · VLAN · Firewall · VPN", category: "Réseau" } },
    { type: "project" as const, title: "[TEST] Supervision d’infrastructure", data: { description: "Un tableau de supervision pour repérer les signaux importants avant l’incident.", context: "Les informations existaient mais restaient dispersées entre plusieurs outils et journaux.", details: "Création de métriques utiles, seuils lisibles et procédures de réaction associées.", technologies: "Prometheus · Grafana · Zabbix", category: "Observabilité" } },
    { type: "project" as const, title: "[TEST] Pilotage et reporting", data: { description: "Un espace de pilotage pour transformer les données techniques en décisions lisibles.", context: "Les indicateurs d’exploitation étaient difficiles à comparer et à partager.", details: "Structuration des indicateurs, synthèse périodique et suivi des actions prioritaires.", technologies: "React · TypeScript · SQLite · REST API", category: "Pilotage" } },
    { type: "skill" as const, title: "[TEST] Architecture système", data: { description: "Exemple temporaire pour tester le CMS.", category: "Systèmes" } },
    { type: "skill" as const, title: "[TEST] Sécurité et durcissement", data: { description: "Exemple temporaire pour tester le CMS.", category: "Sécurité" } },
    { type: "skill" as const, title: "[TEST] Réseau et segmentation", data: { description: "Exemple temporaire pour tester le CMS.", category: "Réseau" } },
    { type: "skill" as const, title: "[TEST] Observabilité et support", data: { description: "Exemple temporaire pour tester le CMS.", category: "Observabilité" } },
    { type: "skill" as const, title: "[TEST] Automatisation et scripts", data: { description: "Exemple temporaire pour tester le CMS.", category: "Automatisation" } },
    { type: "technology" as const, title: "[TEST] Windows Server", data: { description: "Exemple temporaire pour tester le CMS.", category: "Systèmes" } },
    { type: "technology" as const, title: "[TEST] Ubuntu / Linux", data: { description: "Exemple temporaire pour tester le CMS.", category: "Systèmes" } },
    { type: "technology" as const, title: "[TEST] FortiGate / Palo Alto", data: { description: "Exemple temporaire pour tester le CMS.", category: "Sécurité" } },
    { type: "technology" as const, title: "[TEST] VLAN / VPN / Routing", data: { description: "Exemple temporaire pour tester le CMS.", category: "Réseau" } },
    { type: "technology" as const, title: "[TEST] Prometheus / Grafana", data: { description: "Exemple temporaire pour tester le CMS.", category: "Observabilité" } },
    { type: "technology" as const, title: "[TEST] Zabbix / Nagios", data: { description: "Exemple temporaire pour tester le CMS.", category: "Monitoring" } },
    { type: "technology" as const, title: "[TEST] PowerShell / Bash", data: { description: "Exemple temporaire pour tester le CMS.", category: "Automatisation" } },
    { type: "technology" as const, title: "[TEST] Docker / Compose", data: { description: "Exemple temporaire pour tester le CMS.", category: "Virtualisation" } },
    { type: "social" as const, title: "[TEST] LinkedIn", data: { url: "https://www.linkedin.com/", icon: "linkedin" } },
    { type: "social" as const, title: "[TEST] GitHub", data: { url: "https://github.com/", icon: "github" } },
    { type: "social" as const, title: "[TEST] Instagram", data: { url: "https://www.instagram.com/", icon: "instagram" } },
    { type: "social" as const, title: "[TEST] Site web", data: { url: "https://landrynet.dev/", icon: "website" } },
    { type: "timeline" as const, title: "[TEST] Étape de parcours", data: { description: "Exemple temporaire pour tester la timeline.", category: "Parcours" } },
  ];
  const existing = (await listCmsItems(undefined, true)).filter((item) => item.title.startsWith("[TEST]"));
  const existingTitles = new Set(existing.map((item) => item.title));
  const missing = demoItems.filter((item) => !existingTitles.has(item.title));
  await Promise.all(demoItems.map(async (item) => {
    const current = existing.find((candidate) => candidate.title === item.title);
    if (current) await updateCmsItem(current.id, { data: item.data, published: true, visible: true });
  }));
  await Promise.all(missing.map((item, index) => createCmsItem({ ...item, sortOrder: existing.length + index })));
  res.status(missing.length > 0 ? 201 : 200).json({ created: missing.length, existing: existing.length });
 } catch (error) { next(error); }
});

router.get("/items", requireAdmin, async (req: any, res: any, next: any) => {
 try {
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  res.json(await listCmsItems(type as Parameters<typeof listCmsItems>[0], true));
 } catch (error) { next(error); }
});

router.post("/items", requireAdmin, async (req: any, res: any, next: any) => {
  try {
    const { type, title, data, published, visible, sortOrder } = req.body ?? {};
    if (!type || !title || typeof title !== "string" || typeof data !== "object") {
      res.status(400).json({ error: "Type, titre et données valides requis." });
      return;
    }
    const id = await createCmsItem({ type, title: title.trim(), data, published, visible, sortOrder });
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

router.patch("/items/:id", requireAdmin, async (req: any, res: any, next: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || !(await updateCmsItem(id, req.body ?? {}))) {
      res.status(404).json({ error: "Contenu introuvable." });
      return;
    }
    res.json({ status: "updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/items/:id", requireAdmin, async (req: any, res: any, next: any) => {
 try {
  const deleted = await deleteCmsItem(Number(req.params.id));
  res.status(deleted ? 204 : 404).end();
 } catch (error) { next(error); }
});

router.put("/profile", requireAdmin, async (req: any, res: any, next: any) => { try { await updateSingleton("site_profile", req.body ?? {}); res.json({ status: "updated" }); } catch (error) { next(error); } });
router.put("/settings", requireAdmin, async (req: any, res: any, next: any) => { try { await updateSingleton("site_settings", req.body ?? {}); res.json({ status: "updated" }); } catch (error) { next(error); } });

router.get("/messages", requireAdmin, async (req: any, res: any, next: any) => {
 try {
  const query = typeof req.query.q === "string" ? req.query.q.toLowerCase() : "";
  const unreadOnly = req.query.unread === "true";
  const messages = (await listContactMessages(!unreadOnly)).filter((message) => !query || [message.name, message.email, message.subject, message.message].some((value) => String(value).toLowerCase().includes(query)));
  res.json(messages);
 } catch (error) { next(error); }
});

router.patch("/messages/:id/read", requireAdmin, async (req: any, res: any, next: any) => {
 try {
  const updated = await markContactMessageRead(Number(req.params.id), req.body?.isRead !== false);
  res.status(updated ? 200 : 404).json({ status: updated ? "updated" : "not-found" });
 } catch (error) { next(error); }
});

router.delete("/messages/:id", requireAdmin, async (req: any, res: any, next: any) => {
 try {
  const deleted = await deleteContactMessage(Number(req.params.id));
  res.status(deleted ? 204 : 404).end();
 } catch (error) { next(error); }
});

export default router;