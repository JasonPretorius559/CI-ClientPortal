import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BadgeTone = "outline" | "solid" | "dashed" | "attention" | "muted";

const tones: Record<BadgeTone, string> = {
  outline: "border border-brand-100 bg-brand-50 text-brand-800 ring-0",
  solid: "border border-brand-700 bg-brand-800 text-white ring-0",
  dashed: "border border-warning-100 bg-warning-50 text-warning-700 ring-0",
  attention: "border border-danger-100 bg-danger-50 text-danger-700 ring-0",
  muted: "border border-surface-line bg-surface-muted text-ink-600 ring-0",
};

export function Badge({ className, children, tone = "muted", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] ring-1 ring-inset", tones[tone], className)}
      {...props}
    >
      {children}
    </span>
  );
}
