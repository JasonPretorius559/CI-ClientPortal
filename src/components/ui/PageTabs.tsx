import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type PageTabItem = {
  active?: boolean;
  key: string;
  label: string;
  suffix?: ReactNode;
};

export function PageTabs({
  items,
  className,
}: {
  items: PageTabItem[];
  className?: string;
}) {
  return (
    <div className={cn("page-tabs", className)} aria-label="Page tabs">
      {items.map((item) => (
        <div
          key={item.key}
          className={cn("page-tab", item.active && "page-tab-active")}
        >
          <span>{item.label}</span>
          {item.suffix ? <span>{item.suffix}</span> : null}
        </div>
      ))}
    </div>
  );
}
