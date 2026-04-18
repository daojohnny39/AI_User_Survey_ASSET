import type { Question, AnswerValue, MultiSelectAnswer } from "@survey/shared";
import { SingleSelect } from "./inputs/SingleSelect.js";
import { MultiSelect } from "./inputs/MultiSelect.js";
import { LikertScale } from "./inputs/LikertScale.js";
import { ShortText } from "./inputs/ShortText.js";
import { LongText } from "./inputs/LongText.js";
import { EmailInput } from "./inputs/EmailInput.js";

interface Props {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  showError?: boolean;
}

/** Derives a human-readable display number from the question id.
 *  "q10a" → "10a", "sf4" → "SF4" */
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
    }
  };

  return (
    <div id={`q-${question.id}`} className="scroll-mt-24">
      <p
        id={`q-${question.id}-label`}
        className="text-sm font-medium text-slate-500 mb-1"
      >
        Question {displayNum(question.id)}
        {question.required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </p>
      <p className="text-base text-slate-800 mb-3 leading-relaxed font-medium">
        {question.prompt}
      </p>
      {input()}
      {missingRequired && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          This question requires an answer.
        </p>
      )}
    </div>
  );
}
