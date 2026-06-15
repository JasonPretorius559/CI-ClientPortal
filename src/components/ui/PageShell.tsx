import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export function PageShell({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("page-shell", className)} {...props} />;
}

export function PageSection({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={cn("page-section", className)} {...props} />;
}

export function ActionCluster({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("action-cluster", className)} {...props} />;
}

export function SectionDivider({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("section-divider", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
