import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card border-dashed px-6 py-10 text-center sm:px-8">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-ink-200 bg-ink-50">
        <Inbox className="h-5 w-5 text-ink-600" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink-950">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
