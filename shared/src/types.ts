export type QuestionType =
  | "single_select"
  | "multi_select"
  | "likert_1_5"
  | "short_text"
  | "long_text"
  | "email"
  | "country_select";

export interface Option {
  value: string;
  label: string;
  allow_text?: boolean; // true for "Other: ___" options
}

export type ShowIfCondition =
  | { op: "eq"; question: string; value: string | number }
  | { op: "neq"; question: string; value: string | number }
  | { op: "any_of"; question: string; values: string[] }
  | { op: "all_of"; question: string; values: string[] }
  | { op: "none_of"; question: string; values: string[] }
  | { op: "gte"; question: string; value: number }
  | { op: "lte"; question: string; value: number }
  | { op: "answered"; question: string }
  | { op: "not_answered"; question: string }
  | { op: "and"; conditions: ShowIfCondition[] }
  | { op: "or"; conditions: ShowIfCondition[] }
  | { op: "not"; condition: ShowIfCondition };

export interface Question {
  id: string;
  section_id: number;
  section_title: string;
  prompt: string;
  type: QuestionType;
  required: boolean;
  options?: Option[];
  max_length?: number;
  scale_min_label?: string; // for likert
  scale_max_label?: string;
  show_if?: ShowIfCondition;
}

export interface Section {
  id: number;
  title: string;
  description?: string;
}

export interface Survey {
  version: string;
  title: string;
  sections: Section[];
  questions: Question[];
}

// Answer value types per question type
export type SingleSelectAnswer = string;
export type MultiSelectAnswer = { selected: string[]; other_text?: string };
export type LikertAnswer = number; // 1-5
export type TextAnswer = string;
export type EmailAnswer = string;

export type AnswerValue =
  | SingleSelectAnswer
  | MultiSelectAnswer
  | LikertAnswer
  | TextAnswer
  | EmailAnswer
  | null;

export type AnswerMap = Record<string, AnswerValue>;

// Result of a submission
export interface SubmissionPayload {
  draft_id: string;
  schema_version: string;
  answers: AnswerMap;
  started_at: string;
  completed_at: string;
  contact_email?: string;
}

export interface SubmissionRecord {
  submission_id: string;
  schema_version: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  answers: AnswerMap;
}
