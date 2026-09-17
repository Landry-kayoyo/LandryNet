import { defineConfig } from "drizzle-kit";

const driver = process.env.DB_DRIVER ?? (process.env.DATABASE_URL ? "postgres" : "sqlite");

export default defineConfig({
  schema: driver === "postgres" ? "./src/schema/postgres.ts" : "./src/schema/sqlite.ts",
  dialect: driver === "postgres" ? "postgresql" : "sqlite",
  dbCredentials: driver === "postgres"
    ? { url: process.env.DATABASE_URL ?? "" }
    : { url: process.env.SQLITE_PATH ?? "./data/landry-net.sqlite" },
});
