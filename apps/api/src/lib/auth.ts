import { createHash } from "node:crypto";
import { getAdminSession, db } from "@workspace/db";

const SESSION_COOKIE = "landry_admin_session";

export function readSessionToken(req: any): string | undefined {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((item: string) => item.trim())
    .find((item: string) => item.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(`${SESSION_COOKIE}=`.length);
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireAdmin(req: any, res: any, next: any) {
  const token = readSessionToken(req);
  try {
    if (!db) {
      res.status(503).json({ error: "La base de données n'est pas disponible." });
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
    res.status(503).json({ error: `Service d'authentification indisponible: ${message}` });
  }
}
