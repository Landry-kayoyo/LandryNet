import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

for (const envFile of [".env.vercel.local", ".env.production", ".env.local", ".env"]) {
  try {
    process.loadEnvFile(resolve(repoRoot, envFile));
  } catch {
    // Ignore missing env files; they are optional in production and CI.
  }
}

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "A Postgres connection string is required. Set DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL in your environment."
  );
}

const { Pool } = pg;
const isSslEnabled =
  /sslmode=|channel_binding=/.test(databaseUrl) || process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  statement_timeout: 15000,
  ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
});

export const db = pool;

/** Lazily-resolved schema init promise — resolves once the tables exist. */
const dbReady = Promise.race([
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS admin_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          expires_at BIGINT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cms_items (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          published BOOLEAN NOT NULL DEFAULT TRUE,
          visible BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS site_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS site_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      // Safe migration: widen expires_at to BIGINT if it was created as INT.
      await pool.query(`
        ALTER TABLE IF EXISTS admin_sessions
          ALTER COLUMN expires_at TYPE BIGINT
          USING expires_at::BIGINT;
      `);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Postgres schema init skipped:", message);
    }
  })(),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Postgres init timed out after 8s.")), 8000)
  ),
]).catch((error) => {
  console.warn("Postgres init error:", error instanceof Error ? error.message : String(error));
});

async function getPool() {
  await dbReady;
  return pool;
}

export type CmsContentType = "skill" | "technology" | "project" | "timeline" | "social" | "service";

export type CmsItem = {
  id: number;
  type: CmsContentType;
  title: string;
  data: Record<string, unknown>;
  published: boolean;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function parseCmsItem(row: Record<string, unknown>): CmsItem {
  const rawData = row.data;
  return {
    id: Number(row.id),
    type: row.type as CmsContentType,
    title: String(row.title),
    data:
      typeof rawData === "string"
        ? (JSON.parse(rawData || "{}") as Record<string, unknown>)
        : ((rawData ?? {}) as Record<string, unknown>),
    published: Boolean(row.published),
    visible: Boolean(row.visible),
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAdminUser(email: string) {
  const pg = await getPool();
  const result = await pg.query(
    "SELECT id, email, password_hash FROM admin_users WHERE email = $1",
    [email]
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row
    ? { id: Number(row.id), email: String(row.email), passwordHash: String(row.password_hash) }
    : null;
}

export async function createAdminUser(email: string, passwordHash: string) {
  const pg = await getPool();
  const result = await pg.query(
    "INSERT INTO admin_users (email, password_hash, created_at) VALUES ($1, $2, $3) RETURNING id",
    [email, passwordHash, new Date().toISOString()]
  );
  return Number(result.rows[0].id);
}

export async function createAdminSession(tokenHash: string, userId: number, expiresAt: number) {
  const pg = await getPool();
  await pg.query(
    "INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)",
    [tokenHash, userId, expiresAt, new Date().toISOString()]
  );
}

export async function getAdminSession(tokenHash: string) {
  const pg = await getPool();
  const result = await pg.query(
    "SELECT user_id, expires_at FROM admin_sessions WHERE token_hash = $1",
    [tokenHash]
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row || Number(row.expires_at) <= Date.now()) return null;
  return { userId: Number(row.user_id) };
}

export async function deleteAdminSession(tokenHash: string) {
  const pg = await getPool();
  await pg.query("DELETE FROM admin_sessions WHERE token_hash = $1", [tokenHash]);
}

export async function listCmsItems(type?: CmsContentType, includeHidden = false) {
  const pg = await getPool();
  const visibility = includeHidden ? "" : " AND visible = TRUE AND published = TRUE";
  const result = type
    ? await pg.query(
        `SELECT * FROM cms_items WHERE type = $1${visibility} ORDER BY sort_order ASC, id ASC`,
        [type]
      )
    : await pg.query(
        `SELECT * FROM cms_items WHERE TRUE${visibility} ORDER BY type ASC, sort_order ASC, id ASC`
      );
  return result.rows.map(parseCmsItem);
}

export async function createCmsItem(input: {
  type: CmsContentType;
  title: string;
  data: Record<string, unknown>;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
}) {
  const pg = await getPool();
  const now = new Date().toISOString();
  const result = await pg.query(
    "INSERT INTO cms_items (type, title, data, published, visible, sort_order, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $7) RETURNING id",
    [
      input.type,
      input.title,
      JSON.stringify(input.data),
      input.published !== false,
      input.visible !== false,
      input.sortOrder ?? 0,
      now,
    ]
  );
  return Number(result.rows[0].id);
}

export async function updateCmsItem(
  id: number,
  input: {
    type?: CmsContentType;
    title?: string;
    data?: Record<string, unknown>;
    published?: boolean;
    visible?: boolean;
    sortOrder?: number;
  }
) {
  const pg = await getPool();
  const current = (await pg.query("SELECT * FROM cms_items WHERE id = $1", [id])).rows[0] as
    | Record<string, unknown>
    | undefined;
  if (!current) return false;
  await pg.query(
    "UPDATE cms_items SET type = $1, title = $2, data = $3::jsonb, published = $4, visible = $5, sort_order = $6, updated_at = $7 WHERE id = $8",
    [
      input.type ?? current.type,
      input.title ?? current.title,
      JSON.stringify(input.data ?? current.data),
      input.published ?? current.published,
      input.visible ?? current.visible,
      input.sortOrder ?? current.sort_order,
      new Date().toISOString(),
      id,
    ]
  );
  return true;
}

export async function deleteCmsItem(id: number) {
  const pg = await getPool();
  const result = await pg.query("DELETE FROM cms_items WHERE id = $1", [id]);
  return result.rowCount !== 0;
}

export async function getPublicCmsData() {
  const items = await listCmsItems();
  const isPlaceholderItem = (item: CmsItem) => {
    const title = item.title.trim();
    const category =
      typeof item.data.category === "string" ? item.data.category.trim().toLowerCase() : "";
    return (
      category === "à compléter" ||
      category === "a completer" ||
      category === "à renseigner" ||
      category === "a renseigner" ||
      (title.startsWith("[TEST]") && typeof item.data.description !== "string")
    );
  };
  const publicItems = items.filter((item) => !isPlaceholderItem(item));
  return {
    profile: await getSingleton("site_profile"),
    settings: await getSingleton("site_settings"),
    skills: publicItems.filter((item) => item.type === "skill"),
    technologies: publicItems.filter((item) => item.type === "technology"),
    projects: publicItems.filter((item) => item.type === "project"),
    timeline: publicItems.filter((item) => item.type === "timeline"),
    socials: publicItems.filter((item) => item.type === "social"),
    services: publicItems.filter((item) => item.type === "service"),
  };
}

export async function getSingleton(table: "site_profile" | "site_settings" | "admin_settings") {
  const pg = await getPool();
  const row = (await pg.query(`SELECT data FROM ${table} WHERE id = 1`)).rows[0] as
    | { data: Record<string, unknown> }
    | undefined;
  return row?.data ?? {};
}

export async function updateSingleton(
  table: "site_profile" | "site_settings" | "admin_settings",
  data: Record<string, unknown>
) {
  const pg = await getPool();
  await pg.query(
    `INSERT INTO ${table} (id, data, updated_at) VALUES (1, $1::jsonb, $2)
     ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [JSON.stringify(data), new Date().toISOString()]
  );
}

export async function listContactMessages(includeRead = true) {
  const pg = await getPool();
  const result = await pg.query(
    `SELECT id, name, email, subject, message, created_at, is_read FROM contact_messages${
      includeRead ? "" : " WHERE is_read = FALSE"
    } ORDER BY created_at DESC`
  );
  return result.rows as Record<string, unknown>[];
}

export async function markContactMessageRead(id: number, isRead: boolean) {
  const pg = await getPool();
  const result = await pg.query(
    "UPDATE contact_messages SET is_read = $1 WHERE id = $2",
    [isRead, id]
  );
  return result.rowCount !== 0;
}

export async function deleteContactMessage(id: number) {
  const pg = await getPool();
  const result = await pg.query("DELETE FROM contact_messages WHERE id = $1", [id]);
  return result.rowCount !== 0;
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const pg = await getPool();
  await pg.query(
    "INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5)",
    [input.name, input.email, input.subject, input.message, new Date().toISOString()]
  );
}

export const driver = "postgres";
