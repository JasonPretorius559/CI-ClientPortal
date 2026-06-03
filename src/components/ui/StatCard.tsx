import type { ReactNode } from "react";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
};

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink-950">{value}</p>
        </div>
        {icon ? <div className="rounded-md border border-ink-200 bg-ink-100 p-2 text-ink-900">{icon}</div> : null}
      </div>
    </Card>
  );
}
