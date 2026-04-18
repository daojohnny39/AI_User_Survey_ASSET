import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import pino from "pino";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

import { surveyRouter } from "./routes/survey.js";
import { submitRouter } from "./routes/submit.js";

const ROOT = path.resolve(url.fileURLToPath(import.meta.url), "../../..");
const LOGS_DIR = path.join(ROOT, "data", "logs");
fs.mkdirSync(LOGS_DIR, { recursive: true });

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

// Logger
const logger = pino(
  { level: isProd ? "info" : "debug" },
  isProd
    ? pino.destination(
        path.join(
          LOGS_DIR,
          `server-${new Date().toISOString().slice(0, 10)}.log`
        )
      )
    : process.stdout
);

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// CORS
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Request logging (no bodies, no PII)
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// Body parsing — cap at 256KB
app.use(express.json({ limit: "256kb" }));

// Rate limiting
const schemaLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60_000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this IP." },
});

// Routes
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", schemaLimiter, surveyRouter);
app.use("/api", submitLimiter, submitRouter);

// Serve frontend static files in production
if (isProd) {
  const distDir = path.join(ROOT, "frontend", "dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
}

app.listen(PORT, () => {
  logger.info({ port: PORT, origin: ALLOWED_ORIGIN }, "Survey backend started");
});

export { app };
