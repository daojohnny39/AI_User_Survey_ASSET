/**
 * Strict schema-aware validation of a submission's answers map.
 *
 * Zod validates the payload shape; this validates CONTENT:
 * - Every answer key is a known question.id
 * - Single/multi-select values are declared option values
 * - Likert values are integers 1-5
 * - Text lengths respect max_length
 */

import type { Survey, AnswerMap, Question } from "@survey/shared";

export interface ValidationError {
  question_id: string;
  message: string;
}

export function validateAnswers(
  survey: Survey,
  answers: AnswerMap
): ValidationError[] {
  const errors: ValidationError[] = [];
  const qById = new Map<string, Question>(
    survey.questions.map((q) => [q.id, q])
  );

  for (const [qid, value] of Object.entries(answers)) {
    if (value === null) continue;

    const q = qById.get(qid);
    if (!q) {
      errors.push({ question_id: qid, message: "Unknown question id" });
      continue;
    }

    if (q.type === "likert_1_5") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        errors.push({
          question_id: qid,
          message: `Likert value must be integer 1-5, got: ${JSON.stringify(value)}`,
        });
      }
    } else if (q.type === "single_select") {
      if (typeof value !== "string") {
        errors.push({ question_id: qid, message: "Expected string value" });
        continue;
      }
      const valid = (q.options ?? []).map((o) => o.value);
      if (valid.length > 0 && !valid.includes(value)) {
        errors.push({
          question_id: qid,
          message: `Value "${value}" is not a declared option [${valid.join(", ")}]`,
        });
      }
    } else if (q.type === "multi_select") {
      if (
        typeof value !== "object" ||
        !("selected" in (value as object)) ||
        !Array.isArray((value as { selected: unknown }).selected)
      ) {
        errors.push({
          question_id: qid,
          message: "Expected { selected: string[], other_text?: string }",
        });
        continue;
      }
      const ms = value as { selected: string[]; other_text?: string };
      const valid = (q.options ?? []).map((o) => o.value);
      for (const sel of ms.selected) {
        if (valid.length > 0 && !valid.includes(sel)) {
          errors.push({
            question_id: qid,
            message: `Selected value "${sel}" is not a declared option`,
          });
        }
      }
    } else if (
      q.type === "short_text" ||
      q.type === "long_text" ||
      q.type === "email"
    ) {
      if (typeof value !== "string") {
        errors.push({ question_id: qid, message: "Expected string value" });
        continue;
      }
      if (q.max_length && value.length > q.max_length) {
        errors.push({
          question_id: qid,
          message: `Text exceeds max_length of ${q.max_length} (got ${value.length})`,
        });
      }
      if (q.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ question_id: qid, message: "Invalid email address" });
      }
    }
  }

  return errors;
}
