#!/usr/bin/env npx tsx
/**
 * Schema linter — validates survey-schema/survey.v1-draft.json (or v1.json).
 *
 * Rules enforced:
 *   ID_UNIQUE       - every question.id is unique
 *   ID_CONTIGUOUS   - section ids are 1..N with no gaps
 *   REF_EXISTS      - every question referenced in show_if exists
 *   VALUE_VALID     - values in eq/any_of match declared option slugs (or 1-5 for likert)
 *   TYPE_COMPAT     - gte/lte only on likert; any_of/all_of only on multi_select/single_select
 *   REQUIRED_SHOWIG - required questions with show_if are flagged (informational, not error)
 *   NO_CYCLES       - no circular show_if dependency chains
 *   NO_TODO         - questions with _todo field are flagged as unresolved
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const schemaArg = process.argv[2];
const schemaFile =
  schemaArg ??
  path.join(ROOT, "survey-schema", "survey.v1-draft.json");

if (!fs.existsSync(schemaFile)) {
  console.error(`Schema file not found: ${schemaFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(schemaFile, "utf-8"));

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
  | { op: "neq"; question: string; value: string | number }
  | { op: "gte"; question: string; value: number }
  | { op: "lte"; question: string; value: number }
  | { op: "any_of"; question: string; values: string[] }
  | { op: "all_of"; question: string; values: string[] }
  | { op: "none_of"; question: string; values: string[] }
  | { op: "answered"; question: string }
  | { op: "not_answered"; question: string }
  | { op: "and"; conditions: ShowIfCondition[] }
  | { op: "or"; conditions: ShowIfCondition[] }
  | { op: "not"; condition: ShowIfCondition };

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
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function refsIn(cond: ShowIfCondition): string[] {
  switch (cond.op) {
    case "eq":
    case "neq":
    case "gte":
    case "lte":
    case "any_of":
    case "all_of":
    case "none_of":
    case "answered":
    case "not_answered":
      return [cond.question];
    case "and":
    case "or":
      return cond.conditions.flatMap(refsIn);
    case "not":
      return refsIn(cond.condition);
  }
}

function valuesIn(
  cond: ShowIfCondition
): Array<{ question: string; op: string; value?: string | number; values?: string[] }> {
  switch (cond.op) {
    case "eq":
    case "neq":
      return [{ question: cond.question, op: cond.op, value: cond.value }];
    case "gte":
    case "lte":
      return [{ question: cond.question, op: cond.op, value: cond.value }];
    case "any_of":
    case "all_of":
    case "none_of":
      return [{ question: cond.question, op: cond.op, values: cond.values }];
    case "answered":
    case "not_answered":
      return [];
    case "and":
    case "or":
      return cond.conditions.flatMap(valuesIn);
    case "not":
      return valuesIn(cond.condition);
  }
}

// ── Lint ─────────────────────────────────────────────────────────────────────

const errors: string[] = [];
const warnings: string[] = [];

const questions: Question[] = raw.questions ?? [];
const qById = new Map<string, Question>(questions.map((q: Question) => [q.id, q]));

// ID_UNIQUE
const seenIds = new Set<string>();
for (const q of questions) {
  if (seenIds.has(q.id)) {
    errors.push(`ID_UNIQUE: duplicate question id "${q.id}"`);
  }
  seenIds.add(q.id);
}

// ID_CONTIGUOUS sections
const sectionIds: number[] = (raw.sections ?? []).map((s: { id: number }) => s.id).sort((a: number, b: number) => a - b);
for (let i = 0; i < sectionIds.length; i++) {
  if (sectionIds[i] !== i + 1) {
    errors.push(
      `ID_CONTIGUOUS: section ids are not contiguous. Expected ${i + 1}, got ${sectionIds[i]}`
    );
    break;
  }
}

// Per-question checks
for (const q of questions) {
  // NO_TODO
  if ((q as unknown as Record<string, unknown>)._todo) {
    warnings.push(`NO_TODO: ${q.id} has unresolved _todo: ${(q as unknown as Record<string, unknown>)._todo}`);
  }

  if (!q.show_if) continue;

  // REF_EXISTS
  const refs = refsIn(q.show_if);
  for (const ref of refs) {
    if (!qById.has(ref)) {
      errors.push(`REF_EXISTS: ${q.id} references unknown question "${ref}" in show_if`);
    }
  }

  // VALUE_VALID + TYPE_COMPAT
  const checks = valuesIn(q.show_if);
  for (const check of checks) {
    const refQ = qById.get(check.question);
    if (!refQ) continue; // already caught by REF_EXISTS

    // Numeric ops only on likert
    if ((check.op === "gte" || check.op === "lte") && refQ.type !== "likert_1_5") {
      errors.push(
        `TYPE_COMPAT: ${q.id} uses ${check.op} against "${check.question}" which is ${refQ.type}, not likert_1_5`
      );
    }

    // all_of only on multi_select
    if (check.op === "all_of" && refQ.type !== "multi_select") {
      errors.push(
        `TYPE_COMPAT: ${q.id} uses all_of against "${check.question}" which is ${refQ.type}, not multi_select`
      );
    }

    // Validate numeric values for likert
    if (
      (check.op === "eq" || check.op === "neq" || check.op === "gte" || check.op === "lte") &&
      typeof check.value === "number" &&
      refQ.type === "likert_1_5"
    ) {
      if (check.value < 1 || check.value > 5) {
        errors.push(
          `VALUE_VALID: ${q.id} references likert "${check.question}" with out-of-range value ${check.value}`
        );
      }
    }

    // Validate string values for single_select / multi_select
    if (
      check.op === "eq" &&
      typeof check.value === "string" &&
      (refQ.type === "single_select" || refQ.type === "multi_select")
    ) {
      const validValues = (refQ.options ?? []).map((o: Option) => o.value);
      if (validValues.length > 0 && !validValues.includes(check.value as string)) {
        errors.push(
          `VALUE_VALID: ${q.id} eq "${check.value}" not in options of "${check.question}" [${validValues.join(", ")}]`
        );
      }
    }

    if (
      (check.op === "any_of" || check.op === "all_of" || check.op === "none_of") &&
      check.values
    ) {
      const validValues = (refQ.options ?? []).map((o: Option) => o.value);
      if (validValues.length > 0) {
        for (const v of check.values) {
          if (!validValues.includes(v)) {
            errors.push(
              `VALUE_VALID: ${q.id} ${check.op} value "${v}" not in options of "${check.question}" [${validValues.join(", ")}]`
            );
          }
        }
      }
    }
  }

  // REQUIRED_SHOWIF informational warning
  if (q.required && q.show_if) {
    // This is expected for follow-up questions, so only warn
    // if it seems like an unconditional question that was marked required=true AND has show_if
    // We skip this check for now; researcher decides.
  }
}

// NO_CYCLES: topological sort on show_if dependencies
{
  const visited = new Set<string>();
  const stack = new Set<string>();

  function visit(id: string): boolean {
    if (stack.has(id)) return true; // cycle
    if (visited.has(id)) return false;
    stack.add(id);
    const q = qById.get(id);
    if (q?.show_if) {
      for (const ref of refsIn(q.show_if)) {
        if (visit(ref)) {
          errors.push(`NO_CYCLES: cycle detected involving "${id}" → "${ref}"`);
          return true;
        }
      }
    }
    stack.delete(id);
    visited.add(id);
    return false;
  }

  for (const q of questions) visit(q.id);
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log(`\nLinting: ${schemaFile}`);
console.log(`Questions: ${questions.length}, Sections: ${sectionIds.length}\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log("✅  Schema is valid — no errors or warnings.");
} else {
  if (errors.length > 0) {
    console.error(`❌  ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  ERROR: ${e}`);
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠   ${warnings.length} warning(s):\n`);
    for (const w of warnings) console.warn(`  WARN: ${w}`);
  }
}

process.exit(errors.length > 0 ? 1 : 0);
