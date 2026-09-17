import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

for (const envFile of [".env.vercel.local", ".env.production", ".env.local", ".env"]) {
  try {
    process.loadEnvFile(resolve(repoRoot, envFile));
  } catch {
    // Ignore missing env files; they are optional in local development and CI.
  }
}

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
const driver = process.env.DB_DRIVER ?? (databaseUrl ? "postgres" : "sqlite");

export default defineConfig({
  schema: driver === "postgres" ? "./src/schema/postgres.ts" : "./src/schema/sqlite.ts",
  dialect: driver === "postgres" ? "postgresql" : "sqlite",
  dbCredentials: driver === "postgres"
    ? { url: databaseUrl ?? "" }
    : { url: process.env.SQLITE_PATH ?? "./data/landry-net.sqlite" },
});
