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
    <Card className="rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink-950">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-xs font-medium text-ink-500">{detail}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="rounded-2xl bg-brand-50 p-2.5 text-brand-700">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
