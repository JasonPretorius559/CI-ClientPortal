import { apiFetch } from "../../lib/api";

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

function getPayloadItems(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const data = isRecord(payload.data) ? payload.data : payload;

  for (const key of ["items", "jobs", "analyses", "data"]) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

export type ActiveAnalysisProgress = {
  analysisJobId: string;
  caseId: string;
  caseTitle: string;
  caseReferenceNumber: string | null;
  status: string;
  progress: number;
  stage: string;
  message: string;
  attempts: number | null;
  maxAttempts: number | null;
  openAiModel: string | null;
  versionNumber: number | null;
  queuedAt: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  analysisError: string | null;
  extractionFailed: boolean;
};

function normalizeProgressItem(item: unknown): ActiveAnalysisProgress | null {
  if (!isRecord(item)) return null;

  const analysisJobId = readString(item, ["analysisJobId", "jobId", "_id", "id"]);
  const caseId = readString(item, ["caseId"]);

  if (!analysisJobId || !caseId) return null;

  return {
    analysisJobId,
    caseId,
    caseTitle: readString(item, ["caseTitle", "title", "name"]) || "Case analysis",
    caseReferenceNumber: readString(item, ["caseReferenceNumber", "externalCaseId", "referenceNumber"]) || null,
    status: readString(item, ["status", "jobStatus"]) || "queued",
    progress: Math.max(0, Math.min(100, readNumber(item, ["progress", "percent", "percentage"]) ?? 0)),
    stage: readString(item, ["stage", "step"]) || "queued",
    message: readString(item, ["message", "statusMessage", "description"]) || "Analysis is running.",
    attempts: readNumber(item, ["attempts", "attempt"]),
    maxAttempts: readNumber(item, ["maxAttempts"]),
    openAiModel: readString(item, ["openAiModel", "model"]) || null,
    versionNumber: readNumber(item, ["versionNumber", "version"]),
    queuedAt: readString(item, ["queuedAt", "createdAt"]) || null,
    startedAt: readString(item, ["startedAt"]) || null,
    updatedAt: readString(item, ["updatedAt"]) || null,
    analysisError: readString(item, ["analysisError", "lastError", "error"]) || null,
    extractionFailed: item.extractionFailed === true,
  };
}

export async function getActiveAnalysisProgress() {
  const response = await apiFetch<unknown>("/api/auth/analysis-progress", {
    method: "GET",
    skipAuthRedirect: true,
  });

  return getPayloadItems(response)
    .map(normalizeProgressItem)
    .filter((item): item is ActiveAnalysisProgress => Boolean(item));
}
