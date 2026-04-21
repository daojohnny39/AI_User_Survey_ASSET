interface Props {
  surveyTitle: string;
  minSectionCount: number;
  maxSectionCount: number;
  minQuestionCount: number;
  maxQuestionCount: number;
  hasDraft: boolean;
  onBegin: () => void;
  onResume: () => void;
}

export function LandingPage({ surveyTitle, minSectionCount, maxSectionCount, minQuestionCount, maxQuestionCount, hasDraft, onBegin, onResume }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-xl">

        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-800 px-5 py-2.5">
            <div className="h-5 w-1 rounded-full bg-indigo-400" />
            <span className="text-sm font-bold tracking-wide text-white">ASSET Lab</span>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 leading-tight">{surveyTitle}</h1>
          <p className="text-base text-slate-500">Approximately 25–35 minutes to complete</p>
        </div>

        {/* Meta info */}
        <div className="mb-8 flex justify-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-slate-800">{minSectionCount === maxSectionCount ? minSectionCount : `${minSectionCount}–${maxSectionCount}`}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Sections</span>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-slate-800">{minQuestionCount === maxQuestionCount ? minQuestionCount : `${minQuestionCount}–${maxQuestionCount}`}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Questions</span>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-700">Your responses are anonymous.</span>{" "}
            We do not collect IP addresses or identifying information unless you voluntarily provide your
            email at the end. Your progress is saved locally in your browser.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {hasDraft ? (
            <>
              <button
                onClick={onResume}
                className="rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150"
              >
                Resume where I left off
              </button>
              <button
                onClick={onBegin}
                className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Start fresh
              </button>
            </>
          ) : (
            <button
              onClick={onBegin}
              className="rounded-lg bg-indigo-600 px-12 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150"
            >
              Begin Survey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
