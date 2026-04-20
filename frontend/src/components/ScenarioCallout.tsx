import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
}

export function ScenarioCallout({ children, title }: Props) {
  return (
    <aside className="my-6 rounded-lg border-l-[6px] border-blue-500 bg-blue-50 px-5 py-4 shadow-sm">
      {title && (
        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-blue-600">{title}</p>
      )}
      <div className="text-sm leading-relaxed text-slate-800">{children}</div>
    </aside>
  );
}
