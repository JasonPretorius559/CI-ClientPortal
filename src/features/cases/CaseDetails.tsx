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
  ScrollText,
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
import { useAuth } from "../auth/useAuth";
import { isAdminUser } from "../auth/auth.utils";
import {
  generateReportDesign,
  getReportDesigns,
  previewReportDesign,
} from "../report-designs/reportDesigns.api";
import {
  getReportDesignId,
  getReportDesignTemplate,
  getSchemaMismatchMessage,
} from "../report-designs/reportDesigns.utils";
import type { ReportDesign } from "../report-designs/reportDesigns.types";
import { useReportDesignerStore } from "../reports/reportDesigner.store";
import { AdminReportPreviewModal } from "../report-designs/components/AdminReportPreviewModal";
import { downloadBlob } from "../reports/reportExport";
import { CaseStatusBadge } from "./CaseStatusBadge";
import {
  analyzeCase,
  downloadCaseAnalysisVersion,
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

function schemaVersionsMatch(left: string | number | null, right: string | number | null) {
  if (left === null || right === null) return false;
  return Number(left) === Number(right);
}

function reportDesignDisplayName(design: ReportDesign) {
  return design.name || getReportDesignId(design) || "Untitled report design";
}

function defaultDownloadVersion(versions: AnalysisVersion[]) {
  const completed = versions.filter(isCompleted);
  return completed.find((version) => version.isCurrent) ?? completed[0] ?? null;
}

function currentVersion(versions: AnalysisVersion[]) {
  return versions.find((version) => version.isCurrent) ?? versions[0] ?? null;
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

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Confidence" value={score(version.confidenceScore)} />
        <MetricCard
          label="Satisfaction"
          value={score(version.satisfactionScore, 5)}
        />
        <MetricCard label="Version" value={`v${version.versionNumber}`} />
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 break-words text-base leading-7 text-ink-800">
          {summary ? (
            <JsonValue value={summary} />
          ) : (
            "No executive summary was returned for this version."
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>CloudInsure Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 md:grid-cols-2">
          {recommendations.length ? (
            recommendations.map((item, index) => (
              <div
                key={index}
                className="min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-800"
              >
                <JsonValue value={item} />
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-600">
              No recommendations were returned for this version.
            </p>
          )}
        </CardContent>
      </Card>

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

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <JsonValue value={clientDetails ?? "No client details returned."} />
        </CardContent>
      </Card>

      <details className="rounded-xl border border-ink-200 bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-base font-semibold text-ink-950">
          Collapsed metadata
        </summary>
        <dl className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="AI Model" value={version.model} />
          <DetailRow
            label="Schema"
            value={[version.schemaKey, version.schemaVersion]
              .filter(Boolean)
              .join(" / ")}
          />
          <DetailRow label="Analysis ID" value={version.analysisId} breakAll />
          <DetailRow label="Job ID" value={version.analysisJobId} breakAll />
          <DetailRow label="Input Hash" value={version.inputHash} breakAll />
          <DetailRow label="Status" value={formatStatus(version.status)} />
          <DetailRow
            label="Created Date"
            value={formatDate(version.createdAt)}
          />
          <DetailRow
            label="Completed Date"
            value={formatDate(version.completedAt)}
          />
        </dl>
        <div className="mt-5 min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Token Usage
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-ink-200 bg-ink-50 p-3">
            <JsonValue value={version.tokenUsage} />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-ink-200 bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-base font-semibold text-ink-950">
          Raw structured analysis
        </summary>
        <div className="mt-5 max-h-96 min-w-0 overflow-auto rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm">
          <JsonValue value={version.analysis} />
        </div>
      </details>
    </div>
  );
}

function LogsTimeline({ logs }: { logs: unknown[] }) {
  if (!logs.length)
    return (
      <p className="text-sm text-ink-600">
        No analysis logs are available for this case.
      </p>
    );

  return (
    <div className="relative max-h-[32rem] min-w-0 space-y-4 overflow-y-auto pr-1 before:absolute before:left-4 before:top-2 before:h-full before:w-px before:bg-ink-200">
      {logs.map((entry, index) => {
        const event = isRecord(entry)
          ? toDisplayValue(entry.event || entry.title || entry.action) ||
            "Analysis activity"
          : "Analysis activity";
        const message = isRecord(entry)
          ? toDisplayValue(entry.message || entry.description)
          : "";
        const status = isRecord(entry)
          ? toDisplayValue(entry.status || entry.jobStatus || entry.level)
          : "";
        const timestamp = isRecord(entry)
          ? (entry.at ?? entry.createdAt ?? entry.timestamp)
          : null;
        return (
          <div key={index} className="relative flex gap-4">
            <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink-200 bg-white">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 break-words font-semibold text-ink-950">
                  {event}
                </p>
                <p className="text-xs text-ink-500">
                  {formatDate(typeof timestamp === "string" ? timestamp : null)}
                </p>
              </div>
              {message ? (
                <p className="mt-1 break-words text-sm text-ink-600">
                  {message}
                </p>
              ) : null}
              {status ? (
                <div className="mt-3">
                  <Badge tone="muted">{formatStatus(status)}</Badge>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CaseDetails({ caseItem }: { caseItem: unknown }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const canUseReportDesigner = isAdminUser(user);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isReportDesignModalOpen, setIsReportDesignModalOpen] = useState(false);
  const [selectedReportDesignId, setSelectedReportDesignId] = useState("");
  const [reportDesignRunError, setReportDesignRunError] = useState<string | null>(null);
  const [reportDesignPreviewOpen, setReportDesignPreviewOpen] = useState(false);
  const [reportDesignPreviewPayload, setReportDesignPreviewPayload] = useState<unknown>(null);
  const [reportDesignPreviewTitle, setReportDesignPreviewTitle] = useState("Report design preview");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedDownloadVersionId, setSelectedDownloadVersionId] =
    useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [duplicateReused, setDuplicateReused] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [inputHash, setInputHash] = useState("");
  const [model, setModel] = useState("");
  const setReportDesignerTemplate = useReportDesignerStore((state) => state.setTemplate);

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
  const defaultDownload = useMemo(
    () => defaultDownloadVersion(versions),
    [versions],
  );
  const selectedVersion =
    versions.find((version) => version.analysisId === selectedVersionId) ??
    current;
  const selectedDownloadVersion =
    versions.find(
      (version) => version.analysisId === selectedDownloadVersionId,
    ) ?? null;
  const selectedVersionSchemaKey = selectedVersion?.schemaKey ?? "";
  const selectedVersionSchemaVersion = selectedVersion?.schemaVersion ?? null;
  const reportDesignsQuery = useQuery({
    queryKey: ["case-report-designs", selectedVersionSchemaKey],
    queryFn: () => getReportDesigns(selectedVersionSchemaKey || undefined),
    enabled: Boolean(isReportDesignModalOpen && selectedVersionSchemaKey),
  });
  const compatibleReportDesigns = useMemo(
    () =>
      (reportDesignsQuery.data ?? []).filter(
        (design) =>
          design.schemaKey === selectedVersionSchemaKey &&
          schemaVersionsMatch(design.schemaVersion, selectedVersionSchemaVersion),
      ),
    [reportDesignsQuery.data, selectedVersionSchemaKey, selectedVersionSchemaVersion],
  );
  const selectedReportDesign =
    compatibleReportDesigns.find((design) => getReportDesignId(design) === selectedReportDesignId) ??
    null;
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
    if (isDownloadModalOpen) {
      setSelectedDownloadVersionId(defaultDownload?.analysisId ?? "");
      setDownloadError(null);
    }
  }, [defaultDownload, isDownloadModalOpen]);

  useEffect(() => {
    if (!isReportDesignModalOpen) return;
    setReportDesignRunError(null);
    setSelectedReportDesignId((current) => {
      if (compatibleReportDesigns.some((design) => getReportDesignId(design) === current)) {
        return current;
      }
      return compatibleReportDesigns[0] ? getReportDesignId(compatibleReportDesigns[0]) : "";
    });
  }, [compatibleReportDesigns, isReportDesignModalOpen]);

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

  const previewReportDesignMutation = useMutation({
    mutationFn: async () => {
      if (!caseId || !selectedVersion || !selectedReportDesign) {
        throw new Error("Select a completed analysis version and report design first.");
      }

      return previewReportDesign(getReportDesignId(selectedReportDesign), {
        caseId,
        analysisId: selectedVersion.analysisId,
      });
    },
    onMutate: () => setReportDesignRunError(null),
    onSuccess: (payload) => {
      if (selectedReportDesign) {
        setReportDesignerTemplate(getReportDesignTemplate(selectedReportDesign));
        setReportDesignPreviewTitle(reportDesignDisplayName(selectedReportDesign));
      }
      setReportDesignPreviewPayload(payload);
      setReportDesignPreviewOpen(true);
      setIsReportDesignModalOpen(false);
      showToast({ tone: "success", title: "Report design preview loaded." });
    },
    onError: (error) => {
      const message = getSchemaMismatchMessage(error);
      setReportDesignRunError(message);
      showToast({ tone: "error", title: message });
    },
  });

  const generateReportDesignMutation = useMutation({
    mutationFn: async () => {
      if (!caseId || !selectedVersion || !selectedReportDesign) {
        throw new Error("Select a completed analysis version and report design first.");
      }

      return generateReportDesign(getReportDesignId(selectedReportDesign), {
        caseId,
        analysisId: selectedVersion.analysisId,
      });
    },
    onMutate: () => setReportDesignRunError(null),
    onSuccess: (result) => {
      if (result.kind === "file") {
        downloadBlob(result.blob, result.fileName);
      } else {
        if (selectedReportDesign) {
          setReportDesignerTemplate(getReportDesignTemplate(selectedReportDesign));
          setReportDesignPreviewTitle(reportDesignDisplayName(selectedReportDesign));
        }
        setReportDesignPreviewPayload(result.payload);
        setReportDesignPreviewOpen(true);
      }
      setIsReportDesignModalOpen(false);
      showToast({ tone: "success", title: "Report generated." });
    },
    onError: (error) => {
      const message = getSchemaMismatchMessage(error);
      setReportDesignRunError(message);
      showToast({ tone: "error", title: message });
    },
  });

  async function handleDownloadAnalysis() {
    if (
      !caseId ||
      !selectedDownloadVersion ||
      !isCompleted(selectedDownloadVersion)
    )
      return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const download = await downloadCaseAnalysisVersion({
        caseId,
        analysisId: selectedDownloadVersion.analysisId,
      });
      const url = URL.createObjectURL(download.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        download.fileName ||
        `analysis-v${selectedDownloadVersion.versionNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setIsDownloadModalOpen(false);
    } catch (error) {
      setDownloadError(
        error instanceof ApiError
          ? error.message
          : "Unable to download this analysis version.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

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
            <div className="w-full rounded-xl border border-ink-200 bg-ink-50 p-4 lg:max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Selected analysis
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink-950">
                {selectedVersion ? `v${selectedVersion.versionNumber}` : "None"}
              </p>
              <p className="mt-1 break-all text-xs text-ink-500">
                {selectedVersion?.analysisId ||
                  "Run analysis to create a version."}
              </p>
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

          <Card id="analysis-logs" className="rounded-xl">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Analysis Activity</CardTitle>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void logsQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="min-w-0">
              <LogsTimeline logs={logs} />
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
                onClick={() => setIsDownloadModalOpen(true)}
                disabled={!defaultDownload}
                className="w-full"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Report
              </Button>
              {canUseReportDesigner && selectedVersion && isCompleted(selectedVersion) ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsReportDesignModalOpen(true)}
                  disabled={!selectedVersion.schemaKey}
                  title={!selectedVersion.schemaKey ? "The selected analysis does not include a structured output schema." : undefined}
                >
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  Design Report
                </Button>
              ) : canUseReportDesigner ? (
                <Button
                  variant="secondary"
                  disabled
                  title="Only completed analyses can be used for report design."
                  className="w-full"
                >
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  Design Report
                </Button>
              ) : null}
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("analysis-logs")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  View Logs
                </Button>
              </div>
              <details className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-950">
                  Advanced analysis options
                </summary>
                <div className="mt-3 grid gap-2">
                  <input
                    value={inputHash}
                    onChange={(event) => setInputHash(event.target.value)}
                    disabled={running || analyzeMutation.isPending}
                    placeholder="Optional inputHash"
                    className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    disabled={running || analyzeMutation.isPending}
                    placeholder="Optional model"
                    className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2 text-sm"
                  />
                </div>
              </details>
            </CardContent>
          </Card>

          <AnalysisVersionList
            versions={versions}
            selectedVersion={selectedVersion ?? null}
            setSelectedVersionId={setSelectedVersionId}
          />

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Case Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid min-w-0 gap-4">
                <DetailRow label="Case ID" value={caseId} breakAll />
                <DetailRow
                  label="Reference"
                  value={caseReferenceNumber || "Not assigned"}
                  breakAll
                />
                <DetailRow label="Case Type" value={caseType} />
                <DetailRow label="Files Attached" value={filesAttachedCount} />
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>

      {isDownloadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="analysis-download-title"
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-ink-200 bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="analysis-download-title"
                  className="text-base font-semibold text-ink-950"
                >
                  Download Analysis Version
                </h2>
                {selectedDownloadVersion ? (
                  <p className="mt-1 break-all text-sm text-ink-600">
                    Selected version {selectedDownloadVersion.versionNumber} (
                    {selectedDownloadVersion.analysisId})
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDownloadModalOpen(false)}
                className="min-h-9 px-3"
              >
                Close
              </Button>
            </div>

            <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-5 py-5">
              {!defaultDownload ? (
                <Alert tone="info">
                  No completed analysis version is available to download.
                </Alert>
              ) : null}
              <div className="mt-4 max-h-[48vh] space-y-3 overflow-y-auto pr-1">
                {versions.map((version) => {
                  const completed = isCompleted(version);
                  const selected =
                    selectedDownloadVersion?.analysisId === version.analysisId;
                  return (
                    <label
                      key={version.analysisId}
                      className={[
                        selected
                          ? "border-ink-950 shadow-sm"
                          : "border-ink-200",
                        completed
                          ? "cursor-pointer"
                          : "cursor-not-allowed bg-ink-50 opacity-75",
                        "block rounded-lg border p-4 transition",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="analysis-version"
                          value={version.analysisId}
                          checked={selected}
                          disabled={!completed}
                          onChange={() =>
                            setSelectedDownloadVersionId(version.analysisId)
                          }
                          className="mt-1 h-4 w-4 accent-ink-950"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink-950">
                              Version {version.versionNumber}
                            </p>
                            {version.isCurrent ? (
                              <Badge tone="solid">Current</Badge>
                            ) : null}
                            <Badge tone={completed ? "outline" : "muted"}>
                              {formatStatus(version.status)}
                            </Badge>
                          </div>
                          {!completed ? (
                            <p className="mt-2 text-sm text-ink-600">
                              Analysis not completed yet.
                            </p>
                          ) : null}
                          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            <DetailRow
                              label="Created date"
                              value={formatDate(version.createdAt)}
                            />
                            <DetailRow
                              label="Completed date"
                              value={formatDate(version.completedAt)}
                            />
                            <DetailRow
                              label="Confidence score"
                              value={score(version.confidenceScore)}
                            />
                            <DetailRow
                              label="Satisfaction score"
                              value={score(version.satisfactionScore, 5)}
                            />
                            <DetailRow label="Model" value={version.model} />
                            <DetailRow
                              label="Analysis ID"
                              value={version.analysisId}
                              breakAll
                            />
                          </dl>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {downloadError ? (
                <Alert tone="error" className="mt-4">
                  {downloadError}
                </Alert>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink-200 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDownloadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleDownloadAnalysis()}
                isLoading={isDownloading}
                disabled={
                  !selectedDownloadVersion ||
                  !isCompleted(selectedDownloadVersion)
                }
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Selected Version
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isReportDesignModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-design-selection-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-ink-200 bg-white shadow-xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
              <div className="min-w-0">
                <h2
                  id="report-design-selection-title"
                  className="text-base font-semibold text-ink-950"
                >
                  Select Report Design
                </h2>
                {selectedVersion ? (
                  <p className="mt-1 break-words text-sm text-ink-600">
                    Version {selectedVersion.versionNumber} uses {selectedVersion.schemaKey || "no schema"}
                    {selectedVersion.schemaVersion ? ` v${selectedVersion.schemaVersion}` : ""}.
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsReportDesignModalOpen(false)}
                className="min-h-9 px-3"
              >
                Close
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {!selectedVersion || !isCompleted(selectedVersion) ? (
                <Alert tone="info">
                  Select a completed analysis version before choosing a report design.
                </Alert>
              ) : null}
              {selectedVersion && !selectedVersion.schemaKey ? (
                <Alert tone="error">
                  The selected analysis version does not include a schema key, so it cannot be matched to a report design.
                </Alert>
              ) : null}
              {reportDesignRunError ? (
                <Alert tone="error" className="mb-4">
                  {reportDesignRunError}
                </Alert>
              ) : null}
              {reportDesignsQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-lg bg-ink-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-ink-100" />
                </div>
              ) : null}
              {reportDesignsQuery.isError ? (
                <Alert tone="error">
                  {reportDesignsQuery.error instanceof Error
                    ? reportDesignsQuery.error.message
                    : "Unable to load compatible report designs."}
                </Alert>
              ) : null}
              {!reportDesignsQuery.isLoading && selectedVersion?.schemaKey && compatibleReportDesigns.length === 0 ? (
                <Alert tone="info">
                  No active report designs match this analysis schema and version.
                </Alert>
              ) : null}
              <div className="space-y-3">
                {compatibleReportDesigns.map((design) => {
                  const designId = getReportDesignId(design);
                  const selected = selectedReportDesignId === designId;

                  return (
                    <label
                      key={designId || design.name}
                      className={[
                        selected ? "border-ink-950 shadow-sm" : "border-ink-200",
                        "block cursor-pointer rounded-lg border p-4 transition hover:border-ink-950",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="report-design"
                          value={designId}
                          checked={selected}
                          onChange={() => setSelectedReportDesignId(designId)}
                          className="mt-1 h-4 w-4 accent-ink-950"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-sm font-semibold text-ink-950">
                              {reportDesignDisplayName(design)}
                            </p>
                            <Badge tone="outline">{design.schemaKey}</Badge>
                            {design.schemaVersion ? <Badge tone="muted">v{design.schemaVersion}</Badge> : null}
                          </div>
                          <p className="mt-2 break-words text-sm text-ink-600">
                            {design.description || "No description provided."}
                          </p>
                          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <DetailRow label="Components" value={design.design.components.length} />
                            <DetailRow label="Bindings" value={design.bindings.length} />
                            <DetailRow label="Updated" value={formatDate(design.updatedAt)} />
                          </dl>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink-200 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsReportDesignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => previewReportDesignMutation.mutate()}
                isLoading={previewReportDesignMutation.isPending}
                disabled={!selectedReportDesign || generateReportDesignMutation.isPending}
              >
                Preview
              </Button>
              <Button
                type="button"
                onClick={() => generateReportDesignMutation.mutate()}
                isLoading={generateReportDesignMutation.isPending}
                disabled={!selectedReportDesign || previewReportDesignMutation.isPending}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminReportPreviewModal
        open={reportDesignPreviewOpen}
        onClose={() => setReportDesignPreviewOpen(false)}
        payload={reportDesignPreviewPayload}
        title={reportDesignPreviewTitle}
      />
    </div>
  );
}
