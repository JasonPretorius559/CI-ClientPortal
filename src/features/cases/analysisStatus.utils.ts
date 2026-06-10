function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export type DocumentExtractionFileStatus = {
  index: number;
  originalName: string;
  documentUnderstandingStatus: string;
  extractedTextStatus: string;
};

export type DocumentExtractionSummary = {
  stage: string;
  message: string;
  pdfCount: number;
  readyCount: number;
  pendingCount: number;
  failedCount: number;
  files: DocumentExtractionFileStatus[];
};

export type CaseAnalysisStatusDetail = {
  status: string;
  message: string | null;
  error: string | null;
  needsInput: boolean;
  documentExtraction: DocumentExtractionSummary | null;
  jobStatus: string | null;
  jobError: string | null;
  progress: number | null;
  stage: string | null;
};

const ACTIVE_STATUSES = new Set([
  "queued",
  "running",
  "processing",
  "retrying",
  "pending",
]);

const COMPLETED_STATUSES = new Set(["completed", "completed_with_warnings"]);

export function formatAnalysisStage(stage: string) {
  return stage.replace(/[_-]+/g, " ").trim();
}

export function getStageLabel(stage: string) {
  switch (stage) {
    case "extracting_documents":
      return "Reading documents";
    case "extraction_failed":
      return "Document extraction failed";
    case "queued":
      return "Queued";
    case "retrying":
      return "Retrying";
    case "reading_documents":
      return "Reading policy text";
    case "reviewing_policy":
      return "Reviewing policy";
    case "evaluating_cover":
      return "Evaluating cover";
    case "generating_recommendations":
      return "Generating recommendations";
    case "finalising":
      return "Finalising";
    case "completed":
      return "Complete";
    case "failed":
    case "timed_out":
      return "Failed";
    default:
      return formatAnalysisStage(stage);
  }
}

function normalizeDocumentExtraction(value: unknown): DocumentExtractionSummary | null {
  if (!isRecord(value)) return null;

  const files = Array.isArray(value.files)
    ? value.files
        .map((file, index) => {
          if (!isRecord(file)) return null;
          return {
            index: readNumber(file, ["index"]) ?? index,
            originalName: readString(file, ["originalName", "name"]) || `Document ${index + 1}`,
            documentUnderstandingStatus:
              readString(file, ["documentUnderstandingStatus", "status"]) || "pending",
            extractedTextStatus:
              readString(file, ["extractedTextStatus"]) || "not_started",
          };
        })
        .filter((file): file is DocumentExtractionFileStatus => Boolean(file))
    : [];

  return {
    stage: readString(value, ["stage"]) || "ready",
    message: readString(value, ["message"]) || "Document status unknown.",
    pdfCount: readNumber(value, ["pdfCount"]) ?? files.length,
    readyCount: readNumber(value, ["readyCount"]) ?? 0,
    pendingCount: readNumber(value, ["pendingCount"]) ?? 0,
    failedCount: readNumber(value, ["failedCount"]) ?? 0,
    files,
  };
}

function estimateProgressFromStatus(status: string, documentExtraction: DocumentExtractionSummary | null) {
  const normalized = status.toLowerCase();

  if (COMPLETED_STATUSES.has(normalized)) return 100;
  if (normalized === "failed") return 100;

  if (documentExtraction?.stage === "extracting") {
    const total = Math.max(documentExtraction.pdfCount, 1);
    return Math.min(12 + Math.round((documentExtraction.readyCount / total) * 28), 38);
  }

  if (documentExtraction?.stage === "failed") return 100;
  if (normalized === "queued" || normalized === "pending") return 25;
  if (normalized === "retrying") return 40;
  if (normalized === "processing" || normalized === "running") return 65;
  return null;
}

export function parseCaseAnalysisStatus(payload: unknown): CaseAnalysisStatusDetail {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : isRecord(payload) ? payload : {};
  const status =
    readString(data, ["openAiAnalysisStatus", "status"]).toLowerCase() || "not_started";
  const message = readString(data, ["analysisMessage", "message"]) || null;
  const error = readString(data, ["analysisError", "error", "lastError"]) || null;
  const needsInput = data.analysisNeedsInput === true;
  const documentExtraction = normalizeDocumentExtraction(data.documentExtraction);

  const job = isRecord(data.analysisJob) ? data.analysisJob : null;
  const jobStatus = job ? readString(job, ["status"]) || null : null;
  const jobError = job ? readString(job, ["lastError", "error"]) || null : null;

  let stage: string | null = null;
  let progress = estimateProgressFromStatus(status, documentExtraction);

  if (documentExtraction?.stage === "extracting" && ACTIVE_STATUSES.has(status)) {
    stage = "extracting_documents";
    progress = estimateProgressFromStatus(status, documentExtraction);
  } else if (documentExtraction?.stage === "failed") {
    stage = "extraction_failed";
    progress = 100;
  } else if (status === "queued") {
    stage = "queued";
  } else if (status === "running" || status === "processing") {
    stage = "reading_documents";
    progress = progress ?? 65;
  } else if (status === "retrying") {
    stage = "retrying";
    progress = progress ?? 40;
  } else if (status === "failed") {
    stage = "failed";
    progress = 100;
  } else if (COMPLETED_STATUSES.has(status)) {
    stage = "completed";
    progress = 100;
  }

  return {
    status,
    message,
    error: error || jobError,
    needsInput,
    documentExtraction,
    jobStatus,
    jobError,
    progress,
    stage,
  };
}

export function isActiveAnalysisStatus(status: string) {
  return ACTIVE_STATUSES.has(status.toLowerCase());
}

export function isCompletedAnalysisStatus(status: string) {
  return COMPLETED_STATUSES.has(status.toLowerCase());
}

export function getFailureMessage(detail: CaseAnalysisStatusDetail) {
  if (detail.documentExtraction?.stage === "failed") {
    return detail.documentExtraction.message;
  }

  return detail.error || detail.jobError || detail.message || "Analysis could not be completed.";
}

export function getProgressMessage(detail: CaseAnalysisStatusDetail) {
  if (detail.documentExtraction?.stage === "extracting" && isActiveAnalysisStatus(detail.status)) {
    return detail.documentExtraction.message;
  }

  if (detail.message) return detail.message;

  if (detail.stage) {
    return getStageLabel(detail.stage);
  }

  return "Preparing analysis.";
}
