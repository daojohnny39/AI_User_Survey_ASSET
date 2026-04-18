import type { Question } from "@survey/shared";

interface Props {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function LongText({ question, value, onChange, hasError }: Props) {
  const max = question.max_length;
  const len = (value ?? "").length;
  const near = max && len > max * 0.9;

  return (
    <div>
      <textarea
        id={`input-${question.id}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        placeholder="Your answer"
        rows={4}
        className={`w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          hasError ? "border-red-400" : "border-slate-300"
        }`}
      />
      {max && (
        <p className={`text-right text-xs mt-0.5 ${near ? "text-amber-600" : "text-slate-400"}`}>
          {len}/{max}
        </p>
      )}
    </div>
  );
}
