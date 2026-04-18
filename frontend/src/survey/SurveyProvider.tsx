import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { Survey, AnswerMap, AnswerValue } from "@survey/shared";
import {
  applyAnswerWithCleanup,
  computeVisibility,
  getMissingRequired,
} from "@survey/shared";
import { saveDraft } from "../lib/autosave.js";

// ── State ─────────────────────────────────────────────────────────────────────

export type SectionStatus =
  | "unvisited"
  | "in_progress"
  | "complete"
  | "has_missing";

export interface SurveyState {
  survey: Survey;
  draftId: string;
  answers: AnswerMap;
  startedAt: string;
  currentSectionId: number;
  sectionStatuses: Record<number, SectionStatus>;
  saveIndicator: boolean; // briefly true after each save
}

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_ANSWER"; questionId: string; value: AnswerValue }
  | { type: "GO_TO_SECTION"; sectionId: number }
  | { type: "SHOW_SAVE_INDICATOR" }
  | { type: "HIDE_SAVE_INDICATOR" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeSectionStatuses(
  survey: Survey,
  answers: AnswerMap,
  currentSectionId: number,
  prevStatuses: Record<number, SectionStatus>
): Record<number, SectionStatus> {
  const statuses: Record<number, SectionStatus> = {};
  for (const section of survey.sections) {
    const sid = section.id;
    const missing = getMissingRequired(survey, answers, sid);
    const sectionQs = survey.questions.filter((q) => q.section_id === sid);
    const visibility = computeVisibility(survey, answers);
    const visible = sectionQs.filter((q) => visibility.get(q.id) !== false);
    const answered = visible.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null);

    if (sid === currentSectionId) {
      statuses[sid] = missing.length > 0 ? "in_progress" : "complete";
    } else if (prevStatuses[sid] === "unvisited" && answered.length === 0) {
      statuses[sid] = "unvisited";
    } else if (missing.length > 0 && answered.length > 0) {
      statuses[sid] = "has_missing";
    } else if (missing.length === 0 && answered.length > 0) {
      statuses[sid] = "complete";
    } else {
      statuses[sid] = prevStatuses[sid] ?? "unvisited";
    }
  }
  return statuses;
}

function initialStatuses(survey: Survey, currentSectionId: number): Record<number, SectionStatus> {
  return Object.fromEntries(
    survey.sections.map((s) => [
      s.id,
      s.id === currentSectionId ? "in_progress" : "unvisited",
    ])
  );
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: SurveyState, action: Action): SurveyState {
  switch (action.type) {
    case "SET_ANSWER": {
      const newAnswers = applyAnswerWithCleanup(
        state.survey,
        state.answers,
        action.questionId,
        action.value
      );
      const newStatuses = computeSectionStatuses(
        state.survey,
        newAnswers,
        state.currentSectionId,
        state.sectionStatuses
      );
      return { ...state, answers: newAnswers, sectionStatuses: newStatuses };
    }
    case "GO_TO_SECTION": {
      const newStatuses = computeSectionStatuses(
        state.survey,
        state.answers,
        action.sectionId,
        state.sectionStatuses
      );
      return {
        ...state,
        currentSectionId: action.sectionId,
        sectionStatuses: newStatuses,
      };
    }
    case "SHOW_SAVE_INDICATOR":
      return { ...state, saveIndicator: true };
    case "HIDE_SAVE_INDICATOR":
      return { ...state, saveIndicator: false };
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface SurveyContextValue {
  state: SurveyState;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  goToSection: (sectionId: number) => void;
  visibilityMap: Map<string, boolean>;
  allMissingRequired: string[];
}

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function useSurvey(): SurveyContextValue {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface SurveyProviderProps {
  survey: Survey;
  initialDraftId?: string;
  initialAnswers?: AnswerMap;
  initialStartedAt?: string;
  initialSectionId?: number;
  children: React.ReactNode;
}

export function SurveyProvider({
  survey,
  initialDraftId,
  initialAnswers = {},
  initialStartedAt,
  initialSectionId = 1,
  children,
}: SurveyProviderProps) {
  const draftId = initialDraftId ?? uuidv4();
  const startedAt = initialStartedAt ?? new Date().toISOString();

  const [state, dispatch] = useReducer(reducer, {
    survey,
    draftId,
    answers: initialAnswers,
    startedAt,
    currentSectionId: initialSectionId,
    sectionStatuses: initialStatuses(survey, initialSectionId),
    saveIndicator: false,
  });

  // Autosave: debounced 800ms after each answer change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(draftId, {
        answers: state.answers,
        startedAt: state.startedAt,
        currentSectionId: state.currentSectionId,
      });
      dispatch({ type: "SHOW_SAVE_INDICATOR" });
      setTimeout(() => dispatch({ type: "HIDE_SAVE_INDICATOR" }), 1800);
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answers]);

  const setAnswer = useCallback(
    (questionId: string, value: AnswerValue) =>
      dispatch({ type: "SET_ANSWER", questionId, value }),
    []
  );

  const goToSection = useCallback(
    (sectionId: number) => dispatch({ type: "GO_TO_SECTION", sectionId }),
    []
  );

  const visibilityMap = computeVisibility(survey, state.answers);
  const allMissingRequired = getMissingRequired(survey, state.answers);

  return (
    <SurveyContext.Provider
      value={{ state, setAnswer, goToSection, visibilityMap, allMissingRequired }}
    >
      {children}
    </SurveyContext.Provider>
  );
}
