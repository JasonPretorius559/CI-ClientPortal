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
    <div className="surface-card space-y-6 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.65fr)] lg:items-stretch">
        <div className="relative min-w-0 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-brand-600">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.055em] text-ink-950 sm:text-[3.15rem]">
            {title}
          </h1>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-600 sm:text-[15px]">{description}</p> : null}
        </div>
        <div className="flex min-h-full flex-col justify-between gap-5 rounded-2xl border border-brand-100 bg-brand-50/65 p-4 lg:p-5">
          <div>
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <p className="text-[10px] font-bold uppercase tracking-[0.17em]">Review standard</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Evidence-linked, reviewable, and ready for a defensible decision.
            </p>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      </div>
      {tabs ? <div className="border-t border-surface-line pt-4">{tabs}</div> : null}
    </div>
  );
}
