import type { Question, AnswerValue, MultiSelectAnswer } from "@survey/shared";
import { SingleSelect } from "./inputs/SingleSelect.js";
import { MultiSelect } from "./inputs/MultiSelect.js";
import { LikertScale } from "./inputs/LikertScale.js";
import { ShortText } from "./inputs/ShortText.js";
import { LongText } from "./inputs/LongText.js";
import { EmailInput } from "./inputs/EmailInput.js";
import { CountrySelect } from "./inputs/CountrySelect.js";

interface Props {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  showError?: boolean;
}

function displayNum(id: string): string {
  if (id.startsWith("sf")) return "SF" + id.slice(2).toUpperCase();
  if (id.startsWith("q")) return id.slice(1);
  return id;
}

export function QuestionRenderer({ question, value, onChange, showError }: Props) {
  const missingRequired = showError && question.required && (value === null || value === undefined);

  const input = () => {
    switch (question.type) {
      case "single_select":
        return (
          <SingleSelect
            question={question}
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "multi_select":
        return (
          <MultiSelect
            question={question}
            value={
              typeof value === "object" && value !== null && "selected" in value
                ? (value as MultiSelectAnswer)
                : null
            }
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "likert_1_5":
        return (
          <LikertScale
            question={question}
            value={typeof value === "number" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "short_text":
        return (
          <ShortText
            question={question}
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "long_text":
        return (
          <LongText
            question={question}
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "email":
        return (
          <EmailInput
            question={question}
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
      case "country_select":
        return (
          <CountrySelect
            question={question}
            value={typeof value === "string" ? value : null}
            onChange={onChange}
            hasError={missingRequired}
          />
        );
    }
  };

  return (
    <div id={`q-${question.id}`} className="scroll-mt-20">
      {/* Question number badge + required marker */}
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100">
          Q{displayNum(question.id)}
        </span>
        {question.required && (
          <span className="text-xs font-medium text-slate-400" aria-label="required">
            Required
          </span>
        )}
      </div>

      {/* Question text */}
      <p
        id={`q-${question.id}-label`}
        className="mb-4 text-[15px] font-medium leading-relaxed text-slate-800"
      >
        {question.prompt}
      </p>

      {input()}

      {missingRequired && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          This question requires an answer.
        </p>
      )}
    </div>
  );
}
