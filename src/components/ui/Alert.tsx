import type { HTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/cn";

type AlertTone = "info" | "success" | "error";

const tones: Record<AlertTone, string> = {
  info: "border-ink-300 bg-white text-ink-900",
  success: "border-success-100 bg-success-50 text-success-700",
  error: "border-danger-100 bg-danger-50 text-danger-700",
};

export function Alert({ className, tone = "info", children, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;

  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3.5 text-sm", tones[tone], className)} role={tone === "error" ? "alert" : "status"} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
