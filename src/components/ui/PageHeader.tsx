import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tabs?: ReactNode;
};

export function PageHeader({ title, description, action, tabs }: PageHeaderProps) {
  return (
    <div className="surface-card space-y-8 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.7fr)] lg:items-end">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">Cloud Insure Portal</p>
          <h1 className="mt-4 max-w-4xl text-[2.25rem] font-semibold leading-none tracking-[-0.06em] text-ink-950 sm:text-[3.4rem]">
            {title}
          </h1>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-[15px]">{description}</p> : null}
        </div>
        <div className="flex min-h-full flex-col justify-between gap-4 border-t border-surface-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Workspace</p>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Structured case operations with a focused review flow across desktop and mobile.
            </p>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      </div>
      {tabs ? <div className="border-t border-surface-line pt-4">{tabs}</div> : null}
    </div>
  );
}
