import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, ExternalLink, Loader2 } from "lucide-react";
import { getActiveAnalysisProgress } from "./analysisProgress.api";

function caseHref(caseId: string) {
  return `/cases/${encodeURIComponent(caseId)}`;
}

export function GlobalAnalysisProgressBanner() {
  const progressQuery = useQuery({
    queryKey: ["analysis-progress", "active"],
    queryFn: getActiveAnalysisProgress,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const activeItems = useMemo(() => progressQuery.data ?? [], [progressQuery.data]);
  const primary = activeItems[0];

  if (!primary) return null;

  const hasMultiple = activeItems.length > 1;
  const reference = primary.caseReferenceNumber ? `#${primary.caseReferenceNumber}` : primary.caseId;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm sm:right-6">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-white">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink-950">Analysis running</p>
                <span className="shrink-0 text-sm font-semibold text-ink-700">{primary.progress}%</span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-500">
                Case {reference} {hasMultiple ? `+ ${activeItems.length - 1} more` : ""}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-700">{primary.message}</p>
            </div>
          </div>

          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-ink-950 transition-all duration-700 ease-out"
                style={{ width: `${primary.progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                {primary.stage.replace(/[_-]+/g, " ")}
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
