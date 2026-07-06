import type { ReactNode } from "react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
};

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="border-l-4 border-l-ink-950 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink-950 sm:text-[1.75rem]">{value}</p>
        </div>
        {icon ? <div className="border border-surface-line bg-surface-muted p-2.5 text-ink-700">{icon}</div> : null}
      </div>
    </Card>
  );
}
