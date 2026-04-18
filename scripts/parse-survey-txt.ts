#!/usr/bin/env npx tsx
/**
 * First-pass parser: AI_User_Survey_Questions_ver3.txt → survey-schema/survey.v1-draft.json
 *
 * This is a LABOR-SAVING TOOL, not authoritative.
 * After running:
 *   1. Review parse-report.md for TODOs
 *   2. Fix flagged show_if conditions manually in the draft JSON
 *   3. Run: npm run lint:schema
 *   4. Bump version from "v1-draft" to "v1" after human sign-off
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INPUT =
  "/Users/johnnydao/Downloads/AI_User_Survey_Questions_ver3.txt";
const OUTPUT = path.join(ROOT, "survey-schema", "survey.v1-draft.json");
const REPORT = path.join(ROOT, "survey-schema", "parse-report.md");

// ── Inline types ─────────────────────────────────────────────────────────────

type QuestionType =
  | "single_select"
  | "multi_select"
  | "likert_1_5"
  | "short_text"
  | "long_text"
  | "email";

interface Option {
  value: string;
  label: string;
  allow_text?: boolean;
}

type ShowIfCondition =
  | { op: "eq"; question: string; value: string | number }
  | { op: "gte"; question: string; value: number }
  | { op: "lte"; question: string; value: number }
  | { op: "any_of"; question: string; values: string[] }
  | { op: "or"; conditions: ShowIfCondition[] }
  | { op: "and"; conditions: ShowIfCondition[] };

interface Question {
  id: string;
  section_id: number;
  section_title: string;
  prompt: string;
  type: QuestionType;
  required: boolean;
  options?: Option[];
  max_length?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  show_if?: ShowIfCondition;
  _todo?: string;
  _condition_text?: string; // temporary, resolved in second pass, then deleted
}

interface Section {
  id: number;
  title: string;
  description?: string;
}

interface Survey {
  version: string;
  title: string;
  sections: Section[];
  questions: Question[];
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`'']/g, "")
    .replace(/—/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 80);
}

// Accepts "8", "8a", "Q8", "SF1", "SF4a" etc.
function makeId(rawNum: string): string {
  const lower = rawNum.toLowerCase();
  if (lower.startsWith("sf")) return lower;
  if (lower.startsWith("q")) return lower;
  return "q" + lower;
}

function detectType(tag: string): QuestionType {
  const t = tag.toLowerCase();
  if (t.includes("rate each")) return "likert_1_5";
  if (t.includes("scale 1 to 5")) return "likert_1_5";
  if (t.includes("check all that apply")) return "multi_select";
  if (t.includes("email")) return "email";
  if (t.includes("short answer")) return "short_text";
  if (t.includes("open text")) return "long_text";
  if (t.includes("mark only one oval")) return "single_select";
  return "single_select";
}

// Mutable type map; rebuilt after type-fix passes
const qTypeMap = new Map<string, QuestionType>();

// ── Condition resolver (runs after all types are finalized) ───────────────────

function resolveCondition(text: string): ShowIfCondition | string {
  text = text.trim();

  // "QN = V1 or V2" / "SFN = V1 or V2" → any_of (or special likert case)
  const anyOfMatch = text.match(
    /^(Q\d+[a-z]*|SF\d+[a-z]*) = (.+?) or (.+)$/i
  );
  if (anyOfMatch) {
    const qid = makeId(anyOfMatch[1]);
    const v1 = anyOfMatch[2].trim();
    const v2 = anyOfMatch[3].trim();
    const refType = qTypeMap.get(qid);

    // "Strongly Agree or Agree" on a likert → gte 4
    if (
      refType === "likert_1_5" &&
      v1.toLowerCase() === "strongly agree" &&
      v2.toLowerCase() === "agree"
    ) {
      return { op: "gte", question: qid, value: 4 };
    }

    return { op: "any_of", question: qid, values: [slug(v1), slug(v2)] };
  }

  // "QN = VALUE" / "SFN = VALUE" → eq
  const eqMatch = text.match(/^(Q\d+[a-z]*|SF\d+[a-z]*) = (.+)$/i);
  if (eqMatch) {
    const qid = makeId(eqMatch[1]);
    return { op: "eq", question: qid, value: slug(eqMatch[2].trim()) };
  }

  // "QN rated N or M — label" → gte / lte / and
  const ratedRange = text.match(
    /^Q(\d+[a-z]*) rated (\d+) or (\d+)(?:\s*—.*)?$/i
  );
  if (ratedRange) {
    const qid = "q" + ratedRange[1].toLowerCase();
    const v1 = parseInt(ratedRange[2], 10);
    const v2 = parseInt(ratedRange[3], 10);
    const [lo, hi] = [Math.min(v1, v2), Math.max(v1, v2)];
    if (hi === 5) return { op: "gte", question: qid, value: lo };
    if (lo === 1) return { op: "lte", question: qid, value: hi };
    return {
      op: "and",
      conditions: [
        { op: "gte", question: qid, value: lo },
        { op: "lte", question: qid, value: hi },
      ],
    };
  }

  // "QN rated N — label" → eq (numeric)
  const ratedExact = text.match(/^Q(\d+[a-z]*) rated (\d+)(?:\s*—.*)?$/i);
  if (ratedExact) {
    const qid = "q" + ratedExact[1].toLowerCase();
    return { op: "eq", question: qid, value: parseInt(ratedExact[2], 10) };
  }

  return `TODO: ${text}`;
}

// ── Block extraction ──────────────────────────────────────────────────────────

interface QuestionBlock {
  rawNum: string;
  lines: string[];
  sectionId: number;
  sectionTitle: string;
}

function extractBlocks(fileContent: string): QuestionBlock[] {
  const lines = fileContent.split("\n");
  const blocks: QuestionBlock[] = [];

  let sectionId = 0;
  let sectionTitle = "";
  let currentBlock: QuestionBlock | null = null;
  let prevWasBanner = false;

  const QUESTION_START = /^(\d+[a-z]*|SF\d+[a-z]*)\.[ \t]/i;
  const SECTION_BANNER = /^={10,}/;
  const SECTION_HEADER = /^SECTION (\d+):\s*(.+)/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (SECTION_BANNER.test(trimmed)) {
      prevWasBanner = true;
      continue;
    }

    if (prevWasBanner) {
      const m = trimmed.match(SECTION_HEADER);
      if (m) {
        sectionId = parseInt(m[1], 10);
        sectionTitle = m[2].trim();
      }
      prevWasBanner = false;
      continue;
    }

    prevWasBanner = false;

    const qMatch = line.match(QUESTION_START);
    if (qMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        rawNum: qMatch[1],
        lines: [line],
        sectionId,
        sectionTitle,
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

// ── Parse a single question block (first pass; no condition resolution) ───────

function parseBlock(block: QuestionBlock): Question {
  const { rawNum, lines, sectionId, sectionTitle } = block;
  const id = makeId(rawNum);
  const fullText = lines.join("\n");

  // Type tag
  const typeTagMatch = fullText.match(
    /\[(Mark only one oval[^\]]*|Check all that apply|Rate each[^\]]*|Short answer[^\]]*|Open text[^\]]*)\]/i
  );
  const type: QuestionType = typeTagMatch
    ? detectType(typeTagMatch[1])
    : "single_select";

  // Condition text (deferred — resolved in second pass)
  const condTagMatch = fullText.match(/\[Answer only if ([^\]]+)\]/i);
  const _condition_text = condTagMatch ? condTagMatch[1] : undefined;

  // Prompt
  let firstLine = lines[0];
  const numPrefixMatch = firstLine.match(/^(\d+[a-z]*|SF\d+[a-z]*)\.[ \t]+/i);
  if (numPrefixMatch) firstLine = firstLine.slice(numPrefixMatch[0].length);
  firstLine = firstLine.replace(/\[Answer only if [^\]]+\]\s*/i, "").trim();

  const promptLines: string[] = [firstLine];
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    if (!t) break;
    if (/^\[/.test(t)) break;
    if (/^[ \t]{2,}-/.test(l)) break;
    if (/^\d+ = /.test(t)) break;
    if (/^\(/.test(t)) break;
    promptLines.push(t);
  }
  const prompt = promptLines.filter(Boolean).join(" ").trim();

  // Max length
  const maxLenMatch = fullText.match(/\((\d+) characters/i);
  const max_length = maxLenMatch ? parseInt(maxLenMatch[1], 10) : undefined;

  // Scale labels
  const scaleMatch = fullText.match(
    /1 = ([^.\n]+?)[ \t]+\.+[ \t]+5 = ([^\n]+)/
  );
  const scale_min_label = scaleMatch ? scaleMatch[1].trim() : undefined;
  const scale_max_label = scaleMatch ? scaleMatch[2].trim() : undefined;

  // Options (single_select and multi_select only)
  const options: Option[] = [];
  if (type === "single_select" || type === "multi_select") {
    for (const ol of lines) {
      if (!/^[ \t]{2,}-[ \t]/.test(ol)) continue;
      const labelRaw = ol.replace(/^[ \t]+-[ \t]/, "").trim();
      if (!labelRaw) continue;
      const isOther = /^Other:/i.test(labelRaw);
      const label = isOther
        ? "Other"
        : labelRaw.replace(/\s*\(.*?\)\s*$/, "").trim();
      options.push({
        value: slug(label),
        label: labelRaw.replace(/: ?_+$/, "").trim(),
        ...(isOther ? { allow_text: true } : {}),
      });
    }
  }

  qTypeMap.set(id, type);

  return {
    id,
    section_id: sectionId,
    section_title: sectionTitle,
    prompt,
    type,
    required: true,
    ...(options.length > 0 ? { options } : {}),
    ...(max_length !== undefined ? { max_length } : {}),
    ...(scale_min_label ? { scale_min_label } : {}),
    ...(scale_max_label ? { scale_max_label } : {}),
    ...(_condition_text ? { _condition_text } : {}),
  };
}

// ── Likert range post-processing ──────────────────────────────────────────────
// Questions in these numeric ranges (inclusive) are likert_1_5
// based on section-level [Questions N-M: Scale 1-5] headers in the source .txt

const LIKERT_RANGES: Array<[number, number]> = [
  [24, 28],  // S8  AI Security Threat Perception
  [29, 34],  // S9  AI Ethics Attitudes
  [35, 40],  // S10 Domain-Specific AI Attitudes
  [41, 44],  // S11 Employment & Economic Concerns
  [45, 47],  // S12 Creative & Cultural AI Issues
  [48, 53],  // S13 AI in Education
  [54, 58],  // S14 AI in Healthcare (Q59 is matrix, handled separately)
  [62, 64],  // S15 AI & Social Media
  [65, 70],  // S16 AI Trust & Transparency
  [76, 80],  // S18 AI & Mental Health
  [82, 85],  // S19 AI Regulation & Policy
  [88, 91],  // S20 AI & Accessibility
  [94, 97],  // S21 AI & the Environment
  [100, 100], // S22 IT questions with scale
  [102, 102],
  [106, 110], // S23 AI in Business & Finance
  [111, 116], // S24 AI & Relationships
  [117, 120], // S25 AI Future Outlook
];

// IDs that fall in a range above but should NOT be likert (they have their own type tags)
const NOT_LIKERT = new Set([
  "q53a", // multi_select demographic
  "q81a", // has own scale tag — parsed correctly
  "q86", "q87", // single_select in S19
  "q92", // single_select in S20
  "q93", // single_select in S21
  "q100a", "q100b", // conditional follow-ups with own type tags
  "q102a", "q102b",
]);

function applyLikertRanges(questions: Question[]): void {
  for (const q of questions) {
    if (NOT_LIKERT.has(q.id)) continue;
    const m = q.id.match(/^q(\d+)$/);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    for (const [lo, hi] of LIKERT_RANGES) {
      if (num >= lo && num <= hi) {
        q.type = "likert_1_5";
        qTypeMap.set(q.id, "likert_1_5");
        delete q.options; // likert questions have no option list
        delete q.scale_min_label; // will be set with defaults below if missing
        delete q.scale_max_label;
        if (!q.scale_min_label) q.scale_min_label = "Strongly Disagree";
        if (!q.scale_max_label) q.scale_max_label = "Strongly Agree";
        break;
      }
    }
  }

  // Survey feedback likert questions
  for (const sfId of ["sf1", "sf3"]) {
    const q = questions.find((q) => q.id === sfId);
    if (!q) continue;
    q.type = "likert_1_5";
    qTypeMap.set(sfId, "likert_1_5");
    delete q.options;
  }
}

// ── Second pass: resolve all deferred condition texts ─────────────────────────

function resolveConditions(questions: Question[]): void {
  const todos: Array<{ id: string; text: string }> = [];
  for (const q of questions) {
    if (!q._condition_text) continue;
    const result = resolveCondition(q._condition_text);
    if (typeof result === "string") {
      q._todo = result;
      todos.push({ id: q.id, text: result });
    } else {
      q.show_if = result;
    }
    delete q._condition_text;
  }
  return;
}

// ── Matrix expansion ──────────────────────────────────────────────────────────

interface MatrixDef {
  parentId: string;
  promptPrefix: string;
  scaleMinLabel: string;
  scaleMaxLabel: string;
  rows: Array<{ suffix: string; label: string }>;
}

const MATRIX_DEFS: MatrixDef[] = [
  {
    parentId: "q59",
    promptPrefix:
      "How much do you trust AI systems in each of the following healthcare roles?",
    scaleMinLabel: "No trust",
    scaleMaxLabel: "Full trust",
    rows: [
      { suffix: "admin", label: "Administrative tasks (scheduling, billing)" },
      { suffix: "drug", label: "Drug interaction checking" },
      { suffix: "imaging", label: "Diagnostic imaging analysis" },
      { suffix: "mental", label: "Mental health support and therapy" },
      { suffix: "surgical", label: "Surgical assistance or robotics" },
    ],
  },
  {
    parentId: "q104",
    promptPrefix:
      "How much do you trust AI systems in each of the following financial contexts?",
    scaleMinLabel: "No trust",
    scaleMaxLabel: "Full trust",
    rows: [
      { suffix: "credit", label: "Credit scoring and loan approvals" },
      { suffix: "fraud", label: "Fraud detection and transaction monitoring" },
      {
        suffix: "trading",
        label: "Algorithmic stock trading and portfolio management",
      },
      {
        suffix: "reports",
        label: "AI-generated financial reports or earnings summaries",
      },
      {
        suffix: "insurance",
        label: "Insurance underwriting and risk assessment",
      },
    ],
  },
];

const MATRIX_PARENT_IDS = new Set(MATRIX_DEFS.map((m) => m.parentId));

function expandMatrixQuestions(questions: Question[]): Question[] {
  const result: Question[] = [];
  for (const q of questions) {
    if (!MATRIX_PARENT_IDS.has(q.id)) {
      result.push(q);
      continue;
    }
    const def = MATRIX_DEFS.find((m) => m.parentId === q.id)!;
    for (const row of def.rows) {
      const subId = `${q.id}_${row.suffix}`;
      qTypeMap.set(subId, "likert_1_5");
      result.push({
        id: subId,
        section_id: q.section_id,
        section_title: q.section_title,
        prompt: `${def.promptPrefix} — ${row.label}`,
        type: "likert_1_5",
        required: true,
        scale_min_label: def.scaleMinLabel,
        scale_max_label: def.scaleMaxLabel,
      });
    }
  }
  return result;
}

// ── Special-case fixes ────────────────────────────────────────────────────────

function fixQ72(questions: Question[]): void {
  const q = questions.find((q) => q.id === "q72");
  if (!q) return;
  q.type = "single_select";
  qTypeMap.set("q72", "single_select");
  q.options = [
    { value: "1", label: "1 — Very dissatisfied" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5 — Very satisfied" },
    {
      value: "na",
      label: "N/A — I have not interacted with AI customer service",
    },
  ];
  delete q.scale_min_label;
  delete q.scale_max_label;
  q._todo =
    "Q72 converted to single_select (was likert+N/A). Verify this is OK for analysis.";
}

function fixQ53a(questions: Question[]): void {
  const q = questions.find((q) => q.id === "q53a");
  if (!q) return;
  delete q.show_if;
  delete q._condition_text;
  q.required = false;
}

function fixSF9a(questions: Question[]): void {
  const q = questions.find((q) => q.id === "sf9a");
  if (!q) return;
  q.type = "email";
  qTypeMap.set("sf9a", "email");
  delete q.options;
  q.required = false;
  // SF9 options: "Yes — please contact me" → "yes_please_contact_me"
  //              "Maybe — I'd want more information first" → "maybe_id_want_more_information_first"
  q.show_if = {
    op: "any_of",
    question: "sf9",
    values: ["yes_please_contact_me", "maybe_id_want_more_information_first"],
  };
  delete q._todo;
}

function applySection22Condition(questions: Question[]): void {
  const cond = resolveCondition(
    "Q6 = Yes, primary job or Yes, part of my job"
  ) as ShowIfCondition;

  const topLevel = new Set(["q98", "q99", "q100", "q101", "q102", "q103"]);
  for (const q of questions) {
    if (q.section_id !== 22 || !topLevel.has(q.id)) continue;
    if (q.show_if) {
      q.show_if = { op: "and", conditions: [cond, q.show_if] };
    } else {
      q.show_if = cond;
    }
  }
}

// ── Sections list ─────────────────────────────────────────────────────────────

function buildSections(questions: Question[]): Section[] {
  const seen = new Map<number, string>();
  for (const q of questions) {
    if (!seen.has(q.section_id)) seen.set(q.section_id, q.section_title);
  }
  return Array.from(seen.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, title]) => ({ id, title }));
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const fileContent = fs.readFileSync(INPUT, "utf-8");
  const blocks = extractBlocks(fileContent);

  // First pass: parse all question blocks (types only, conditions deferred)
  let questions: Question[] = blocks.map(parseBlock);

  // Type fixes (must happen before condition resolution)
  fixQ72(questions);
  fixQ53a(questions);
  applyLikertRanges(questions);

  // Rebuild type map after all type fixes
  qTypeMap.clear();
  for (const q of questions) qTypeMap.set(q.id, q.type);

  // Second pass: resolve conditions (now that type map is correct)
  resolveConditions(questions);

  // Remaining structural post-processing
  applySection22Condition(questions);
  questions = expandMatrixQuestions(questions);
  fixSF9a(questions);

  const sections = buildSections(questions);

  // Collect TODOs for report
  const todos = questions
    .filter((q) => q._todo)
    .map((q) => ({ id: q.id, todo: q._todo! }));

  const survey: Survey = {
    version: "v1-draft",
    title: "AI User Survey",
    sections,
    questions: questions.map(({ _todo: _t, _condition_text: _c, ...rest }) => rest),
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(survey, null, 2), "utf-8");
  console.log(
    `✓ Wrote ${questions.length} questions across ${sections.length} sections → ${OUTPUT}`
  );

  const reportLines = [
    "# Parse Report — survey.v1-draft.json",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Questions: ${questions.length} across ${sections.length} sections`,
    "",
    "## TODOs requiring manual review",
    "",
    todos.length === 0
      ? "_No TODOs — all conditions parsed automatically._"
      : todos.map(({ id, todo }) => `- **${id}**: ${todo}`).join("\n"),
    "",
    "## Checklist before promoting to v1",
    "",
    "- [ ] Review all show_if conditions against the source .txt",
    "- [ ] Verify Q72 single_select treatment is acceptable for analysis",
    "- [ ] Verify SF9a email type and show_if values match SF9 option slugs",
    "- [ ] Verify Section 22 questions have correct Q6 show_if",
    "- [ ] Verify Q59 and Q104 matrix sub-questions are correct",
    "- [ ] Run: npm run lint:schema",
    "- [ ] All lint errors resolved",
    "- [ ] Human sign-off",
    '- [ ] Bump version from "v1-draft" to "v1" in the JSON',
  ];
  fs.writeFileSync(REPORT, reportLines.join("\n"), "utf-8");
  console.log(`✓ Wrote parse report → ${REPORT}`);

  if (todos.length > 0) {
    console.warn(
      `\n⚠  ${todos.length} TODO(s) require manual review. See ${REPORT}`
    );
  }
}

main();
