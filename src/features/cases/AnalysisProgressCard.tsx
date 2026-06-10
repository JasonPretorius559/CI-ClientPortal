import { Bot, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import {
  formatAnalysisStage,
  getProgressMessage,
  getStageLabel,
  type CaseAnalysisStatusDetail,
} from "./analysisStatus.utils";

const STEP_ORDER = [
  "extracting_documents",
  "queued",
  "retrying",
  "reading_documents",
  "reviewing_policy",
  "evaluating_cover",
  "generating_recommendations",
  "finalising",
  "completed",
] as const;

function getStepState(currentStage: string, step: string, completed: boolean) {
  if (completed) return "done";
  const currentIndex = STEP_ORDER.indexOf(currentStage as (typeof STEP_ORDER)[number]);
  const stepIndex = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  if (currentIndex < 0 || stepIndex < 0) return "pending";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

export function AnalysisProgressCard({
  detail,
  active,
}: {
  detail: CaseAnalysisStatusDetail;
  active: boolean;
}) {
  const normalized = detail.status.toLowerCase();
  const completed =
    normalized === "completed" ||
    normalized === "completed_with_warnings";
  const failed = normalized === "failed" || detail.stage === "extraction_failed";
  const progress = detail.progress ?? (completed || failed ? 100 : 0);
  const stage = detail.stage ?? normalized;
  const label = getProgressMessage(detail);
  const Icon = completed ? CheckCircle2 : failed ? FileText : normalized === "queued" ? Clock : Bot;

  if (!active && !completed && !failed) {
    return null;
  }

  const visibleSteps = STEP_ORDER.filter((step) => {
    if (step === "retrying" && stage !== "retrying") return false;
    if (step === "extracting_documents" && detail.documentExtraction?.pdfCount === 0) return false;
    return true;
  });

  return (
    <Card className="rounded-xl border-ink-200 bg-white shadow-soft">
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-ink-200 bg-ink-50">
              <Icon
                className={completed || failed ? "h-5 w-5" : "h-5 w-5 animate-pulse"}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink-950">
                  {failed ? "Analysis issue" : completed ? "Analysis complete" : "AI analysis progress"}
                </p>
                <p className="text-sm font-semibold text-ink-700">{progress}%</p>
              </div>
              <p className="mt-1 text-sm text-ink-600">{label}</p>
              {!failed && !completed ? (
                <p className="mt-1 text-xs text-ink-500">
                  We check progress every few seconds. You can leave this page open or come back later.
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-ink-100"
            aria-label={`Analysis progress ${progress}%`}
          >
            <div
              className={[
                "h-full rounded-full transition-all duration-700 ease-out",
                failed ? "bg-red-500" : "bg-ink-950",
              ].join(" ")}
              style={{ width: `${progress}%` }}
            />
          </div>

          {active && visibleSteps.length ? (
            <ol className="grid gap-2 text-xs text-ink-600 sm:grid-cols-2">
              {visibleSteps.map((step) => {
                const state = getStepState(stage, step, completed);
                return (
                  <li
                    key={step}
                    className={[
                      "rounded-lg border px-3 py-2",
                      state === "done"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : state === "current"
                          ? "border-ink-300 bg-ink-50 text-ink-950"
                          : "border-ink-200 bg-white text-ink-500",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2">
                      {state === "current" ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : null}
                      {getStageLabel(step)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          {detail.documentExtraction?.files.length ? (
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Document preparation
              </p>
              <ul className="mt-2 space-y-1 text-xs text-ink-700">
                {detail.documentExtraction.files.map((file) => (
                  <li key={`${file.index}-${file.originalName}`} className="flex justify-between gap-3">
                    <span className="truncate">{file.originalName}</span>
                    <span className="shrink-0 capitalize">
                      {formatAnalysisStage(
                        file.documentUnderstandingStatus === "completed" ||
                          file.extractedTextStatus === "completed"
                          ? "ready"
                          : file.documentUnderstandingStatus,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
