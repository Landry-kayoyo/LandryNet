import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
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
const driver = process.env.DB_DRIVER ?? (databaseUrl ? "postgres" : "sqlite");

if (driver !== "sqlite" && driver !== "postgres") {
  throw new Error(`Unsupported DB_DRIVER "${driver}". Use "sqlite" or "postgres".`);
}

const sqlitePath = process.env.SQLITE_PATH ?? resolve(import.meta.dirname, "../../data/landry-net.sqlite");

function createSqliteDatabase() {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const sqlite = new DatabaseSync(sqlitePath);
  sqlite.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  return sqlite;
}

function createPostgresDatabase() {
  if (!databaseUrl) {
    throw new Error("A Postgres connection string is required when DB_DRIVER=postgres.");
  }

  const { Pool } = pg;
  const connectionString = databaseUrl;
  const isSslEnabled = /sslmode=|channel_binding=/.test(connectionString) || process.env.NODE_ENV === "production";

  return new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
  });
}

const sqliteDb = driver === "sqlite" ? createSqliteDatabase() : undefined;
const postgresDb = driver === "postgres" ? createPostgresDatabase() : undefined;
export const db = sqliteDb ?? postgresDb!;

const postgresReady = postgresDb
  ? Promise.race([
      (async () => {
        try {
          await postgresDb.query(`
            CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL);
            CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL);
            CREATE TABLE IF NOT EXISTS cms_items (id SERIAL PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}'::jsonb, published BOOLEAN NOT NULL DEFAULT TRUE, visible BOOLEAN NOT NULL DEFAULT TRUE, sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL);
            CREATE TABLE IF NOT EXISTS site_profile (id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL);
            CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL);
            CREATE TABLE IF NOT EXISTS contact_messages (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE);
          `);
          await postgresDb.query(`
            ALTER TABLE IF EXISTS admin_sessions
              ALTER COLUMN expires_at TYPE BIGINT
              USING expires_at::BIGINT;
          `);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Postgres init failed: ${message}`);
        }
      })(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Postgres init timed out after 8s.")), 8000);
      }),
    ])
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.warn("Postgres init skipped:", message);
        return undefined;
      })
  : Promise.resolve();

export type CmsContentType = "skill" | "technology" | "project" | "timeline" | "social";

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

function requireSqlite() {
  if (!sqliteDb) throw new Error("CMS local storage requires DB_DRIVER=sqlite.");
  return sqliteDb;
}

async function requirePostgres() {
  if (!postgresDb) throw new Error("PostgreSQL storage is not enabled.");
  await postgresReady;
  return postgresDb;
}

function createCmsSchema() {
  const sqlite = requireSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cms_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      published INTEGER NOT NULL DEFAULT 1,
      visible INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS site_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    sqlite.exec("ALTER TABLE contact_messages ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0");
  } catch {
    // The column already exists on databases created by the current schema.
  }
}

if (sqliteDb) createCmsSchema();

function parseCmsItem(row: Record<string, unknown>): CmsItem {
  const rawData = row.data;
  return {
    id: Number(row.id),
    type: row.type as CmsContentType,
    title: String(row.title),
    data: typeof rawData === "string" ? JSON.parse(rawData || "{}") as Record<string, unknown> : (rawData ?? {}) as Record<string, unknown>,
    published: Boolean(row.published),
    visible: Boolean(row.visible),
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAdminUser(email: string) {
  if (postgresDb) {
    const result = await (await requirePostgres()).query("SELECT id, email, password_hash FROM admin_users WHERE email = $1", [email]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? { id: Number(row.id), email: String(row.email), passwordHash: String(row.password_hash) } : null;
  }
  const row = requireSqlite().prepare("SELECT id, email, password_hash FROM admin_users WHERE email = ?").get(email) as Record<string, unknown> | undefined;
  return row ? { id: Number(row.id), email: String(row.email), passwordHash: String(row.password_hash) } : null;
}

export async function createAdminUser(email: string, passwordHash: string) {
  const now = new Date().toISOString();
  if (postgresDb) {
    const result = await (await requirePostgres()).query("INSERT INTO admin_users (email, password_hash, created_at) VALUES ($1, $2, $3) RETURNING id", [email, passwordHash, now]);
    return Number(result.rows[0].id);
  }
  const result = requireSqlite().prepare("INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, ?)").run(email, passwordHash, now);
  return Number(result.lastInsertRowid);
}

export async function createAdminSession(tokenHash: string, userId: number, expiresAt: number) {
  if (postgresDb) {
    await (await requirePostgres()).query("INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)", [tokenHash, userId, expiresAt, new Date().toISOString()]);
    return;
  }
  requireSqlite().prepare("INSERT INTO admin_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(tokenHash, userId, expiresAt, new Date().toISOString());
}

export async function getAdminSession(tokenHash: string) {
  if (postgresDb) {
    const result = await (await requirePostgres()).query("SELECT user_id, expires_at FROM admin_sessions WHERE token_hash = $1", [tokenHash]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row || Number(row.expires_at) <= Date.now()) return null;
    return { userId: Number(row.user_id) };
  }
  const row = requireSqlite().prepare("SELECT user_id, expires_at FROM admin_sessions WHERE token_hash = ?").get(tokenHash) as Record<string, unknown> | undefined;
  if (!row || Number(row.expires_at) <= Date.now()) return null;
  return { userId: Number(row.user_id) };
}

export async function deleteAdminSession(tokenHash: string) {
  if (postgresDb) {
    await (await requirePostgres()).query("DELETE FROM admin_sessions WHERE token_hash = $1", [tokenHash]);
    return;
  }
  requireSqlite().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(tokenHash);
}

export async function listCmsItems(type?: CmsContentType, includeHidden = false) {
  if (postgresDb) {
    const pool = await requirePostgres();
    const visibility = includeHidden ? "" : " AND visible = TRUE AND published = TRUE";
    const result = type
      ? await pool.query(`SELECT * FROM cms_items WHERE type = $1${visibility} ORDER BY sort_order ASC, id ASC`, [type])
      : await pool.query(`SELECT * FROM cms_items WHERE TRUE${visibility} ORDER BY type ASC, sort_order ASC, id ASC`);
    return result.rows.map(parseCmsItem);
  }
  const sqlite = requireSqlite();
  const rows = type
    ? sqlite.prepare(`SELECT * FROM cms_items WHERE type = ? ${includeHidden ? "" : "AND visible = 1 AND published = 1"} ORDER BY sort_order ASC, id ASC`).all(type)
    : sqlite.prepare(`SELECT * FROM cms_items ${includeHidden ? "" : "WHERE visible = 1 AND published = 1"} ORDER BY type ASC, sort_order ASC, id ASC`).all();
  return (rows as Record<string, unknown>[]).map(parseCmsItem);
}

export async function createCmsItem(input: { type: CmsContentType; title: string; data: Record<string, unknown>; published?: boolean; visible?: boolean; sortOrder?: number }) {
  const now = new Date().toISOString();
  if (postgresDb) {
    const result = await (await requirePostgres()).query("INSERT INTO cms_items (type, title, data, published, visible, sort_order, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $7) RETURNING id", [input.type, input.title, JSON.stringify(input.data), input.published !== false, input.visible !== false, input.sortOrder ?? 0, now]);
    return Number(result.rows[0].id);
  }
  const result = requireSqlite().prepare("INSERT INTO cms_items (type, title, data, published, visible, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(input.type, input.title, JSON.stringify(input.data), input.published === false ? 0 : 1, input.visible === false ? 0 : 1, input.sortOrder ?? 0, now, now);
  return Number(result.lastInsertRowid);
}

export async function updateCmsItem(id: number, input: { type?: CmsContentType; title?: string; data?: Record<string, unknown>; published?: boolean; visible?: boolean; sortOrder?: number }) {
  if (postgresDb) {
    const pool = await requirePostgres();
    const current = (await pool.query("SELECT * FROM cms_items WHERE id = $1", [id])).rows[0] as Record<string, unknown> | undefined;
    if (!current) return false;
    await pool.query("UPDATE cms_items SET type = $1, title = $2, data = $3::jsonb, published = $4, visible = $5, sort_order = $6, updated_at = $7 WHERE id = $8", [input.type ?? current.type, input.title ?? current.title, JSON.stringify(input.data ?? current.data), input.published ?? current.published, input.visible ?? current.visible, input.sortOrder ?? current.sort_order, new Date().toISOString(), id]);
    return true;
  }
  const current = requireSqlite().prepare("SELECT * FROM cms_items WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!current) return false;
  const now = new Date().toISOString();
  requireSqlite().prepare("UPDATE cms_items SET type = ?, title = ?, data = ?, published = ?, visible = ?, sort_order = ?, updated_at = ? WHERE id = ?").run(input.type ?? String(current.type), input.title ?? String(current.title), JSON.stringify(input.data ?? JSON.parse(String(current.data))), input.published === undefined ? Number(current.published) : input.published ? 1 : 0, input.visible === undefined ? Number(current.visible) : input.visible ? 1 : 0, input.sortOrder ?? Number(current.sort_order), now, id);
  return true;
}

export async function deleteCmsItem(id: number) {
  if (postgresDb) return (await (await requirePostgres()).query("DELETE FROM cms_items WHERE id = $1", [id])).rowCount !== 0;
  return requireSqlite().prepare("DELETE FROM cms_items WHERE id = ?").run(id).changes > 0;
}

export async function getPublicCmsData() {
  const items = await listCmsItems();
  const isPlaceholderItem = (item: CmsItem) => {
    const title = item.title.trim();
    const category = typeof item.data.category === "string" ? item.data.category.trim().toLowerCase() : "";
    return category === "à compléter" || category === "a completer" || category === "à renseigner" || category === "a renseigner" || (title.startsWith("[TEST]") && typeof item.data.description !== "string");
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
  };
}

async function getSingleton(table: "site_profile" | "site_settings") {
  if (postgresDb) {
    const row = (await (await requirePostgres()).query(`SELECT data FROM ${table} WHERE id = 1`)).rows[0] as { data: Record<string, unknown> } | undefined;
    return row?.data ?? {};
  }
  const row = requireSqlite().prepare(`SELECT data FROM ${table} WHERE id = 1`).get() as { data: string } | undefined;
  return row ? JSON.parse(row.data) as Record<string, unknown> : {};
}

export async function updateSingleton(table: "site_profile" | "site_settings", data: Record<string, unknown>) {
  const now = new Date().toISOString();
  if (postgresDb) {
    await (await requirePostgres()).query(`INSERT INTO ${table} (id, data, updated_at) VALUES (1, $1::jsonb, $2) ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`, [JSON.stringify(data), now]);
    return;
  }
  requireSqlite().prepare(`INSERT INTO ${table} (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).run(JSON.stringify(data), now);
}

export async function listContactMessages(includeRead = true) {
  if (postgresDb) {
    const result = await (await requirePostgres()).query(`SELECT id, name, email, subject, message, created_at, is_read FROM contact_messages${includeRead ? "" : " WHERE is_read = FALSE"} ORDER BY created_at DESC`);
    return result.rows as Record<string, unknown>[];
  }
  const rows = requireSqlite().prepare(`SELECT id, name, email, subject, message, created_at, is_read FROM contact_messages ${includeRead ? "" : "WHERE is_read = 0"} ORDER BY created_at DESC`).all();
  return rows as Record<string, unknown>[];
}

export async function markContactMessageRead(id: number, isRead: boolean) {
  if (postgresDb) return (await (await requirePostgres()).query("UPDATE contact_messages SET is_read = $1 WHERE id = $2", [isRead, id])).rowCount !== 0;
  return requireSqlite().prepare("UPDATE contact_messages SET is_read = ? WHERE id = ?").run(isRead ? 1 : 0, id).changes > 0;
}

export async function deleteContactMessage(id: number) {
  if (postgresDb) return (await (await requirePostgres()).query("DELETE FROM contact_messages WHERE id = $1", [id])).rowCount !== 0;
  return requireSqlite().prepare("DELETE FROM contact_messages WHERE id = ?").run(id).changes > 0;
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const values = { ...input, createdAt: new Date() };

  if (sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO contact_messages (name, email, subject, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(values.name, values.email, values.subject, values.message, values.createdAt.getTime());
    return;
  }

  if (postgresDb) {
    await (await requirePostgres()).query("INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5)", [values.name, values.email, values.subject, values.message, values.createdAt.toISOString()]);
  }
}

export { driver };
