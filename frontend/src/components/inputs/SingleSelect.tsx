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
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value === opt.value
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          } ${hasError ? "border-red-300" : ""}`}
        >
          <input
            type="radio"
            name={question.id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
          />
          <span className="text-sm text-slate-700 leading-snug">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
