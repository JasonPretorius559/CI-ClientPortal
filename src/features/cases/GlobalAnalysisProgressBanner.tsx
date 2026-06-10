import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bot, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "../../components/ui/toast-context";
import { getActiveAnalysisProgress } from "./analysisProgress.api";
import { getStageLabel } from "./analysisStatus.utils";

function caseHref(caseId: string) {
  return `/cases/${encodeURIComponent(caseId)}`;
}

export function GlobalAnalysisProgressBanner() {
  const { showToast } = useToast();
  const seenFailuresRef = useRef<Set<string>>(new Set());
  const progressQuery = useQuery({
    queryKey: ["analysis-progress", "active"],
    queryFn: getActiveAnalysisProgress,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const activeItems = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);
  const primary = activeItems[0];

  useEffect(() => {
    for (const item of activeItems) {
      const failureKey = `${item.analysisJobId}:${item.stage}`;
      const isFailure =
        item.stage === "failed" ||
        item.stage === "timed_out" ||
        item.stage === "extraction_failed" ||
        item.extractionFailed;

      if (!isFailure || seenFailuresRef.current.has(failureKey)) continue;

      seenFailuresRef.current.add(failureKey);
      showToast({
        tone: "error",
        title: item.message || "Analysis could not be completed.",
      });
    }
  }, [activeItems, showToast]);

  if (!primary) return null;

  const hasMultiple = activeItems.length > 1;
  const reference = primary.caseReferenceNumber ? `#${primary.caseReferenceNumber}` : primary.caseId;
  const isFailure =
    primary.stage === "failed" ||
    primary.stage === "timed_out" ||
    primary.stage === "extraction_failed" ||
    primary.extractionFailed;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm sm:right-6">
      <div
        className={[
          "pointer-events-auto overflow-hidden rounded-2xl border bg-white shadow-2xl ring-1 ring-black/5",
          isFailure ? "border-red-200" : "border-ink-200",
        ].join(" ")}
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div
              className={[
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white",
                isFailure ? "bg-red-600" : "bg-ink-950",
              ].join(" ")}
            >
              {isFailure ? (
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Bot className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink-950">
                  {isFailure ? "Analysis needs attention" : "Analysis running"}
                </p>
                <span className="shrink-0 text-sm font-semibold text-ink-700">{primary.progress}%</span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-500">
                {primary.caseTitle} {reference ? `(${reference})` : ""}
                {hasMultiple ? ` + ${activeItems.length - 1} more` : ""}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-ink-700">{primary.message}</p>
              {primary.analysisError ? (
                <p className="mt-2 line-clamp-3 text-xs text-red-700">{primary.analysisError}</p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className={[
                  "h-full rounded-full transition-all duration-700 ease-out",
                  isFailure ? "bg-red-500" : "bg-ink-950",
                ].join(" ")}
                style={{ width: `${primary.progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1">
                {isFailure ? (
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                )}
                {getStageLabel(primary.stage)}
              </span>
              {primary.attempts !== null && primary.maxAttempts !== null ? (
                <span>
                  Attempt {primary.attempts}/{primary.maxAttempts}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            to={caseHref(primary.caseId)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
          >
            Open case
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
