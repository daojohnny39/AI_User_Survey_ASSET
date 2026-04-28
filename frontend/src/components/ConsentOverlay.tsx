import { useEffect, useState, type TransitionEvent } from "react";

interface Props {
  onAgree: () => void;
  onDisagree: () => void;
}

type Phase = "entering" | "open" | "exiting-agree" | "exiting-disagree";

export function ConsentOverlay({ onAgree, onDisagree }: Props) {
  const [phase, setPhase] = useState<Phase>("entering");

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("open"));
    return () => cancelAnimationFrame(id);
  }, []);

  const open = phase === "open";
  const exiting = phase === "exiting-agree" || phase === "exiting-disagree";

  function handleModalTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform") return;
    if (phase === "exiting-agree") onAgree();
    else if (phase === "exiting-disagree") onDisagree();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24">
      <div
        className={`absolute inset-0 bg-slate-900/30 transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        onTransitionEnd={handleModalTransitionEnd}
        className={`relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all duration-500 ease-out ${
          open ? "translate-y-0 opacity-100" : "-translate-y-[120vh] opacity-0"
        }`}
      >
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <h2 id="consent-title" className="text-xl font-bold text-slate-900">
            Consent to participate
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
            <p style={{textIndent: "1.5em"}}>
              This survey is part of a study which intends to understand the user perception of AI.
All responses are treated as confidential, and in no case will responses from individual
participants be identified. Rather, all data will be pooled and published in aggregate form only.
To help protect your confidentiality, the surveys will not contain information that will personally
identify you. The results of this study will be used for scholarly purposes only.
            </p>
            <p style={{textIndent: "1.5em"}}>
              If participants have further questions about this study or their rights, or if they wish to lodge a
complaint or concern, they may contact the investigator at <a href="mailto:schattopadhyay@umkc.edu" className="text-indigo-600 hover:underline">schattopadhyay@umkc.edu</a>. 
If you are 18 years of age or older, understand the statements above, and freely consent to
participate in the survey, check the "I Agree" option to begin the survey.
            </p>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPhase("exiting-disagree")}
              disabled={exiting}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              I disagree
            </button>
            <button
              type="button"
              onClick={() => setPhase("exiting-agree")}
              disabled={exiting}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              I agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
