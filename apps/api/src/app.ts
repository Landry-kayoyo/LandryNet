import express from "express";
import cors from "cors";
import { resolve } from "node:path";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

app.use(
  pinoHttp({
    logger,
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static(resolve(process.cwd(), "uploads")));

app.use("/api", router);

export default app;
