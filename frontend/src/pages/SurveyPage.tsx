import { getMissingRequired } from "@survey/shared";
import { useSurvey } from "../survey/SurveyProvider.js";
import { QuestionRenderer } from "../components/QuestionRenderer.js";
import { ProgressHeader } from "../components/ProgressHeader.js";
import { ScenarioCallout } from "../components/ScenarioCallout.js";
import { SectionStepper } from "../components/SectionStepper.js";

interface Props {
  onReview: () => void;
}

export function SurveyPage({ onReview }: Props) {
  const { state, setAnswer, goToSection, advanceToSection, visibilityMap } = useSurvey();
  const { survey, currentSectionId, answers, saveIndicator } = state;

  const visibleSections = survey.sections.filter((s) =>
    survey.questions.some((q) => q.section_id === s.id && visibilityMap.get(q.id) !== false)
  );

  const currentSection = survey.sections.find((s) => s.id === currentSectionId);
  const visibleQuestions = survey.questions.filter(
    (q) => q.section_id === currentSectionId && visibilityMap.get(q.id) !== false
  );

  const sectionIndex = visibleSections.findIndex((s) => s.id === currentSectionId);
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === visibleSections.length - 1;

  const currentSectionMissing = getMissingRequired(survey, answers, currentSectionId);
  const hasUnanswered = currentSectionMissing.length > 0;

  const handlePrev = () => {
    if (!isFirst) {
      goToSection(visibleSections[sectionIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = () => {
    if (isLast) {
      onReview();
    } else {
      advanceToSection(visibleSections[sectionIndex + 1].id);
    }
    window.scrollTo(0, 0);
  };

  const devSidebar = import.meta.env.VITE_DEV_SIDEBAR === "true";

  const handleSidebarNavigate = (sectionId: number) => {
    if (devSidebar || sectionId <= state.maxReachedSectionId) {
      goToSection(sectionId);
      window.scrollTo(0, 0);
    }
  };

  if (!currentSection) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ProgressHeader
        currentSection={sectionIndex + 1}
        totalSections={visibleSections.length}
        sectionTitle={currentSection.title}
        saveIndicator={saveIndicator}
        onReview={onReview}
      />

      <div className="flex flex-1">
        {/* Left sidebar — dev only (VITE_DEV_SIDEBAR=true) */}
        <aside className={`${devSidebar ? "flex" : "hidden"} w-56 xl:w-64 shrink-0 border-r border-slate-200 bg-white`}>
          <div className="sticky top-[60px] h-[calc(100vh-60px)] w-full overflow-y-auto px-2 py-4">
            <SectionStepper
              sections={visibleSections}
              currentSectionId={currentSectionId}
              statuses={state.sectionStatuses}
              maxReachedSectionId={state.maxReachedSectionId}
              onNavigate={handleSidebarNavigate}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-10">
          <div className="mx-auto max-w-2xl">
            {/* Section heading */}
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-500">
                Section {sectionIndex + 1} of {visibleSections.length}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 leading-snug">{currentSection.title}</h2>
            </div>

            {currentSection.description && (
              <ScenarioCallout title="Scenario">{currentSection.description}</ScenarioCallout>
            )}

            <div className="mt-8 space-y-10">
              {visibleQuestions.map((q) => (
                <QuestionRenderer
                  key={q.id}
                  question={q}
                  value={answers[q.id] ?? null}
                  onChange={(val) => setAnswer(q.id, val)}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={hasUnanswered}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:active:scale-100"
              >
                {isLast ? "Review & Submit →" : "Next →"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
