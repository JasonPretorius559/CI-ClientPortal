import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-10 text-center">
      <Inbox className="mx-auto h-10 w-10 text-ink-500" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold text-ink-950">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
