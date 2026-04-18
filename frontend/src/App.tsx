import { useState, useEffect } from "react";
import { fetchSurvey } from "./api.js";
import { SurveyProvider } from "./survey/SurveyProvider.js";
import { LandingPage } from "./pages/LandingPage.js";
import { SurveyPage } from "./pages/SurveyPage.js";
import { ReviewPage } from "./pages/ReviewPage.js";
import { ThankYouPage } from "./pages/ThankYouPage.js";
import { findExistingDraft, clearAllDrafts } from "./lib/autosave.js";
import type { Survey, AnswerMap } from "@survey/shared";
import type { DraftData } from "./lib/autosave.js";

type Page = "landing" | "survey" | "review" | "thankyou";

export function App() {
  const [page, setPage] = useState<Page>("landing");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState("");
  const [draft, setDraft] = useState<DraftData | null>(null);
  // When "Start fresh" is chosen, we clear draft and pass no initial data
  const [useDraft, setUseDraft] = useState(false);

  useEffect(() => {
    fetchSurvey()
      .then((s) => {
        setSurvey(s);
        const found = findExistingDraft();
        if (found) setDraft(found);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load survey.";
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm">Loading survey…</p>
        </div>
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-bold">Unable to load survey</p>
          <p className="mt-1 text-sm">{loadError ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  if (page === "landing") {
    return (
      <LandingPage
        surveyTitle={survey.title}
        sectionCount={survey.sections.length}
        questionCount={survey.questions.length}
        hasDraft={draft !== null}
        onBegin={() => {
          clearAllDrafts();
          setDraft(null);
          setUseDraft(false);
          setPage("survey");
        }}
        onResume={() => {
          setUseDraft(true);
          setPage("survey");
        }}
      />
    );
  }

  const activeDraft = useDraft ? draft : null;

  return (
    <SurveyProvider
      survey={survey}
      initialDraftId={activeDraft?.draftId}
      initialAnswers={activeDraft?.answers as AnswerMap | undefined}
      initialStartedAt={activeDraft?.startedAt}
      initialSectionId={activeDraft?.currentSectionId}
    >
      {page === "survey" && <SurveyPage onReview={() => setPage("review")} />}
      {page === "review" && (
        <ReviewPage
          onBack={() => setPage("survey")}
          onSubmitSuccess={(id) => {
            setSubmissionId(id);
            setPage("thankyou");
          }}
        />
      )}
      {page === "thankyou" && <ThankYouPage submissionId={submissionId} />}
    </SurveyProvider>
  );
}
