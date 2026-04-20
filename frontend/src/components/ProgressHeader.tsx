interface Props {
  currentSection: number;
  totalSections: number;
  sectionTitle?: string;
  saveIndicator: boolean;
  onReview: () => void;
}

export function ProgressHeader({ currentSection, totalSections, sectionTitle, saveIndicator, onReview }: Props) {
  const progress = (currentSection / totalSections) * 100;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: section counter */}
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            {currentSection} / {totalSections}
          </span>
          {sectionTitle && (
            <span className="truncate text-sm font-medium text-slate-700 hidden sm:block">
              {sectionTitle}
            </span>
          )}
        </div>

        {/* Right: save status + review button */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs font-medium text-emerald-600 transition-opacity duration-300 ${
              saveIndicator ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            Saved
          </span>
          <button
            onClick={onReview}
            className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors duration-150"
          >
            Review &amp; Submit
          </button>
        </div>
      </div>

      {/* Progress bar — full width, pinned to bottom of header */}
      <div className="h-0.5 w-full bg-slate-100">
        <div
          className="h-full bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentSection}
          aria-valuemin={1}
          aria-valuemax={totalSections}
        />
      </div>
    </header>
  );
}
