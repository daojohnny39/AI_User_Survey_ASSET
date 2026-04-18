import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
}

export function ScenarioCallout({ children, title }: Props) {
  return (
    <aside className="my-4 rounded-md border-l-4 border-slate-300 bg-slate-50 p-4">
      {title && (
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      )}
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </aside>
  );
}
