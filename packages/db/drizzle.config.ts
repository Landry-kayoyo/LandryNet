import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

for (const envFile of [".env.vercel.local", ".env.production", ".env.local", ".env"]) {
  try {
    process.loadEnvFile(resolve(repoRoot, envFile));
  } catch {
    // Ignore missing env files.
  }
}

const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or POSTGRES_URL / NEON_DATABASE_URL) is required.");
}

export default defineConfig({
  schema: "./src/schema/postgres.ts",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
});
