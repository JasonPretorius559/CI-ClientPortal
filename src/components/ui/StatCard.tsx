import type { ReactNode } from "react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
};

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-950 sm:text-[1.75rem]">{value}</p>
        </div>
        {icon ? <div className="rounded-2xl border border-surface-line bg-surface-muted p-2.5 text-brand-700">{icon}</div> : null}
      </div>
    </Card>
  );
}
