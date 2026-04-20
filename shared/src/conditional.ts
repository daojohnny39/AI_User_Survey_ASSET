import type {
  ShowIfCondition,
  AnswerMap,
  AnswerValue,
  MultiSelectAnswer,
  Survey,
  Question,
} from "./types.js";

function isMultiSelect(value: AnswerValue): value is MultiSelectAnswer {
  return (
    typeof value === "object" &&
    value !== null &&
    "selected" in value &&
    Array.isArray((value as MultiSelectAnswer).selected)
  );
}

function isAnswered(value: AnswerValue): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (isMultiSelect(value)) return value.selected.length > 0;
  return false;
}

export function evaluateCondition(
  cond: ShowIfCondition,
  answers: AnswerMap,
  visibilityMap: Map<string, boolean>
): boolean {
  switch (cond.op) {
    case "eq": {
      const val = answers[cond.question];
      return val === cond.value;
    }
    case "neq": {
      const val = answers[cond.question];
      return val !== cond.value;
    }
    case "any_of": {
      const val = answers[cond.question];
      if (isMultiSelect(val)) {
        return cond.values.some((v) => val.selected.includes(v));
      }
      if (typeof val === "string") return cond.values.includes(val);
      return false;
    }
    case "all_of": {
      const val = answers[cond.question];
      if (isMultiSelect(val)) {
        return cond.values.every((v) => val.selected.includes(v));
      }
      return false;
    }
    case "none_of": {
      const val = answers[cond.question];
      if (isMultiSelect(val)) {
        return cond.values.every((v) => !val.selected.includes(v));
      }
      if (typeof val === "string") return !cond.values.includes(val);
      return true;
    }
    case "gte": {
      const val = answers[cond.question];
      return typeof val === "number" && val >= cond.value;
    }
    case "lte": {
      const val = answers[cond.question];
      return typeof val === "number" && val <= cond.value;
    }
    case "answered": {
      return isAnswered(answers[cond.question]);
    }
    case "not_answered": {
      return !isAnswered(answers[cond.question]);
    }
    case "and": {
      return cond.conditions.every((c) =>
        evaluateCondition(c, answers, visibilityMap)
      );
    }
    case "or": {
      return cond.conditions.some((c) =>
        evaluateCondition(c, answers, visibilityMap)
      );
    }
    case "not": {
      return !evaluateCondition(cond.condition, answers, visibilityMap);
    }
  }
}

function referencedQuestions(cond: ShowIfCondition): string[] {
  switch (cond.op) {
    case "eq":
    case "neq":
    case "any_of":
    case "all_of":
    case "none_of":
    case "gte":
    case "lte":
    case "answered":
    case "not_answered":
      return [cond.question];
    case "and":
    case "or":
      return cond.conditions.flatMap(referencedQuestions);
    case "not":
      return referencedQuestions(cond.condition);
  }
}

/**
 * Branch-sensitive condition evaluator.
 *
 * Unlike evaluateCondition + a flat allParentsVisible check, this evaluates
 * parent visibility per-branch so that `or` conditions can reference mutually
 * exclusive hidden questions (e.g. q6a_general vs q6a_hybrid) without the
 * entire condition being blocked.
 *
 * Rules:
 *   - Leaf (eq, any_of, etc.): false if the referenced question is hidden.
 *   - or: true if at least one branch passes its own parent-visibility check.
 *   - and: true only if every branch passes.
 *   - not: false if any ref inside the inner condition is hidden (conservative).
 */
function evaluateBranchSensitive(
  cond: ShowIfCondition,
  answers: AnswerMap,
  visibilityMap: Map<string, boolean>
): boolean {
  switch (cond.op) {
    case "eq":
    case "neq":
    case "any_of":
    case "all_of":
    case "none_of":
    case "gte":
    case "lte":
    case "answered":
    case "not_answered":
      if (visibilityMap.get(cond.question) === false) return false;
      return evaluateCondition(cond, answers, visibilityMap);
    case "and":
      return cond.conditions.every((c) =>
        evaluateBranchSensitive(c, answers, visibilityMap)
      );
    case "or":
      return cond.conditions.some((c) =>
        evaluateBranchSensitive(c, answers, visibilityMap)
      );
    case "not": {
      const innerRefs = referencedQuestions(cond.condition);
      if (innerRefs.some((ref) => visibilityMap.get(ref) === false))
        return false;
      return !evaluateBranchSensitive(cond.condition, answers, visibilityMap);
    }
  }
}

/**
 * Computes a visibility map for all questions.
 * A question is visible iff:
 *   1. It has no show_if condition (always visible), OR
 *   2. Its show_if condition evaluates to true, with visibility checked
 *      per-branch so that `or` conditions across mutually exclusive parents
 *      work correctly.
 *
 * Runs to a fixed point to handle chains (Q10 → Q10a → Q10b).
 */
export function computeVisibility(
  survey: Survey,
  answers: AnswerMap
): Map<string, boolean> {
  const map = new Map<string, boolean>();

  // Initialize all to visible
  for (const q of survey.questions) {
    map.set(q.id, true);
  }

  // Iterate to fixed point (handles transitive chains)
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of survey.questions) {
      if (!q.show_if) continue;

      const newVisible = evaluateBranchSensitive(q.show_if, answers, map);
      if (map.get(q.id) !== newVisible) {
        map.set(q.id, newVisible);
        changed = true;
      }
    }
  }

  return map;
}

/**
 * Given a current answers map and a new answer for one question,
 * returns a cleaned answers map where all answers for now-hidden
 * questions have been removed.
 */
export function applyAnswerWithCleanup(
  survey: Survey,
  currentAnswers: AnswerMap,
  questionId: string,
  value: AnswerValue
): AnswerMap {
  const next: AnswerMap = { ...currentAnswers, [questionId]: value };
  const visibility = computeVisibility(survey, next);

  const cleaned: AnswerMap = {};
  for (const [qid, val] of Object.entries(next)) {
    if (visibility.get(qid) !== false) {
      cleaned[qid] = val;
    }
    // hidden question answers are dropped, not kept
  }
  return cleaned;
}

/**
 * Returns all question IDs that are visible but have no answer and are required.
 */
export function getMissingRequired(
  survey: Survey,
  answers: AnswerMap,
  limitToSection?: number
): string[] {
  const visibility = computeVisibility(survey, answers);
  const missing: string[] = [];

  for (const q of survey.questions) {
    if (limitToSection !== undefined && q.section_id !== limitToSection)
      continue;
    if (!q.required) continue;
    if (visibility.get(q.id) === false) continue;
    if (!isAnswered(answers[q.id])) {
      missing.push(q.id);
    }
  }

  return missing;
}

/**
 * Strips any answers for hidden questions from a payload before
 * writing to disk. Also verifies no hidden answers snuck in.
 * Returns { clean, smuggled } — smuggled should be empty for honest clients.
 */
export function auditAndCleanAnswers(
  survey: Survey,
  answers: AnswerMap
): { clean: AnswerMap; smuggled: string[] } {
  const visibility = computeVisibility(survey, answers);
  const clean: AnswerMap = {};
  const smuggled: string[] = [];

  for (const [qid, val] of Object.entries(answers)) {
    const q = survey.questions.find((q) => q.id === qid);
    if (!q) continue; // unknown key — skip silently

    if (visibility.get(qid) === false) {
      smuggled.push(qid);
    } else {
      clean[qid] = val;
    }
  }

  return { clean, smuggled };
}

export function getQuestionsForSection(
  survey: Survey,
  sectionId: number
): Question[] {
  return survey.questions.filter((q) => q.section_id === sectionId);
}
