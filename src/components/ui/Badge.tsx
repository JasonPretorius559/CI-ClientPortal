import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BadgeTone = "outline" | "solid" | "dashed" | "attention" | "muted";

const tones: Record<BadgeTone, string> = {
  outline: "border border-ink-950 bg-white text-ink-950 ring-0",
  solid: "border border-ink-950 bg-ink-950 text-white ring-0",
  dashed: "border border-dashed border-ink-500 bg-ink-100 text-ink-950 ring-0",
  attention: "border-2 border-ink-950 bg-white text-ink-950 ring-0",
  muted: "border border-ink-300 bg-ink-100 text-ink-600 ring-0",
};

export function Badge({ className, children, tone = "muted", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}
      {...props}
    >
      {children}
    </span>
  );
}
