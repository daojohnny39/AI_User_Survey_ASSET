import type { Question } from "@survey/shared";

interface Props {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function EmailInput({ question, value, onChange, hasError }: Props) {
  return (
    <input
      type="email"
      id={`input-${question.id}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="your@email.com"
      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        hasError ? "border-red-400" : "border-slate-300"
      }`}
    />
  );
}
