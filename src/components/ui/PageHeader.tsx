import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tabs?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, action, tabs, eyebrow = "Analysis workspace" }: PageHeaderProps) {
  return (
    <header className="surface-card px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 pl-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-brand-600">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 max-w-4xl text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-ink-950 sm:text-[2.5rem]">
            {title}
          </h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{description}</p> : null}
        </div>
        {action ? (
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em]">Review standard</p>
                <p className="mt-0.5 text-xs text-ink-600">Evidence-linked and reviewable</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">{action}</div>
          </div>
        ) : null}
      </div>
      {tabs ? <div className="mt-5 border-t border-surface-line pt-4">{tabs}</div> : null}
    </header>
  );
}
