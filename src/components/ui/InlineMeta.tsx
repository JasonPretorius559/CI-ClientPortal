import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type MetaItem = {
  label: string;
  value: ReactNode;
};

export function InlineMeta({
  items,
  className,
}: {
  items: MetaItem[];
  className?: string;
}) {
  return (
    <dl className={cn("inline-meta", className)}>
      {items.map((item) => (
        <div key={item.label} className="inline-meta-item">
          <dt className="inline-meta-label">{item.label}</dt>
          <dd className="inline-meta-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
