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
        className={`flex gap-2 ${hasError ? "ring-1 ring-red-300 rounded-xl p-2" : ""}`}
        role="radiogroup"
        aria-labelledby={`q-${question.id}-label`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={`flex flex-col items-center gap-1 flex-1 cursor-pointer p-2 rounded-lg transition-colors ${
              value === n
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
            <span className="text-lg font-semibold">{n}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-xs text-slate-500 max-w-[45%]">{minLabel}</span>
        <span className="text-xs text-slate-500 max-w-[45%] text-right">{maxLabel}</span>
      </div>
    </div>
  );
}
