import express from "express";
import cors from "cors";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pinoHttp } from "pino-http";
import { db } from "@workspace/db";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const uploadsDir = process.env.VERCEL ? "/tmp/uploads" : resolve(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use((req, res, next) => {
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
