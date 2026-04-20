import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
}

export function ScenarioCallout({ children, title }: Props) {
  return (
    <aside className="my-4 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
      {title && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">{title}</p>
      )}
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </aside>
  );
}
