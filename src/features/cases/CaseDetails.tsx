import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileSearch2,
  FileText,
  FileWarning,
  History,
  Layers3,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
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
import { CaseInformationRequests } from "../notifications/CaseInformationRequests";
import {
  analyzeCase,
  cancelCaseAnalysis,
  getCaseAnalysisTypes,
  getCaseAnalysisStatus,
  getCaseAnalysisVersions,
  type CaseAnalysisType,
  type AnalysisVersion,
} from "./cases.api";
import type { IntakeFieldDefinition } from "./cases.schemas";
import { getCaseStatus, readCaseField } from "./cases.utils";

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
  const analysis = isRecord(version.analysis) ? version.analysis : {};
  const summary = isRecord(analysis.summary_of_comparison)
    ? analysis.summary_of_comparison
    : null;
  const overview =
    summary && typeof summary.one_paragraph_overview === "string"
      ? summary.one_paragraph_overview
      : "";
  const headlineFindings = summary
    ? asList(summary.headline_findings)
    : [];
  const tables = isRecord(analysis.tables) ? analysis.tables : null;
  const premiumComparison =
    tables && isRecord(tables.premium_comparison)
      ? tables.premium_comparison
      : null;
  const premiumColumns = premiumComparison
    ? asList(premiumComparison.columns).map(String)
    : [];
  const premiumRows = premiumComparison
    ? asList(premiumComparison.rows).filter(Array.isArray)
    : [];
  const recommendations = isRecord(analysis.recommendations)
    ? analysis.recommendations
    : null;
  const primaryRecommendation =
    recommendations && isRecord(recommendations.primary_recommendation)
      ? recommendations.primary_recommendation
      : null;
  const recommendedInsurer = primaryRecommendation
    ? toDisplayValue(
        primaryRecommendation.insurer_name ??
          primaryRecommendation.recommended_option_name,
      )
    : "";
  const recommendationSummary =
    primaryRecommendation &&
    typeof primaryRecommendation.fit_for_client_summary === "string"
      ? primaryRecommendation.fit_for_client_summary
      : "";
  const recommendationReasons = primaryRecommendation
    ? asList(primaryRecommendation.reasons)
    : [];
  const recommendationWatchOuts = primaryRecommendation
    ? asList(primaryRecommendation.watch_outs)
    : [];
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
        description="Review the comparison, recommendation, evidence quality, gaps, and warnings."
      />

      {overview || headlineFindings.length ? (
        <section className="space-y-4 border border-surface-line bg-white p-5">
          <SectionDivider title="Comparison Summary" />
          {overview ? (
            <p className="text-sm leading-6 text-ink-800">{overview}</p>
          ) : null}
          {headlineFindings.length ? (
            <ul className="grid gap-2 text-sm text-ink-700">
              {headlineFindings.map((finding, index) => (
                <li key={index} className="border-l-2 border-ink-300 pl-3">
                  {String(finding)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {premiumColumns.length && premiumRows.length ? (
        <section className="space-y-4">
          <SectionDivider title="Premium Comparison" />
          <div className="overflow-x-auto border border-surface-line bg-white">
            <table className="min-w-full divide-y divide-surface-line text-left text-sm">
              <thead className="bg-surface-subtle">
                <tr>
                  {premiumColumns.map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-semibold text-ink-800"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-line">
                {premiumRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {(row as unknown[]).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="whitespace-nowrap px-4 py-3 text-ink-700"
                      >
                        {toDisplayValue(cell) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {primaryRecommendation ? (
        <section className="space-y-4 border border-ink-950 bg-ink-950 p-5 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Primary recommendation
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {recommendedInsurer || "Recommended option"}
            </h3>
          </div>
          {recommendationSummary ? (
            <p className="text-sm leading-6 text-white/85">
              {recommendationSummary}
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            {recommendationReasons.length ? (
              <div>
                <p className="text-sm font-semibold">Why it fits</p>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  {recommendationReasons.map((reason, index) => (
                    <li key={index}>• {String(reason)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {recommendationWatchOuts.length ? (
              <div>
                <p className="text-sm font-semibold">Watch-outs</p>
                <ul className="mt-2 space-y-2 text-sm text-white/80">
                  {recommendationWatchOuts.map((watchOut, index) => (
                    <li key={index}>• {String(watchOut)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="border border-surface-line bg-surface-subtle p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Evidence confidence
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-950">
              {score(version.confidenceScore)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Analysis satisfaction
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-950">
              {score(version.satisfactionScore, 5)}
            </p>
          </div>
        </div>
        {typeof version.satisfactionScoreDetails === "string" &&
        version.satisfactionScoreDetails.trim() ? (
          <p className="mt-4 text-sm text-ink-700">
            {version.satisfactionScoreDetails}
          </p>
        ) : null}
        {asList(version.satisfactionScoreFactors).length ? (
          <ul className="mt-3 grid gap-1 text-xs text-ink-600 sm:grid-cols-2">
            {asList(version.satisfactionScoreFactors).map((factor, index) => (
              <li key={index}>• {String(factor)}</li>
            ))}
          </ul>
        ) : null}
      </section>

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

function analysisTypeStatusLabel(type: CaseAnalysisType) {
  if (type.isActiveJob) return formatStatus(type.status);
  if (type.latestVersionNumber !== null && ["completed", "completed_with_warnings"].includes(type.status)) {
    return `Completed · Version ${type.latestVersionNumber}`;
  }
  if (["failed", "timed_out", "cancelled", "unable_to_analyse"].includes(type.status)) return formatStatus(type.status);
  return type.latestVersionNumber !== null ? `${formatStatus(type.status)} · Version ${type.latestVersionNumber}` : "Not run";
}

function analysisTypeActionLabel(type: CaseAnalysisType) {
  if (type.isActiveJob) return "Cancel";
  if (["failed", "timed_out", "cancelled", "unable_to_analyse"].includes(type.status)) return "Retry";
  return type.latestVersionNumber !== null ? "Run New Version" : "Run";
}

function AnalysisIntakeField({
  field,
  value,
  onChange,
}: {
  field: IntakeFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const sharedClass = "w-full rounded-xl border border-ink-300 bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200";
  return (
    <label className={field.type === "textarea" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <span className="text-sm font-medium text-ink-950">{field.label}{field.required ? " *" : ""}</span>
      {field.helpText ? <span className="block text-xs leading-5 text-ink-500">{field.helpText}</span> : null}
      {field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={`${sharedClass} h-12`}>
          <option value="">Select an option</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.type === "boolean" ? (
        <span className="flex h-12 items-center gap-3 rounded-xl border border-ink-300 bg-white px-4">
          <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-ink-300 text-ink-950 focus:ring-ink-500" />
          <span className="text-sm text-ink-700">{value === true ? "Yes" : "No"}</span>
        </span>
      ) : field.type === "textarea" ? (
        <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} rows={4} className={`${sharedClass} py-3`} />
      ) : (
        <input type={field.type === "phone" ? "tel" : field.type} value={String(value ?? "")} onChange={(event) => onChange(field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} className={`${sharedClass} h-12`} />
      )}
    </label>
  );
}

function AnalysisIntakeDialog({
  type,
  values,
  error,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  type: CaseAnalysisType;
  values: Record<string, unknown>;
  error: string;
  isSubmitting: boolean;
  onChange: (key: string, value: unknown) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="dialog-overlay" aria-hidden="true" onClick={onClose} />
      <div className="dialog-frame" role="dialog" aria-modal="true" aria-labelledby="analysis-intake-title">
        <section className="dialog-shell">
          <div className="flex items-start justify-between gap-4 border-b border-surface-line px-5 py-5 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Before this analysis runs</p>
              <h2 id="analysis-intake-title" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink-950">{type.name}</h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">Complete the questions configured specifically for this analysis type.</p>
            </div>
            <Button type="button" variant="ghost" className="px-2" aria-label="Close analysis questions" onClick={onClose}><X className="h-5 w-5" aria-hidden="true" /></Button>
          </div>
          <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              {type.intakeFields.map((field) => <AnalysisIntakeField key={field.key} field={field} value={values[field.key]} onChange={(value) => onChange(field.key, value)} />)}
            </div>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="flex flex-col-reverse gap-3 border-t border-surface-line pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting}><Play className="h-4 w-4" aria-hidden="true" />{analysisTypeActionLabel(type)}</Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

export function CaseDetails({ caseItem }: { caseItem: unknown }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const streamStatus = useAnalysisStreamStatus();
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedDeliverableId, setSelectedDeliverableId] = useState("");
  const [intakeDialogType, setIntakeDialogType] = useState<CaseAnalysisType | null>(null);
  const [workspaceDialog, setWorkspaceDialog] = useState<"analyses" | "documents" | "requests" | "collaboration" | "history" | "processing" | null>(null);
  const [analysisSearch, setAnalysisSearch] = useState("");
  const [analysisIntakeData, setAnalysisIntakeData] = useState<Record<string, unknown>>({});
  const [analysisIntakeError, setAnalysisIntakeError] = useState("");
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
    "Case Analysis";
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
  const analysisTypesQuery = useQuery({
    queryKey: ["case-analysis-types", caseId],
    queryFn: () => getCaseAnalysisTypes(caseId),
    enabled: Boolean(caseId),
    refetchInterval: pollingEnabled ? (streamStatus === "open" ? 30_000 : 4000) : false,
  });
  const deliverables = useMemo(() => analysisTypesQuery.data ?? [], [analysisTypesQuery.data]);
  const filteredDeliverables = useMemo(() => {
    const query = analysisSearch.trim().toLowerCase();
    if (!query) return deliverables;
    return deliverables.filter((item) => [item.name, item.description, item.workflowType].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [analysisSearch, deliverables]);
  const selectedDeliverable = deliverables.find((item) => item.id === selectedDeliverableId) ?? deliverables[0] ?? null;
  const caseTypeLabel = [caseType, `${deliverables.length} analysis type${deliverables.length === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");
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
  const allVersions = useMemo(
    () => versionsQuery.data ?? [],
    [versionsQuery.data],
  );
  const versions = useMemo(() => allVersions.filter((version) => {
    if (!selectedDeliverable) return true;
    if (version.linkedCaseType?.id) return version.linkedCaseType.id === selectedDeliverable.id;
    return selectedDeliverable.id === deliverables[0]?.id;
  }), [allVersions, deliverables, selectedDeliverable]);
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
    if (!selectedDeliverableId && deliverables[0]) setSelectedDeliverableId(deliverables[0].id);
  }, [deliverables, selectedDeliverableId]);

  useEffect(() => {
    setSelectedVersionId("");
    setDuplicateReused(false);
  }, [selectedDeliverableId]);

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
        analysisTypesQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
      ]);
    }
  }, [analysisStatus, analysisTypesQuery, pollingEnabled, queryClient, versionsQuery]);

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
    mutationFn: ({ type, intakeData }: { type: CaseAnalysisType; intakeData: Record<string, unknown> }) =>
      analyzeCase({
        caseId,
        inputHash,
        model,
        force: type.latestVersionNumber !== null,
        linkedCaseTypeId: type.id,
        intakeData,
      }),
    onSuccess: async (result, variables) => {
      const data = dataRecord(result.payload);
      const duplicate = data.duplicateAnalysis === true;
      const returnedAnalysisId = toDisplayValue(data.analysisId);

      setSelectedDeliverableId(variables.type.id);
      setIntakeDialogType(null);
      setAnalysisIntakeError("");
      setDuplicateReused(duplicate);
      if (returnedAnalysisId) setSelectedVersionId(returnedAnalysisId);
      if (result.status === 202) setPollingEnabled(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cases", "mine"] }),
        analysisTypesQuery.refetch(),
        statusQuery.refetch(),
        versionsQuery.refetch(),
      ]);
    },
    onError: (error) => {
      if (intakeDialogType) {
        setAnalysisIntakeError(error instanceof ApiError ? error.message : "Unable to run this analysis.");
      }
    },
  });

  function requestAnalysis(type: CaseAnalysisType) {
    setSelectedDeliverableId(type.id);
    setWorkspaceDialog(null);
    setAnalysisIntakeError("");
    if (type.intakeFields.length) {
      setAnalysisIntakeData(type.intakeData);
      setIntakeDialogType(type);
      return;
    }
    analyzeMutation.mutate({ type, intakeData: {} });
  }

  function submitAnalysisIntake() {
    if (!intakeDialogType) return;
    const missingField = intakeDialogType.intakeFields.find((field) => {
      const value = analysisIntakeData[field.key];
      return field.required && (value === undefined || value === null || value === "");
    });
    if (missingField) {
      setAnalysisIntakeError(`${missingField.label} is required.`);
      return;
    }
    analyzeMutation.mutate({ type: intakeDialogType, intakeData: analysisIntakeData });
  }

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
        analysisTypesQuery.refetch(),
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

  const evidenceHref = selectedVersion && selectedDeliverable
    ? `/cases/${encodeURIComponent(caseId)}/evidence?analysisTypeId=${encodeURIComponent(selectedDeliverable.id)}&analysisId=${encodeURIComponent(selectedVersion.analysisId)}`
    : "";

  const fileList = files.length ? (
    <div className="divide-y divide-surface-line border-y border-surface-line">
      {files.map((file, index) => {
        const fileName = getFileName(file, index);
        const details = [getFileType(file), getFileSize(file)].filter(Boolean).join(" · ");
        const downloadUrl = getFileDownloadUrl(file);
        return (
          <div key={`${fileName}-${index}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-all text-sm font-medium text-ink-950">{fileName}</p>
              <p className="mt-1 text-xs text-ink-500">{details || "File details not provided"}</p>
            </div>
            {downloadUrl ? (
              <a href={getDownloadHref(downloadUrl)} target="_blank" rel="noreferrer" download={fileName} className="inline-flex shrink-0 items-center justify-center border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50">Download</a>
            ) : <span className="text-xs text-ink-500">Download unavailable</span>}
          </div>
        );
      })}
    </div>
  ) : <p className="text-sm text-ink-600">No supporting documents were attached to this case.</p>;

  return (
    <div className="space-y-6">
      {intakeDialogType ? (
        <AnalysisIntakeDialog
          type={intakeDialogType}
          values={analysisIntakeData}
          error={analysisIntakeError}
          isSubmitting={analyzeMutation.isPending}
          onChange={(key, value) => {
            setAnalysisIntakeError("");
            setAnalysisIntakeData((currentValues) => ({ ...currentValues, [key]: value }));
          }}
          onClose={() => {
            if (analyzeMutation.isPending) return;
            setIntakeDialogType(null);
            setAnalysisIntakeError("");
          }}
          onSubmit={submitAnalysisIntake}
        />
      ) : null}
      <Dialog open={workspaceDialog === "analyses"} title="Choose an analysis" description="Open an existing result or run one analysis type directly." size="lg" onClose={() => setWorkspaceDialog(null)}>
        {analysisTypesQuery.isLoading ? <p className="text-sm text-ink-600">Loading available analysis types...</p> : null}
        {analysisTypesQuery.isError ? <Alert tone="error">{analysisTypesQuery.error instanceof ApiError ? analysisTypesQuery.error.message : "Unable to load analysis types."}</Alert> : null}
        {deliverables.length ? (
          <label className="relative mb-5 block">
            <span className="sr-only">Filter analysis types</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input value={analysisSearch} onChange={(event) => setAnalysisSearch(event.target.value)} placeholder="Filter analysis types" className="h-11 w-full border border-ink-300 bg-white pl-11 pr-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200" />
          </label>
        ) : null}
        <div className="divide-y divide-surface-line border-y border-surface-line">
          {filteredDeliverables.map((deliverable) => {
            const selected = selectedDeliverable?.id === deliverable.id;
            return (
              <article key={deliverable.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setSelectedDeliverableId(deliverable.id); setWorkspaceDialog(null); }}>
                  <span className="flex items-center gap-2">
                    <span className={["h-2.5 w-2.5 rounded-full", deliverable.isActiveJob ? "animate-pulse bg-sky-500" : deliverable.latestVersionNumber !== null ? "bg-emerald-500" : "bg-ink-200"].join(" ")} />
                    <span className="font-semibold text-ink-950">{deliverable.name}</span>
                    {selected ? <Badge tone="outline">Viewing</Badge> : null}
                  </span>
                  <span className="mt-1 block text-sm text-ink-600">{deliverable.description || deliverable.workflowType.replace(/_/g, " ")}</span>
                  <span className="mt-2 block text-xs font-medium text-ink-500">{analysisTypeStatusLabel(deliverable)}</span>
                </button>
                <Button type="button" variant={deliverable.isActiveJob ? "secondary" : "primary"} className="shrink-0" isLoading={deliverable.isActiveJob ? cancelMutation.isPending : analyzeMutation.isPending && analyzeMutation.variables?.type.id === deliverable.id} disabled={deliverable.isActiveJob ? cancelMutation.isPending : !deliverable.canRun || analyzeMutation.isPending || cancelMutation.isPending} onClick={() => deliverable.isActiveJob ? cancelMutation.mutate() : requestAnalysis(deliverable)}>
                  {!deliverable.isActiveJob ? <Play className="h-4 w-4" aria-hidden="true" /> : null}{analysisTypeActionLabel(deliverable)}
                </Button>
              </article>
            );
          })}
        </div>
        {deliverables.length && !filteredDeliverables.length ? <p className="py-6 text-center text-sm text-ink-600">No analysis types match that filter.</p> : null}
        {!deliverables.length && !analysisTypesQuery.isLoading ? <p className="text-sm text-ink-600">No active analysis types are configured for this case type.</p> : null}
      </Dialog>
      <Dialog open={workspaceDialog === "documents"} title="Supporting documents" description={`${filesAttachedCount} file${filesAttachedCount === 1 ? "" : "s"} attached to this case.`} onClose={() => setWorkspaceDialog(null)}>{fileList}</Dialog>
      <Dialog open={workspaceDialog === "requests"} title="Information requests" description="Follow-ups and missing inputs for this case." size="lg" onClose={() => setWorkspaceDialog(null)}>{caseId ? <CaseInformationRequests caseId={caseId} /> : null}</Dialog>
      <Dialog open={workspaceDialog === "collaboration"} title="Collaboration" description="Case comments and team discussion." size="lg" onClose={() => setWorkspaceDialog(null)}>{caseId ? <CaseCollaboration caseId={caseId} /> : null}</Dialog>
      <Dialog open={workspaceDialog === "history"} title="Analysis history" description={`Versions for ${selectedDeliverable?.name || "the selected analysis"}.`} onClose={() => setWorkspaceDialog(null)}>
        <AnalysisVersionList versions={versions} selectedVersion={selectedVersion ?? null} setSelectedVersionId={(analysisId) => { setSelectedVersionId(analysisId); setWorkspaceDialog(null); }} />
      </Dialog>
      <Dialog open={workspaceDialog === "processing"} title="Processing details" description="Document preparation and completed analysis stages." onClose={() => setWorkspaceDialog(null)}><AnalysisProgressCard detail={analysisDetail} active={false} /></Dialog>

      <section className="rounded-2xl border border-surface-line bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CaseStatusBadge status={getCaseStatus(caseItem)} />
            <Badge
              tone={
                isCompleted(current ?? ({} as AnalysisVersion))
                  ? "outline"
                  : "muted"
              }
            >
              Analysis: {formatStatus(analysisStatus)}
            </Badge>
            <span className="text-sm text-ink-600">{caseTypeLabel}</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:flex lg:items-center">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Reference</dt>
              <dd className="mt-1 font-medium text-ink-950">#{caseReferenceNumber || "Not assigned"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Created</dt>
              <dd className="mt-1 whitespace-nowrap font-medium text-ink-950">{formatDate(submittedDate)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Updated</dt>
              <dd className="mt-1 whitespace-nowrap font-medium text-ink-950">{formatDate(lastUpdatedDate)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Files</dt>
              <dd className="mt-1 font-medium text-ink-950">{filesAttachedCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-ink-950 bg-ink-950 text-white shadow-soft">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-white/15 bg-white/10"><Layers3 className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Active analysis</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{selectedDeliverable?.name || "Choose an analysis"}</h2>
              <p className="mt-1 text-sm leading-6 text-white/60">{selectedDeliverable ? analysisTypeStatusLabel(selectedDeliverable) : "Select the analysis you need for this case."}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => setWorkspaceDialog("analyses")}>Change analysis</Button>
            {selectedDeliverable ? <Button type="button" className="bg-white text-ink-950 hover:bg-ink-100" isLoading={selectedDeliverable.isActiveJob ? cancelMutation.isPending : analyzeMutation.isPending && analyzeMutation.variables?.type.id === selectedDeliverable.id} disabled={selectedDeliverable.isActiveJob ? cancelMutation.isPending : !selectedDeliverable.canRun || analyzeMutation.isPending || cancelMutation.isPending} onClick={() => selectedDeliverable.isActiveJob ? cancelMutation.mutate() : requestAnalysis(selectedDeliverable)}>{!selectedDeliverable.isActiveJob ? <Play className="h-4 w-4" aria-hidden="true" /> : null}{analysisTypeActionLabel(selectedDeliverable)}</Button> : null}
          </div>
        </div>
      </section>

      <nav aria-label="Case tools" className="grid grid-cols-2 gap-2 rounded-2xl border border-surface-line bg-white p-2 sm:grid-cols-3 lg:grid-cols-6">
        <Button type="button" variant="ghost" onClick={() => setWorkspaceDialog("documents")}><FileText className="h-4 w-4" aria-hidden="true" />Documents <span className="text-ink-400">{filesAttachedCount}</span></Button>
        <Button type="button" variant="ghost" onClick={() => setWorkspaceDialog("requests")}><MessageSquare className="h-4 w-4" aria-hidden="true" />Requests</Button>
        <Button type="button" variant="ghost" onClick={() => setWorkspaceDialog("collaboration")}><MessageSquare className="h-4 w-4" aria-hidden="true" />Discussion</Button>
        <Button type="button" variant="ghost" onClick={() => setWorkspaceDialog("history")}><History className="h-4 w-4" aria-hidden="true" />History <span className="text-ink-400">{versions.length}</span></Button>
        <Button type="button" variant="ghost" onClick={() => setWorkspaceDialog("processing")}><Bot className="h-4 w-4" aria-hidden="true" />Process</Button>
        <Button type="button" variant="ghost" onClick={() => { void statusQuery.refetch(); void versionsQuery.refetch(); }}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</Button>
      </nav>

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
      {running ? (
        <AnalysisProgressCard detail={analysisDetail} active />
      ) : null}

      <section className="min-w-0 space-y-6 rounded-2xl border border-surface-line bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 border-b border-surface-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Analysis workspace</p>
            <h2 className="mt-2 text-lg font-semibold text-ink-950">{selectedDeliverable?.name || "No analysis selected"}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedVersion?.evidenceExplorer?.available && evidenceHref ? <Button asChild variant="secondary"><Link to={evidenceHref}><FileSearch2 className="h-4 w-4" aria-hidden="true" />Evidence</Link></Button> : null}
            <Button type="button" variant="secondary" onClick={() => generateReportMutation.mutate()} isLoading={generateReportMutation.isPending} disabled={!caseId || !selectedVersion || !isCompleted(selectedVersion)}><Download className="h-4 w-4" aria-hidden="true" />Generate report</Button>
          </div>
        </div>
        <SelectedAnalysis version={selectedVersion ?? null} current={current} />
      </section>
    </div>
  );
}
