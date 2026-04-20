import { useState } from "react";
import { useSurvey } from "../survey/SurveyProvider.js";
import { submitSurvey } from "../api.js";
import { clearAllDrafts } from "../lib/autosave.js";

interface Props {
  onBack: () => void;
  onSubmitSuccess: (submissionId: string) => void;
}

export function ReviewPage({ onBack, onSubmitSuccess }: Props) {
  const { state, goToSection, allMissingRequired } = useSurvey();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wantsEmail, setWantsEmail] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  const hasRequired = allMissingRequired.length > 0;

  const handleMissingClick = (questionId: string) => {
    const q = state.survey.questions.find((q) => q.id === questionId);
    if (q) {
      goToSection(q.section_id);
      onBack();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitSurvey({
        draft_id: state.draftId,
        schema_version: state.survey.version,
        answers: state.answers,
        started_at: state.startedAt,
        completed_at: new Date().toISOString(),
        contact_email: wantsEmail && contactEmail ? contactEmail : undefined,
      });
      clearAllDrafts();
      onSubmitSuccess(result.submission_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">

        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors duration-150"
        >
          ← Back to Survey
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Review &amp; Submit</h1>
          {!hasRequired && (
            <p className="mt-1 text-sm text-slate-500">All required questions answered. You're ready to submit.</p>
          )}
        </div>

        {hasRequired && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="mb-3 text-sm font-semibold text-amber-800">
              Please answer these required questions before submitting:
            </p>
            <ul className="space-y-2">
              {allMissingRequired.map((qId) => {
                const q = state.survey.questions.find((q) => q.id === qId);
                return (
                  <li key={qId} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm text-amber-900">
                      {q?.prompt ?? `Question ${qId}`}
                    </span>
                    <button
                      onClick={() => handleMissingClick(qId)}
                      className="shrink-0 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
                    >
                      Go to section
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Email opt-in */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Optional</p>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={wantsEmail}
              onChange={(e) => setWantsEmail(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">
              I'd like to receive updates about this research
            </span>
          </label>
          {wantsEmail && (
            <input
              type="email"
              placeholder="your@email.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={hasRequired || submitting}
          className="w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {submitting ? "Submitting…" : "Submit Survey"}
        </button>
      </div>
    </div>
  );
}
