interface Props {
  surveyTitle: string;
  sectionCount: number;
  questionCount: number;
  hasDraft: boolean;
  onBegin: () => void;
  onResume: () => void;
}

export function LandingPage({ surveyTitle, sectionCount, questionCount, hasDraft, onBegin, onResume }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="flex h-12 w-36 items-center justify-center rounded bg-slate-200 text-sm font-semibold text-slate-500">
            ASSET Lab
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-800">{surveyTitle}</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Approximately 25–35 minutes</p>

        <div className="mb-8 border-l-4 border-slate-300 pl-4">
          <p className="text-sm italic text-slate-600 leading-relaxed">
            Your responses are anonymous. We do not collect IP addresses or identifying information
            unless you voluntarily provide your email at the end. Your progress is saved locally in
            your browser.
          </p>
        </div>

        <p className="mb-8 text-center text-xs text-slate-400">
          {sectionCount} sections &bull; ~{questionCount} questions
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {hasDraft ? (
            <>
              <button
                onClick={onResume}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Resume where I left off
              </button>
              <button
                onClick={onBegin}
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Start fresh
              </button>
            </>
          ) : (
            <button
              onClick={onBegin}
              className="rounded-lg bg-indigo-600 px-10 py-3 text-base font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Begin Survey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
