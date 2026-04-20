import { useSurvey } from "../survey/SurveyProvider.js";
import { QuestionRenderer } from "../components/QuestionRenderer.js";
import { ProgressHeader } from "../components/ProgressHeader.js";
import { ScenarioCallout } from "../components/ScenarioCallout.js";

interface Props {
  onReview: () => void;
}

export function SurveyPage({ onReview }: Props) {
  const { state, setAnswer, goToSection, visibilityMap } = useSurvey();
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

  const handlePrev = () => {
    if (!isFirst) goToSection(visibleSections[sectionIndex - 1].id);
  };

  const handleNext = () => {
    if (isLast) {
      onReview();
    } else {
      goToSection(visibleSections[sectionIndex + 1].id);
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

      <main className="mx-auto w-full max-w-2xl px-4 py-10">
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
              showError={false}
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
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150"
          >
            {isLast ? "Review & Submit →" : "Next →"}
          </button>
        </div>
      </main>
    </div>
  );
}
