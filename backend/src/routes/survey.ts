import { Router } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

const router = Router();

// Resolve schema: prefer v1.json, fall back to v1-draft.json
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../../..");
const SCHEMA_PATHS = [
  path.join(ROOT, "survey-schema", "survey.v1.json"),
  path.join(ROOT, "survey-schema", "survey.v1-draft.json"),
];

function loadSchema(): { content: string; parsed: unknown } {
  for (const p of SCHEMA_PATHS) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      return { content, parsed: JSON.parse(content) };
    }
  }
  throw new Error("No survey schema file found in survey-schema/");
}

// Cache the schema at startup; immutable during runtime
let cached: { content: string; parsed: unknown } | null = null;
function getSchema() {
  if (!cached) cached = loadSchema();
  return cached;
}

router.get("/survey", (_req, res) => {
  try {
    const { parsed } = getSchema();
    res.json(parsed);
  } catch (err) {
    res.status(503).json({ error: "Survey schema unavailable" });
  }
});

export { router as surveyRouter, getSchema };
