interface Props {
  currentSection: number;
  totalSections: number;
  saveIndicator: boolean;
  onReview: () => void;
}

export function ProgressHeader({ currentSection, totalSections, saveIndicator, onReview }: Props) {
  const progress = (currentSection / totalSections) * 100;

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b bg-white px-4 shadow-sm">
      <div className="text-sm font-medium text-slate-600">
        Section {currentSection} of {totalSections}
      </div>

      <div className="absolute left-1/2 h-1.5 w-1/3 -translate-x-1/2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`text-xs font-medium text-green-600 transition-opacity duration-300 ${
            saveIndicator ? "opacity-100" : "opacity-0"
          }`}
        >
          Saved ✓
        </span>
        <button
          onClick={onReview}
          className="rounded border border-indigo-600 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Review &amp; Submit
        </button>
      </div>
    </header>
  );
}
