import type { SectionStatus } from "../survey/SurveyProvider.js";

interface Props {
  sections: Array<{ id: number; title: string }>;
  currentSectionId: number;
  statuses: Record<number, SectionStatus>;
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

export function SectionStepper({ sections, currentSectionId, statuses, onNavigate }: Props) {
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section) => {
        const isCurrent = section.id === currentSectionId;
        return (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
              isCurrent
                ? "border-l-4 border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCurrent ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {section.id}
            </span>
            <span className="flex-1 truncate text-xs font-medium">{section.title}</span>
            {statusIcon(statuses[section.id] ?? "unvisited")}
          </button>
        );
      })}
    </nav>
  );
}
