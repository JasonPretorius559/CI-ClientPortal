import type { ReactNode } from "react";
import { Card } from "./Card";

export function DashboardMetricCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  detail?: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
            {value}
          </p>
          {detail ? (
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-ink-500">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-surface-line bg-surface-muted text-ink-700">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
