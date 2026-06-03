import type { HTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/cn";

type AlertTone = "info" | "success" | "error";

const tones: Record<AlertTone, string> = {
  info: "border-ink-300 bg-ink-100 text-ink-950",
  success: "border-ink-950 bg-white text-ink-950",
  error: "border-ink-950 bg-white text-ink-950",
};

export function Alert({ className, tone = "info", children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;

  return (
    <div className={cn("flex gap-3 rounded-md border p-4 text-sm shadow-sm", tone === "error" && "border-2", tones[tone], className)} role={tone === "error" ? "alert" : "status"} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
