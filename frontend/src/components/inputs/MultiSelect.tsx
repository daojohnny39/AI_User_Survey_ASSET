import { useState, useEffect } from "react";
import type { Question } from "@survey/shared";
import type { MultiSelectAnswer } from "@survey/shared";

interface Props {
  question: Question;
  value: MultiSelectAnswer | null;
  onChange: (value: MultiSelectAnswer) => void;
  hasError?: boolean;
}

export function MultiSelect({ question, value, onChange, hasError }: Props) {
  const selected = value?.selected ?? [];
  const [otherText, setOtherText] = useState(value?.other_text ?? "");

  useEffect(() => {
    setOtherText(value?.other_text ?? "");
  }, [value?.other_text]);

  const toggle = (optValue: string) => {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange({ selected: next, other_text: otherText || undefined });
  };

  const hasOther = (question.options ?? []).some((o) => o.allow_text);
  const otherSelected = selected.includes("other");

  const handleOtherText = (text: string) => {
    setOtherText(text);
    onChange({ selected, other_text: text || undefined });
  };

  return (
    <div className="space-y-2">
      {(question.options ?? []).map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(opt.value)
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          } ${hasError ? "border-red-300" : ""}`}
        >
          <input
            type="checkbox"
            value={opt.value}
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="mt-0.5 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 flex-shrink-0"
          />
          <span className="text-sm text-slate-700 leading-snug">{opt.label}</span>
        </label>
      ))}
      {hasOther && otherSelected && (
        <div className="ml-7 mt-1">
          <input
            type="text"
            placeholder="Please specify…"
            value={otherText}
            onChange={(e) => handleOtherText(e.target.value)}
            maxLength={200}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
