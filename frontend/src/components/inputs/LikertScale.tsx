import type { Question } from "@survey/shared";

interface Props {
  question: Question;
  value: number | null;
  onChange: (value: number) => void;
  hasError?: boolean;
}

export function LikertScale({ question, value, onChange, hasError }: Props) {
  const minLabel = question.scale_min_label ?? "Strongly Disagree";
  const maxLabel = question.scale_max_label ?? "Strongly Agree";

  return (
    <div>
      <div
        className={`flex gap-2 ${hasError ? "rounded-xl p-2 ring-1 ring-red-300" : ""}`}
        role="radiogroup"
        aria-labelledby={`q-${question.id}-label`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={`flex flex-1 cursor-pointer select-none flex-col items-center gap-1.5 rounded-lg py-3 transition-all duration-150 active:scale-[0.91] ${
              value === n
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="text-base font-semibold leading-none">{n}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex justify-between px-1">
        <span className="max-w-[42%] text-xs leading-tight text-slate-500">{minLabel}</span>
        <span className="max-w-[42%] text-right text-xs leading-tight text-slate-500">{maxLabel}</span>
      </div>
    </div>
  );
}
