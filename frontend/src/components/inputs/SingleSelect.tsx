import type { Question } from "@survey/shared";

interface Props {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function SingleSelect({ question, value, onChange, hasError }: Props) {
  return (
    <div className="space-y-2" role="radiogroup" aria-labelledby={`q-${question.id}-label`}>
      {(question.options ?? []).map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer select-none items-start gap-3 rounded-lg border p-3.5 transition-all duration-150 active:scale-[0.985] ${
            value === opt.value
              ? "border-indigo-400 bg-indigo-50 shadow-sm"
              : hasError
                ? "border-red-200 hover:border-slate-300 hover:bg-slate-50"
                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
          }`}
        >
          <input
            type="radio"
            name={question.id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm leading-snug text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
