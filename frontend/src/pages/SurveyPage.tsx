import { useSurvey } from "../survey/SurveyProvider.js";
import { QuestionRenderer } from "../components/QuestionRenderer.js";
import { ProgressHeader } from "../components/ProgressHeader.js";
import { SectionStepper } from "../components/SectionStepper.js";
import { ScenarioCallout } from "../components/ScenarioCallout.js";

interface Props {
  onReview: () => void;
}

export function SurveyPage({ onReview }: Props) {
  const { state, setAnswer, goToSection, visibilityMap } = useSurvey();
  const { survey, currentSectionId, sectionStatuses, answers, saveIndicator } = state;

  const currentSection = survey.sections.find((s) => s.id === currentSectionId);
  const visibleQuestions = survey.questions.filter(
    (q) => q.section_id === currentSectionId && visibilityMap.get(q.id) !== false
  );

  const sectionIndex = survey.sections.findIndex((s) => s.id === currentSectionId);
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === survey.sections.length - 1;

  const handlePrev = () => {
    if (!isFirst) goToSection(survey.sections[sectionIndex - 1].id);
  };

  const handleNext = () => {
    if (isLast) {
      onReview();
    } else {
      goToSection(survey.sections[sectionIndex + 1].id);
    }
  };

  if (!currentSection) return null;

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="sticky top-0 h-screen overflow-y-auto p-2 pt-16">
          <SectionStepper
            sections={survey.sections}
            currentSectionId={currentSectionId}
            statuses={sectionStatuses}
            onNavigate={goToSection}
          />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <ProgressHeader
          currentSection={sectionIndex + 1}
          totalSections={survey.sections.length}
          saveIndicator={saveIndicator}
          onReview={onReview}
        />

        <main className="mx-auto w-full max-w-2xl px-4 py-8">
          <h2 className="mb-2 text-xl font-bold text-slate-800">{currentSection.title}</h2>

          {currentSection.description && (
            <ScenarioCallout title="Scenario">{currentSection.description}</ScenarioCallout>
          )}

          <div className="mt-6 space-y-8">
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

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {isLast ? "Review & Submit →" : "Next →"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
