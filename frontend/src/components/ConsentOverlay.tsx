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
            <p>
              By proceeding, you acknowledge that the responses you provide in this
              survey will be collected and used for research purposes by ASSET Lab.
            </p>
            <p>
              Your responses are anonymous unless you voluntarily share contact
              information at the end. You may stop and close the page at any time.
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
