import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tabs?: ReactNode;
};

export function PageHeader({ title, description, action, tabs }: PageHeaderProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-ink-950 sm:text-[2.4rem]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600 sm:text-[15px]">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {tabs ? tabs : null}
    </div>
  );
}
