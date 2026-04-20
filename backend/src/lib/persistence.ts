import * as fs from "node:fs";
import * as path from "node:path";
import { Mutex } from "async-mutex";
import type { SubmissionRecord } from "@survey/shared";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const WRITE_ROOT = process.env.VERCEL ? "/tmp/survey-data" : ROOT;
const RESPONSES_DIR = path.join(WRITE_ROOT, "responses");
const SCHEMAS_DIR = path.join(RESPONSES_DIR, "_schemas");
const CONTACT_FILE = path.join(WRITE_ROOT, "contact-emails", "opt-ins.jsonl");

// Single mutex for all jsonl appends
const jsonlMutex = new Mutex();

function todayDir(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(RESPONSES_DIR, `${yyyy}-${mm}-${dd}`);
}

/** Atomically write a submission record to disk. */
export async function writeSubmission(record: SubmissionRecord): Promise<void> {
  const dir = todayDir();
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${record.submission_id}.json`);
  const tmpPath = filePath + ".tmp";
  const data = JSON.stringify(record, null, 2);

  // Write to .tmp, fsync, then rename (POSIX-atomic)
  const fd = fs.openSync(tmpPath, "wx"); // fails if exists (extra safety)
  try {
    fs.writeFileSync(tmpPath, data, "utf-8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, filePath);
}

/** Append an email opt-in record to contact-emails/opt-ins.jsonl.
 *  Uses a mutex to prevent interleaved concurrent writes. */
export async function appendContactEmail(entry: {
  email: string;
  contact_token: string;
  consented_at: string;
}): Promise<void> {
  await jsonlMutex.runExclusive(async () => {
    fs.mkdirSync(path.dirname(CONTACT_FILE), { recursive: true });
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(CONTACT_FILE, line, "utf-8");
  });
}

/** Copy the schema file into responses/_schemas/ on first use.
 *  No-op if the snapshot already exists. */
export function snapshotSchema(
  schemaVersion: string,
  schemaContent: string
): void {
  fs.mkdirSync(SCHEMAS_DIR, { recursive: true });
  const dest = path.join(SCHEMAS_DIR, `${schemaVersion}.json`);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, schemaContent, "utf-8");
  }
}
