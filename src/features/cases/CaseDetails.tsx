import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileWarning,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CommandBarGroup } from "../../components/ui/CommandBar";
import { InlineMeta } from "../../components/ui/InlineMeta";
import { SectionDivider } from "../../components/ui/PageShell";
import { formatDate } from "../../lib/dates";
import { ApiError } from "../../lib/api";
import { useToast } from "../../components/ui/toast-context";
import { generateCaseReport } from "../reports/reports.api";
import { downloadBlob } from "../reports/reportExport";
import { AnalysisProgressCard } from "./AnalysisProgressCard";
import { useAnalysisStreamStatus } from "./AnalysisProgressStreamBridge";
import {
  getActiveAnalysisProgress,
  type ActiveAnalysisProgress,
} from "./analysisProgress.api";
import {
  getFailureMessage,
  getProgressMessage,
  isActiveAnalysisStatus,
  isCompletedAnalysisStatus,
  parseCaseAnalysisStatus,
  type CaseAnalysisStatusDetail,
} from "./analysisStatus.utils";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { CaseCollaboration } from "./CaseCollaboration";
import {
  analyzeCase,
  cancelCaseAnalysis,
  getCaseAnalysisStatus,
  getCaseAnalysisVersions,
  type AnalysisVersion,
} from "./cases.api";
import { getCaseStatus, getCaseTitle, readCaseField } from "./cases.utils";

const reportReadyAnalysisStatuses = new Set(["completed", "completed_with_warnings"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toDisplayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (isRecord(value)) {
    for (const key of ["name", "title", "label", "value", "_id", "id"]) {
      const nested = value[key];
      if (typeof nested === "string" && nested.trim()) return nested;
      if (typeof nested === "number") return String(nested);
    }
  }
  return "";
}

function readDisplay(caseItem: unknown, keys: string[]) {
  return toDisplayValue(readCaseField(caseItem, keys));
}

function toFilesCount(value: unknown, filesLength: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return filesLength;
}

function getFiles(caseItem: unknown): unknown[] {
  const files = readCaseField(caseItem, ["files", "documents", "attachments"]);
  return Array.isArray(files) ? files : [];
}

function getFileName(file: unknown, index: number) {
  if (!isRecord(file)) return `Case file ${index + 1}`;
  return (
    toDisplayValue(
      file.originalName || file.fileName || file.name || file.filename,
    ) || `Case file ${index + 1}`
  );
}

function getFileType(file: unknown) {
  if (!isRecord(file)) return null;
  return toDisplayValue(file.mimeType || file.mimetype || file.type) || null;
}

function getFileSize(file: unknown) {
  if (!isRecord(file)) return null;
  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) return null;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getFileDownloadUrl(file: unknown) {
  if (!isRecord(file)) return null;
  const downloadUrl = file.downloadUrl;
  return typeof downloadUrl === "string" && downloadUrl.trim()
    ? downloadUrl
    : null;
}

function getDownloadHref(downloadUrl: string) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return downloadUrl.startsWith("http")
    ? downloadUrl
    : `${apiBaseUrl}${downloadUrl}`;
}

function mergeCaseProgressDetail(
  detail: CaseAnalysisStatusDetail,
  activeProgress: ActiveAnalysisProgress | undefined,
): CaseAnalysisStatusDetail {
  if (
    !activeProgress ||
    isCompletedAnalysisStatus(detail.status) ||
    detail.status === "failed" ||
    detail.status === "cancelled"
  ) {
    return detail;
  }

  return {
    ...detail,
    progress: activeProgress.progress ?? detail.progress,
    stage: activeProgress.stage ?? detail.stage,
    message: activeProgress.message || detail.message,
    error: activeProgress.analysisError || detail.error,
    completedChunks: activeProgress.completedChunks,
    totalChunks: activeProgress.totalChunks,
    currentChunkIndex: activeProgress.currentChunkIndex,
    keyFactsReadyAt: activeProgress.keyFactsReadyAt,
    preliminaryKeyFacts: activeProgress.preliminaryKeyFacts,
  };
}

function dataRecord(payload: unknown) {
  return isRecord(payload) && isRecord(payload.data) ? payload.data : {};
}

function isCompleted(version: AnalysisVersion) {
  return reportReadyAnalysisStatuses.has(version.status?.trim().toLowerCase());
}

function currentVersion(versions: AnalysisVersion[]) {
  return versions.find((version) => version.isCurrent) ?? versions[0] ?? null;
}

function docxFileName(fileName: string) {
  if (fileName.toLowerCase().endsWith(".docx")) return fileName;
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "cloud-insure-report";
  return `${baseName}.docx`;
}

function score(value: number | null, max = 100) {
  if (value === null) return "Not provided";
  if (max === 100) return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
  return `${value.toFixed(2)} / ${max}`;
}

function formatStatus(status: string) {
  return (
    status
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(
        /\w\S*/g,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      ) || "Unknown"
  );
}

function firstAnalysisValue(analysis: unknown, keys: string[]) {
  if (!isRecord(analysis)) return null;
  return (
    keys
      .map((key) => analysis[key])
      .find((value) => value !== undefined && value !== null && value !== "") ??
    null
  );
}

function asList(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function AnalysisBanner({
  detail,
  duplicate,
}: {
  detail: CaseAnalysisStatusDetail;
  duplicate: boolean;
}) {
  const status = detail.status;
  const failureMessage = getFailureMessage(detail);
  const progressMessage = getProgressMessage(detail);

  const state = duplicate
      ? {
          title: "Existing analysis reused",
          message: "No new analysis job was queued because this input was already analysed.",
          tone: "success" as const,
          Icon: CheckCircle2,
        }
      : detail.documentExtraction?.stage === "failed"
        ? {
            title: "Document preparation failed",
            message: failureMessage,
            tone: "error" as const,
            Icon: FileWarning,
          }
        : status === "cancelled"
          ? {
              title: "Analysis cancelled",
              message: detail.message || "The current analysis job was cancelled.",
              tone: "info" as const,
              Icon: AlertTriangle,
            }
        : status === "failed"
          ? {
              title: "Analysis failed",
              message: failureMessage,
              tone: "error" as const,
              Icon: AlertTriangle,
            }
          : isCompletedAnalysisStatus(status)
            ? {
                title: detail.needsInput ? "Analysis complete with follow-up needed" : "Analysis complete",
                message: detail.message || "Latest analysis version is ready.",
                tone: detail.needsInput ? ("info" as const) : ("success" as const),
                Icon: detail.needsInput ? AlertTriangle : CheckCircle2,
              }
            : isActiveAnalysisStatus(status)
              ? {
                  title: "Analysis in progress",
                  message: progressMessage,
                  tone: "info" as const,
                  Icon: Bot,
                }
              : {
                  title: "Ready for analysis",
                  message:
                    detail.documentExtraction?.message ||
                    "Run analysis when this case is ready for AI review.",
                  tone: "info" as const,
                  Icon: Sparkles,
                };
  const Icon = state.Icon;

  return (
    <Alert tone={state.tone}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-base font-semibold">{state.title}</p>
          <p className="mt-1 text-sm">{state.message}</p>
          {detail.error && status === "failed" ? (
            <p className="mt-2 rounded-md bg-white/70 p-2 text-xs text-ink-700">{detail.error}</p>
          ) : null}
        </div>
      </div>
    </Alert>
  );
}

function AnalysisVersionList({
  versions,
  selectedVersion,
  setSelectedVersionId,
}: {
  versions: AnalysisVersion[];
  selectedVersion: AnalysisVersion | null;
  setSelectedVersionId: (analysisId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionDivider
        title="Analysis Versions"
        description="Switch between historical outputs and the current working version."
      />
      {versions.length ? (
          <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {versions.map((version) => {
              const selected =
                selectedVersion?.analysisId === version.analysisId;
              return (
                <button
                  type="button"
                  key={version.analysisId}
                  onClick={() => setSelectedVersionId(version.analysisId)}
                  className={[
                    "w-full min-w-0 border border-surface-line bg-white p-4 text-left transition hover:border-ink-500",
                    selected
                      ? "border-ink-950"
                      : "border-surface-line",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-950">
                        Version {version.versionNumber}
                      </p>
                      {version.isCurrent ? (
                        <Badge tone="solid">Current</Badge>
                      ) : null}
                    </div>
                    <Badge tone={isCompleted(version) ? "outline" : "muted"}>
                      {formatStatus(version.status)}
                    </Badge>
                  </div>
                    <div className="mt-3 grid min-w-0 gap-1 text-xs text-ink-500">
                      <span>Created: {formatDate(version.createdAt)}</span>
                    <span>Confidence: {score(version.confidenceScore)}</span>
                    <span>
                      Satisfaction: {score(version.satisfactionScore, 5)}
                    </span>
                    <span className="break-all">ID: {version.analysisId}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-600">
            No AI analysis has been generated for this case yet.
          </p>
        )}
    </section>
  );
}

function SelectedAnalysis({
  version,
  current,
}: {
  version: AnalysisVersion | null;
  current: AnalysisVersion | null;
}) {
  if (!version) {
    return (
      <p className="text-sm text-ink-600">
        No AI analysis has been generated for this case yet.
      </p>
    );
  }

  const missingInformation = asList(
    version.missingInformation ??
      firstAnalysisValue(version.analysis, [
        "missingInformation",
        "missing_info",
      ]),
  );
  const documentWarnings = asList(
    version.documentWarnings ??
      firstAnalysisValue(version.analysis, ["documentWarnings", "warnings"]),
  );
  const viewingOld = current && current.analysisId !== version.analysisId;

  return (
    <div className="min-w-0 space-y-7">
      {viewingOld ? (
        <Alert tone="info">
          Viewing Version {version.versionNumber}. Current Version:{" "}
          {current.versionNumber}.
        </Alert>
      ) : null}

      <SectionDivider
        title={`Analysis Output: Version ${version.versionNumber}`}
        description="Review the latest extracted gaps, warnings, and supporting information."
      />

      <div className="grid min-w-0 gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <SectionDivider title="Missing Information" />
          <div className="space-y-2">
            {missingInformation.length ? (
              missingInformation.map((item, index) => (
                <div
                  key={index}
                  className="min-w-0 break-words border-l-2 border-warning-500 bg-warning-50/60 px-3 py-2 text-sm text-ink-800"
                >
                  {String(item)}
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-600">
                No missing information detected.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <SectionDivider title="Document Warnings" />
          <div className="space-y-2">
            {documentWarnings.length ? (
              documentWarnings.map((item, index) => (
                <div
                  key={index}
                  className="flex min-w-0 gap-2 border-b border-ink-200 py-3 text-sm text-ink-800"
                >
                  <FileWarning
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">{String(item)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-600">
                No document warnings detected.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// function LogsTimeline({ logs }: { logs: unknown[] }) {
//   if (!logs.length)
//     return (
//       <p className="text-sm text-ink-600">
//         No analysis logs are available for this case.
//       </p>
//     );

//   return (
//     <div className="relative max-h-[32rem] min-w-0 space-y-4 overflow-y-auto pr-1 before:absolute before:left-4 before:top-2 before:h-full before:w-px before:bg-ink-200">
//       {logs.map((entry, index) => {
//         const event = isRecord(entry)
//           ? toDisplayValue(entry.event || entry.title || entry.action) ||
//             "Analysis activity"
//           : "Analysis activity";
//         const message = isRecord(entry)
//           ? toDisplayValue(entry.message || entry.description)
//           : "";
//         const status = isRecord(entry)
//           ? toDisplayValue(entry.status || entry.jobStatus || entry.level)
//           : "";
//         const timestamp = isRecord(entry)
//           ? (entry.at ?? entry.createdAt ?? entry.timestamp)
//           : null;
//         return (
//           <div key={index} className="relative flex gap-4">
//             <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white">
//               <Clock className="h-4 w-4" aria-hidden="true" />
//             </div>
//             <div className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white p-4">
//               <div className="flex flex-wrap items-center justify-between gap-2">
//                 <p className="min-w-0 break-words font-semibold text-ink-950">
//                   {event}
//                 </p>
//                 <p className="text-xs text-ink-500">
//                   {formatDate(typeof timestamp === "string" ? timestamp : null)}
//                 </p>
//               </div>
//               {message ? (
//                 <p className="mt-1 break-words text-sm text-ink-600">
//                   {message}
//                 </p>
//               ) : null}
//               {status ? (
//                 <div className="mt-3">
//                   <Badge tone="muted">{formatStatus(status)}</Badge>
//                 </div>
//               ) : null}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

export function CaseDetails({ caseItem }: { caseItem: unknown }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const streamStatus = useAnalysisStreamStatus();
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [duplicateReused, setDuplicateReused] = useState(false);
  const inputHash = "";
  const model = "";
  const lastNotifiedStatusRef = useRef<string | null>(null);

  const files = getFiles(caseItem);
  const caseId = readDisplay(caseItem, ["caseId", "CaseId", "id", "_id"]);
  const caseReferenceNumber =
    readDisplay(caseItem, [
      "caseReferenceNumber",
      "referenceNumber",
      "caseReference",
    ]) || caseId;
  const caseType =
    readDisplay(caseItem, ["caseType", "type", "caseTypeName"]) ||
    "Personal Policy Analysis";
  const submittedDate = readDisplay(caseItem, [
    "submittedDate",
    "createdAt",
    "createdDate",
  ]);
  const lastUpdatedDate = readDisplay(caseItem, [
    "lastUpdatedDate",
    "updatedAt",
    "updatedDate",
    "lastUpdated",
  ]);
  const filesAttachedCount = toFilesCount(
    readCaseField(caseItem, [
      "filesAttachedCount",
      "filesCount",
      "documentsCount",
    ]),
    files.length,
  );

  const statusQuery = useQuery({
    queryKey: ["case-analysis-status", caseId],
    queryFn: () => getCaseAnalysisStatus(caseId),
    enabled: Boolean(caseId),
    refetchInterval: pollingEnabled ? (streamStatus === "open" ? 30_000 : 4000) : false,
  });
  const activeProgressQuery = useQuery({
    queryKey: ["analysis-progress", "active"],
    queryFn: getActiveAnalysisProgress,
    enabled: Boolean(caseId) && pollingEnabled,
    refetchInterval: pollingEnabled ? (streamStatus === "open" ? 30_000 : 4000) : false,
  });
  const versionsQuery = useQuery({
    queryKey: ["case-analysis-versions", caseId],
    queryFn: () => getCaseAnalysisVersions(caseId),
    enabled: Boolean(caseId),
  });
  const versions = useMemo(
    () => versionsQuery.data ?? [],
    [versionsQuery.data],
  );
  const current = useMemo(() => currentVersion(versions), [versions]);
  const selectedVersion =
    versions.find((version) => version.analysisId === selectedVersionId) ??
    current;
  const analysisDetail = useMemo(() => {
    const parsed = parseCaseAnalysisStatus(statusQuery.data);
    const activeForCase = (activeProgressQuery.data ?? []).find((item) => item.caseId === caseId);
    return mergeCaseProgressDetail(parsed, activeForCase);
  }, [activeProgressQuery.data, caseId, statusQuery.data]);
  const analysisStatus = analysisDetail.status;
  const running = isActiveAnalysisStatus(analysisStatus) || pollingEnabled;

  useEffect(() => {
    if (!selectedVersionId && current) setSelectedVersionId(current.analysisId);
  }, [current, selectedVersionId]);

  useEffect(() => {
    if (!pollingEnabled) return;
    if (
      isCompletedAnalysisStatus(analysisStatus) ||
      analysisStatus === "failed" ||
      analysisStatus === "cancelled"
    ) {
      setPollingEnabled(false);
      void Promise.all([
        versionsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
      ]);
    }
  }, [analysisStatus, pollingEnabled, queryClient, versionsQuery]);

  useEffect(() => {
    if (!pollingEnabled) return;

    const notificationKey = `${analysisStatus}:${analysisDetail.error ?? ""}`;
    if (lastNotifiedStatusRef.current === notificationKey) return;

    if (isCompletedAnalysisStatus(analysisStatus)) {
      lastNotifiedStatusRef.current = notificationKey;
      showToast({
        tone: "success",
        title: analysisDetail.needsInput
          ? "Analysis finished, but more information may be needed."
          : "Analysis completed successfully.",
      });
      return;
    }

    if (analysisStatus === "failed" || analysisDetail.documentExtraction?.stage === "failed") {
      lastNotifiedStatusRef.current = notificationKey;
      showToast({
        tone: "error",
        title: getFailureMessage(analysisDetail),
      });
    }
  }, [analysisDetail, analysisStatus, pollingEnabled, showToast]);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeCase({ caseId, inputHash, model }),
    onSuccess: async (result) => {
      const data = dataRecord(result.payload);
      const duplicate = data.duplicateAnalysis === true;
      const returnedAnalysisId = toDisplayValue(data.analysisId);

      setDuplicateReused(duplicate);
      if (returnedAnalysisId) setSelectedVersionId(returnedAnalysisId);
      if (result.status === 202) setPollingEnabled(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
        statusQuery.refetch(),
        versionsQuery.refetch(),
      ]);
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!caseId || !selectedVersion || !isCompleted(selectedVersion)) {
        throw new Error("Select a completed analysis version first.");
      }

      return generateCaseReport({
        caseId,
        analysisId: selectedVersion.analysisId,
      });
    },
    onSuccess: (result) => {
      downloadBlob(result.blob, docxFileName(result.fileName));
      showToast({ tone: "success", title: "Report downloaded." });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Unable to generate report.";
      showToast({ tone: "error", title: message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => cancelCaseAnalysis(caseId),
    onSuccess: async () => {
      setPollingEnabled(false);
      showToast({ tone: "success", title: "Analysis cancelled." });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
        statusQuery.refetch(),
        activeProgressQuery.refetch(),
        versionsQuery.refetch(),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Unable to cancel analysis.";
      showToast({ tone: "error", title: message });
    },
  });

  return (
    <div className="space-y-7">
      <section className="space-y-4 border-b border-ink-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <CaseStatusBadge status={getCaseStatus(caseItem)} />
          <Badge
            tone={
              isCompleted(current ?? ({} as AnalysisVersion))
                ? "outline"
                : "muted"
            }
          >
            {formatStatus(analysisStatus)}
          </Badge>
        </div>
        <div>
          <p className="page-toolbar-meta">Case workbench</p>
          <h2 className="mt-2 break-words text-[2rem] font-semibold tracking-[-0.03em] text-ink-950">
            {getCaseTitle(caseItem)}
          </h2>
          <p className="mt-2 break-words text-sm text-ink-600">
            {caseType}
          </p>
        </div>
        <InlineMeta
          items={[
            { label: "Reference", value: `#${caseReferenceNumber || "Not assigned"}` },
            { label: "Created", value: formatDate(submittedDate) },
            { label: "Last updated", value: formatDate(lastUpdatedDate) },
            { label: "Files attached", value: filesAttachedCount },
          ]}
        />
      </section>

      <AnalysisBanner
        detail={analysisDetail}
        duplicate={duplicateReused}
      />
      {analyzeMutation.isError ? (
        <Alert tone="error">
          {analyzeMutation.error instanceof ApiError
            ? analyzeMutation.error.message
            : "Unable to run analysis."}
        </Alert>
      ) : null}
      <AnalysisProgressCard detail={analysisDetail} active={running} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <main className="min-w-0 space-y-6">
          <SelectedAnalysis
            version={selectedVersion ?? null}
            current={current}
          />

          <section className="space-y-4">
            <SectionDivider
              title="Supporting Documents"
              description="Documents and attachments submitted with this case."
            />
            <div>
              {files.length ? (
                <div className="space-y-0 border-y border-ink-200">
                  {files.map((file, index) => {
                    const fileName = getFileName(file, index);
                    const details = [getFileType(file), getFileSize(file)]
                      .filter(Boolean)
                      .join(" - ");
                    const downloadUrl = getFileDownloadUrl(file);
                    return (
                      <div
                        key={`${fileName}-${index}`}
                        className="flex min-w-0 flex-col gap-3 border-b border-ink-200 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-medium text-ink-950">
                            {fileName}
                          </p>
                          <p className="mt-1 break-words text-xs text-ink-500">
                            {details || "File details not provided"}
                          </p>
                        </div>
                        {downloadUrl ? (
                          <a
                            href={getDownloadHref(downloadUrl)}
                            target="_blank"
                            rel="noreferrer"
                            download={fileName}
                            className="inline-flex shrink-0 items-center justify-center border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="shrink-0 text-xs text-ink-500">
                            Download unavailable
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-ink-600">
                  No supporting documents were attached to this case.
                </p>
              )}
            </div>
          </section>
          {caseId ? <CaseCollaboration caseId={caseId} /> : null}
        </main>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-6">
          <section className="space-y-4 border-b border-ink-200 pb-5">
            <SectionDivider
              title="Analysis Actions"
              description="Run, cancel, refresh, or export analysis for this case."
            />
            <CommandBarGroup className="xl:flex-col">
              <Button
                type="button"
                onClick={() => analyzeMutation.mutate()}
                isLoading={analyzeMutation.isPending || (running && !cancelMutation.isPending)}
                disabled={!caseId || running || cancelMutation.isPending}
                className="w-full"
              >
                {!analyzeMutation.isPending && !running ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {running ? "Analyzing..." : "Run Analysis"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => cancelMutation.mutate()}
                isLoading={cancelMutation.isPending}
                disabled={!caseId || !running || analyzeMutation.isPending}
                className="w-full"
              >
                Cancel Analysis
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => generateReportMutation.mutate()}
                isLoading={generateReportMutation.isPending}
                disabled={!caseId || !selectedVersion || !isCompleted(selectedVersion)}
                className="w-full"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Generate Report
              </Button>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  type="button"
                  variant="secondary"
                    onClick={() => {
                      void statusQuery.refetch();
                      void versionsQuery.refetch();
                    }}
                  >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Refresh
                </Button>
              </div>
            </CommandBarGroup>
          </section>

          <AnalysisVersionList
            versions={versions}
            selectedVersion={selectedVersion ?? null}
            setSelectedVersionId={setSelectedVersionId}
          />
        </aside>
      </div>
    </div>
  );
}
