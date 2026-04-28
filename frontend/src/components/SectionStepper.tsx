import type { SectionStatus } from "../survey/SurveyProvider.js";

interface Props {
  sections: Array<{ id: number; title: string }>;
  currentSectionId: number;
  statuses: Record<number, SectionStatus>;
  maxReachedSectionId: number;
  onNavigate: (sectionId: number) => void;
}

function statusIcon(status: SectionStatus) {
  switch (status) {
    case "complete":    return <span className="text-green-500 text-xs">✓</span>;
    case "has_missing": return <span className="text-amber-500 text-xs">⚠</span>;
    case "in_progress": return <span className="text-indigo-500 text-xs">●</span>;
    default:            return <span className="text-slate-300 text-xs">○</span>;
  }
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-3 text-slate-300"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 1a5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 7V6a3 3 0 10-6 0v2h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function SectionStepper({ sections, currentSectionId, statuses, maxReachedSectionId, onNavigate }: Props) {
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section, index) => {
        const isCurrent = section.id === currentSectionId;
        const isLocked = section.id > maxReachedSectionId;

        return (
          <button
            key={section.id}
            onClick={() => { if (!isLocked) onNavigate(section.id); }}
            disabled={isLocked}
            aria-disabled={isLocked}
            title={isLocked ? "Complete earlier sections to unlock" : section.title}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
              isLocked
                ? "cursor-not-allowed border-l-4 border-transparent text-slate-300"
                : isCurrent
                  ? "border-l-4 border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isLocked
                  ? "bg-slate-100 text-slate-300"
                  : isCurrent
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {index + 1}
            </span>
            <span className={`flex-1 truncate text-xs font-medium ${isLocked ? "text-slate-300" : ""}`}>
              {section.title}
            </span>
            {isLocked ? <LockIcon /> : statusIcon(statuses[section.id] ?? "unvisited")}
          </button>
        );
      })}
    </nav>
  );
}
