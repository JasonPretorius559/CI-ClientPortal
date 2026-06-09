import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";

const queuedSteps = [
  "Preparing analysis",
  "Waiting for an available AI worker",
  "Queueing document processing",
];

const runningSteps = [
  "Reading extracted document text",
  "Reviewing client and policy information",
  "Evaluating coverage and sections",
  "Checking exclusions and missing information",
  "Generating recommendations",
  "Validating structured output",
  "Saving analysis version",
  "Finalising report readiness",
];

function getProgress(status: string, stepIndex: number) {
  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "completed_with_warnings") {
    return 100;
  }

  if (normalized === "queued") {
    return Math.min(20 + stepIndex * 8, 35);
  }

  if (normalized === "running") {
    return Math.min(40 + stepIndex * 7, 92);
  }

  if (normalized === "failed") {
    return 100;
  }

  return 0;
}

export function AnalysisProgressCard({
  status,
  active,
}: {
  status: string;
  active: boolean;
}) {
  const normalized = status.toLowerCase();
  const steps = useMemo(
    () => (normalized === "queued" ? queuedSteps : normalized === "running" ? runningSteps : []),
    [normalized],
  );
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [normalized]);

  useEffect(() => {
    if (!active || !steps.length) return undefined;

    const interval = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 4500);

    return () => window.clearInterval(interval);
  }, [active, steps.length]);

  if (!active && normalized !== "completed" && normalized !== "completed_with_warnings") {
    return null;
  }

  const progress = getProgress(normalized, stepIndex);
  const completed = normalized === "completed" || normalized === "completed_with_warnings";
  const label = completed
    ? "Analysis complete"
    : steps[stepIndex] ?? "Preparing analysis";
  const Icon = completed ? CheckCircle2 : normalized === "queued" ? Clock : Bot;

  return (
    <Card className="rounded-xl border-ink-200 bg-white shadow-soft">
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-ink-200 bg-ink-50">
              <Icon className={completed ? "h-5 w-5" : "h-5 w-5 animate-pulse"} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink-950">AI analysis progress</p>
                <p className="text-sm font-semibold text-ink-700">{progress}%</p>
              </div>
              <p className="mt-1 text-sm text-ink-600">{label}</p>
              <p className="mt-1 text-xs text-ink-500">
                You can keep this page open while we poll the background job. The analysis request is queued on the server, so the page is not waiting on one long open connection.
              </p>
            </div>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-ink-100" aria-label={`Analysis progress ${progress}%`}>
            <div
              className="h-full rounded-full bg-ink-950 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {steps.length ? (
            <ol className="grid gap-2 text-xs text-ink-600 sm:grid-cols-2">
              {steps.map((step, index) => {
                const done = completed || index < stepIndex;
                const current = index === stepIndex && !completed;
                return (
                  <li
                    key={step}
                    className={[
                      "rounded-lg border px-3 py-2",
                      done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : current
                          ? "border-ink-300 bg-ink-50 text-ink-950"
                          : "border-ink-200 bg-white text-ink-500",
                    ].join(" ")}
                  >
                    {step}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
