import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  FileWarning,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { formatDate } from "../../lib/dates";
import { ApiError } from "../../lib/api";
import { useToast } from "../../components/ui/toast-context";
import { generateCaseReport } from "../reports/reports.api";
import { downloadBlob } from "../reports/reportExport";
import { CaseStatusBadge } from "./CaseStatusBadge";
import {
  analyzeCase,
  getCaseAnalysisStatus,
  getCaseAnalysisVersions,
  getCaseLogs,
  type AnalysisVersion,
} from "./cases.api";
import { getCaseStatus, getCaseTitle, readCaseField } from "./cases.utils";

const activeAnalysisStatuses = new Set(["queued", "running"]);
const reportReadyAnalysisStatuses = new Set(["completed", "completed_with_warnings"]);

const queuedMessages = [
  "Preparing analysis...",
  "Waiting for an available AI worker...",
  "Queueing document processing...",
];

const runningMessages = [
  "Reading policy document...",
  "Reviewing client information...",
  "Evaluating coverage...",
  "Checking exclusions...",
  "Finding missing information...",
  "Calculating confidence score...",
  "Calculating satisfaction score...",
  "Generating recommendations...",
  "Creating analysis version...",
  "Finalizing report...",
];

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

function statusFromPayload(payload: unknown) {
  const data =
    isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  return (
    toDisplayValue(
      isRecord(data) ? (data.openAiAnalysisStatus ?? data.status) : "",
    ).toLowerCase() || "not_started"
  );
}

function dataRecord(payload: unknown) {
  return isRecord(payload) && isRecord(payload.data) ? payload.data : {};
}

function arrayFromPayload(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload;
  const records = [payload, dataRecord(payload)].filter(isRecord);
  for (const record of records) {
    for (const key of keys) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate;
    }
  }
  return [];
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

function JsonValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "")
    return <span className="text-ink-500">Not provided</span>;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return <span className="break-words">{String(value)}</span>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-ink-500">None</span>;
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-3"
          >
            <JsonValue value={item} />
          </div>
        ))}
      </div>
    );
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (!entries.length) return <span className="text-ink-500">None</span>;
    return (
      <div className="space-y-2">
        {entries.map(([key, nested]) => (
          <div
            key={key}
            className="min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-3"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {key}
            </p>
            <JsonValue value={nested} />
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

function DetailRow({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: unknown;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd
        className={[
          "mt-1 text-sm text-ink-950",
          breakAll ? "break-all" : "break-words",
        ].join(" ")}
      >
        {value || value === 0 ? String(value) : "Not provided"}
      </dd>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: unknown }) {
  return (
    <Card className="rounded-xl shadow-soft">
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
        <p className="mt-2 break-words text-2xl font-semibold text-ink-950">
          {String(value ?? "Not provided")}
        </p>
      </CardContent>
    </Card>
  );
}

function AnalysisBanner({
  status,
  duplicate,
  insufficientCredits,
}: {
  status: string;
  duplicate: boolean;
  insufficientCredits: boolean;
}) {
  const state = insufficientCredits
    ? {
        title: "Analysis limit reached.",
        message: "Please purchase more analysis credits to continue.",
        tone: "error" as const,
        Icon: AlertTriangle,
      }
    : duplicate
      ? {
          title: "Existing completed analysis reused.",
          message: "No new analysis job was queued.",
          tone: "success" as const,
          Icon: CheckCircle2,
        }
      : status === "queued"
        ? {
            title: "Preparing Analysis",
            message: "Your case is waiting for an AI worker.",
            tone: "info" as const,
            Icon: Clock,
          }
        : status === "running"
          ? {
              title: "AI Analysis In Progress",
              message:
                "Reviewing policy information and generating recommendations.",
              tone: "info" as const,
              Icon: Bot,
            }
          : status === "completed"
            ? {
                title: "Analysis Complete",
                message: "Latest analysis version ready.",
                tone: "success" as const,
                Icon: CheckCircle2,
              }
            : status === "failed"
              ? {
                  title: "Analysis Failed",
                  message: "Please review logs and retry.",
                  tone: "error" as const,
                  Icon: AlertTriangle,
                }
              : {
                  title: "No active analysis",
                  message:
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
        </div>
      </div>
    </Alert>
  );
}

function ThinkingCard({ status }: { status: string }) {
  const messages =
    status === "queued"
      ? queuedMessages
      : status === "running"
        ? runningMessages
        : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (!messages.length) return undefined;
    const interval = window.setInterval(
      () => setIndex((current) => (current + 1) % messages.length),
      4000,
    );
    return () => window.clearInterval(interval);
  }, [messages.length, status]);

  if (!messages.length) return null;

  return (
    <Card className="rounded-xl">
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-ink-200 bg-ink-50">
            <Bot className="h-5 w-5 animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-950">
              AI analysis in progress
            </p>
            <p className="mt-1 text-sm text-ink-600">
              {messages[index]}
              <span className="inline-block w-6 animate-pulse">...</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Analysis Versions</CardTitle>
      </CardHeader>
      <CardContent>
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
                    "w-full min-w-0 rounded-lg border p-4 text-left transition hover:border-ink-500",
                    selected
                      ? "border-ink-950 bg-white shadow-soft"
                      : "border-ink-200 bg-white",
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
      </CardContent>
    </Card>
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
      <Card className="rounded-xl">
        <CardContent>
          <p className="text-sm text-ink-600">
            No AI analysis has been generated for this case yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const summary = firstAnalysisValue(version.analysis, [
    "executiveSummary",
    "summary",
    "analysisSummary",
    "overview",
  ]);
  const recommendations = asList(
    firstAnalysisValue(version.analysis, [
      "recommendations",
      "recommendedActions",
    ]),
  );
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
  const clientDetails = firstAnalysisValue(version.analysis, [
    "clientDetails",
    "client",
    "claimant",
    "insured",
  ]);
  const viewingOld = current && current.analysisId !== version.analysisId;

  return (
    <div className="min-w-0 space-y-5">
      {viewingOld ? (
        <Alert tone="info">
          Viewing Version {version.versionNumber}. Current Version:{" "}
          {current.versionNumber}.
        </Alert>
      ) : null}

      

      


      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-wrap gap-2">
            {missingInformation.length ? (
              missingInformation.map((item, index) => (
                <span
                  key={index}
                  className="min-w-0 break-words rounded-full border border-dashed border-ink-400 px-3 py-1.5 text-sm text-ink-800"
                >
                  {String(item)}
                </span>
              ))
            ) : (
              <p className="text-sm text-ink-600">
                No missing information detected.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Document Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentWarnings.length ? (
              documentWarnings.map((item, index) => (
                <div
                  key={index}
                  className="flex min-w-0 gap-2 rounded-lg border border-ink-200 p-3 text-sm text-ink-800"
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
          </CardContent>
        </Card>
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
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [duplicateReused, setDuplicateReused] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [inputHash, setInputHash] = useState("");
  const [model, setModel] = useState("");

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
    refetchInterval: pollingEnabled ? 5000 : false,
  });
  const versionsQuery = useQuery({
    queryKey: ["case-analysis-versions", caseId],
    queryFn: () => getCaseAnalysisVersions(caseId),
    enabled: Boolean(caseId),
  });
  const logsQuery = useQuery({
    queryKey: ["case-analysis-logs", caseId],
    queryFn: () => getCaseLogs(caseId),
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
  const analysisStatus = statusFromPayload(statusQuery.data);
  const running = activeAnalysisStatuses.has(analysisStatus) || pollingEnabled;
  const logs = arrayFromPayload(logsQuery.data, [
    "timeline",
    "logs",
    "items",
    "history",
  ]);

  useEffect(() => {
    if (!selectedVersionId && current) setSelectedVersionId(current.analysisId);
  }, [current, selectedVersionId]);

  useEffect(() => {
    if (!pollingEnabled) return;
    if (reportReadyAnalysisStatuses.has(analysisStatus) || analysisStatus === "failed") {
      setPollingEnabled(false);
      void versionsQuery.refetch();
      void logsQuery.refetch();
    }
  }, [analysisStatus, logsQuery, pollingEnabled, versionsQuery]);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeCase({ caseId, inputHash, model }),
    onSuccess: async (result) => {
      const data = dataRecord(result.payload);
      const duplicate = data.duplicateAnalysis === true;
      const returnedAnalysisId = toDisplayValue(data.analysisId);

      setInsufficientCredits(false);
      setDuplicateReused(duplicate);
      if (returnedAnalysisId) setSelectedVersionId(returnedAnalysisId);
      if (result.status === 202) setPollingEnabled(true);
      await Promise.all([
        statusQuery.refetch(),
        versionsQuery.refetch(),
        logsQuery.refetch(),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Unable to run analysis.";
      setInsufficientCredits(
        message.toLowerCase().includes("analysis limit") ||
          message.toLowerCase().includes("credit"),
      );
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

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl border-ink-200 bg-white shadow-soft">
        <CardContent>
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Case Detail
              </p>
              <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight text-ink-950 lg:text-4xl">
                {getCaseTitle(caseItem)}
              </h2>
              <p className="mt-3 break-all text-sm text-ink-500">
                Reference #{caseReferenceNumber || "Not assigned"}
              </p>
              <p className="mt-1 break-words text-base font-medium text-ink-800">
                {caseType}
              </p>
              <div className="mt-6 grid min-w-0 gap-3 text-sm text-ink-600 sm:grid-cols-3">
                <span className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <strong className="text-ink-950">Created</strong>
                  <br />
                  {formatDate(submittedDate)}
                </span>
                <span className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <strong className="text-ink-950">Last Updated</strong>
                  <br />
                  {formatDate(lastUpdatedDate)}
                </span>
                <span className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <strong className="text-ink-950">Files Attached</strong>
                  <br />
                  {filesAttachedCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnalysisBanner
        status={analysisStatus}
        duplicate={duplicateReused}
        insufficientCredits={insufficientCredits}
      />
      {analyzeMutation.isError ? (
        <Alert tone="error">
          {analyzeMutation.error instanceof ApiError
            ? analyzeMutation.error.message
            : "Unable to run analysis."}
        </Alert>
      ) : null}
      <ThinkingCard status={analysisStatus} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <main className="min-w-0 space-y-6">
          <SelectedAnalysis
            version={selectedVersion ?? null}
            current={current}
          />

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length ? (
                <div className="space-y-3">
                  {files.map((file, index) => {
                    const fileName = getFileName(file, index);
                    const details = [getFileType(file), getFileSize(file)]
                      .filter(Boolean)
                      .join(" - ");
                    const downloadUrl = getFileDownloadUrl(file);
                    return (
                      <div
                        key={`${fileName}-${index}`}
                        className="flex min-w-0 flex-col gap-3 rounded-lg border border-ink-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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
                            className="inline-flex shrink-0 items-center justify-center rounded-md border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
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
            </CardContent>
          </Card>

          
        </main>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Analysis Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                onClick={() => analyzeMutation.mutate()}
                isLoading={analyzeMutation.isPending || running}
                disabled={!caseId || running || insufficientCredits}
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
                    void logsQuery.refetch();
                  }}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Refresh
                </Button>
                
              </div>
            </CardContent>
          </Card>

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
