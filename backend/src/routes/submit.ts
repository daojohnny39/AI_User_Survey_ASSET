import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  auditAndCleanAnswers,
  getMissingRequired,
  type Survey,
  type AnswerMap,
} from "@survey/shared";
import { validateAnswers } from "../lib/validation.js";
import { writeSubmission, appendContactEmail, snapshotSchema } from "../lib/persistence.js";
import { getSchema } from "./survey.js";

const router = Router();

// Zod: coarse shape validation (content validated in validateAnswers)
const SubmitBodySchema = z.object({
  draft_id: z.string().uuid(),
  schema_version: z.string().min(1),
  answers: z.record(z.unknown()),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  contact_email: z.string().email().optional(),
  contact_consent: z.boolean().optional(),
  // Bot honeypot — must be empty
  _hp: z.string().max(0).optional(),
});

// In-memory soft-duplicate guard (survives only current process lifetime)
// Key: hash of first-section answers; Value: timestamp ms
const recentHashes = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RECENT = 500;

function simpleHash(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64").substring(0, 32);
}

function isDuplicate(answers: AnswerMap): boolean {
  // Use first 6 answers as fingerprint
  const sample = Object.fromEntries(Object.entries(answers).slice(0, 6));
  const key = simpleHash(sample);
  const now = Date.now();
  const prev = recentHashes.get(key);
  if (prev && now - prev < DUPLICATE_WINDOW_MS) return true;
  if (recentHashes.size >= MAX_RECENT) {
    // Evict oldest entry
    const oldest = [...recentHashes.entries()].sort(([, a], [, b]) => a - b)[0];
    recentHashes.delete(oldest[0]);
  }
  recentHashes.set(key, now);
  return false;
}

router.post("/submit", async (req, res) => {
  // 1. Honeypot + minimum elapsed time
  const body = req.body;
  if (body._hp && body._hp.length > 0) {
    // Silently accept to not tip off bots, but don't store
    res.json({ status: "ok", submission_id: uuidv4() });
    return;
  }

  // 2. Coarse shape validation (zod)
  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }
  const {
    draft_id,
    schema_version,
    answers: rawAnswers,
    started_at,
    completed_at,
    contact_email,
    contact_consent,
  } = parsed.data;

  // 3. Minimum elapsed time (bot guard: < 90 seconds is suspicious)
  const elapsed = (new Date(completed_at).getTime() - new Date(started_at).getTime()) / 1000;
  if (elapsed < 90) {
    res.status(422).json({ error: "Submission completed too quickly — please take your time." });
    return;
  }

  // 4. Load survey + check schema version
  let schema: Survey;
  let schemaContent: string;
  try {
    const { parsed: p, content } = getSchema();
    schema = p as Survey;
    schemaContent = content;
  } catch {
    res.status(503).json({ error: "Survey schema unavailable" });
    return;
  }

  if (schema.version !== schema_version) {
    res.status(409).json({
      error: "Schema version mismatch. Please reload the survey and try again.",
      current_version: schema.version,
    });
    return;
  }

  // 5. Strip sf9a from answers (email opt-in lives separately)
  const answersWithoutEmail: AnswerMap = { ...(rawAnswers as AnswerMap) };
  delete answersWithoutEmail["sf9a"];

  // 6. Strict content validation
  const contentErrors = validateAnswers(schema, answersWithoutEmail);
  if (contentErrors.length > 0) {
    res.status(422).json({ error: "Invalid answer values", details: contentErrors });
    return;
  }

  // 7. Audit: strip hidden-question answers
  const { clean: cleanAnswers, smuggled } = auditAndCleanAnswers(schema, answersWithoutEmail);
  if (smuggled.length > 0) {
    req.log?.warn({ smuggled }, "Stripped answers for hidden questions");
  }

  // 8. Required-field check
  const missing = getMissingRequired(schema, cleanAnswers);
  if (missing.length > 0) {
    res.status(422).json({ error: "Missing required answers", missing_questions: missing });
    return;
  }

  // 9. Soft duplicate guard
  if (isDuplicate(cleanAnswers)) {
    res.status(409).json({ error: "Duplicate submission detected — your response was already recorded." });
    return;
  }

  // 10. Assemble record
  const submission_id = uuidv4();
  const duration_seconds = Math.round(elapsed);
  const record = {
    submission_id,
    schema_version,
    started_at,
    completed_at,
    duration_seconds,
    answers: cleanAnswers,
    meta: {
      user_agent: req.headers["user-agent"] ?? "unknown",
    },
  };

  // 11. Atomic write
  try {
    snapshotSchema(schema_version, schemaContent);
    await writeSubmission(record);
  } catch (err) {
    req.log?.error(err, "Failed to write submission");
    res.status(500).json({ error: "Failed to store your response. Please try again." });
    return;
  }

  // 12. Email opt-in (non-blocking failure)
  const emailToStore = contact_email ?? (rawAnswers as AnswerMap)["sf9a"] as string | undefined;
  if (emailToStore && contact_consent) {
    try {
      await appendContactEmail({
        email: emailToStore,
        contact_token: uuidv4(), // deliberately NOT the submission_id
        consented_at: completed_at,
      });
    } catch (err) {
      req.log?.error(err, "Failed to write contact email (non-fatal)");
    }
  }

  res.json({ status: "ok", submission_id });
});

export { router as submitRouter };
