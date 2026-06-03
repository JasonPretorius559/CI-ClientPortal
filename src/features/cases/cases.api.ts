import { API_BASE_URL, ApiError, apiFetch } from "../../lib/api";
import type { CaseFileMetadata, CreateCaseInput } from "./cases.schemas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeCasesResponse(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  for (const key of ["cases", "data", "userCases"]) {
    const value = response[key];

    if (Array.isArray(value)) return value;

    if (isRecord(value)) {
      for (const nestedKey of ["items", "cases", "data", "userCases"]) {
        const nestedValue = value[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
}

export type CaseLookupOption = {
  id: string;
  label: string;
  isActive: boolean;
  sectionalType: boolean;
};

function getArrayFromPayload(response: unknown, keys: string[]) {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return false;
}

function normalizeLookupResponse(response: unknown, keys: string[]): CaseLookupOption[] {
  return getArrayFromPayload(response, keys)
    .map((item) => {
      if (!isRecord(item)) return null;

      const id = readString(item, ["_id", "id", "value", "slug"]);
      const label = readString(item, [
        "title",
        "name",
        "label",
        "linkedCaseType",
        "value",
        "_id",
        "id",
      ]);

      if (!id || !label) return null;

      return {
        id,
        label,
        isActive: item.isActive !== false,
        sectionalType: item.sectionalType === true,
      };
    })
    .filter((item): item is CaseLookupOption => Boolean(item));
}

export async function getUserCases() {
  const response = await apiFetch<unknown>("/api/auth/user-cases", {
    method: "GET",
  });

  return normalizeCasesResponse(response);
}

export async function getUserCaseTypes() {
  const response = await apiFetch<unknown>("/api/auth/case-types", {
    method: "GET",
  });

  return normalizeLookupResponse(response, ["caseTypes", "data"]);
}

export async function getUserLinkedCaseTypes(caseTypeId: string) {
  const response = await apiFetch<unknown>(
    `/api/auth/case-types/${encodeURIComponent(caseTypeId)}/linked-case-types`,
    {
      method: "GET",
    },
  );

  return normalizeLookupResponse(response, ["linkedCaseTypes", "data"]);
}

export async function getUserEntityTypes() {
  const response = await apiFetch<unknown>("/api/auth/entity-types", {
    method: "GET",
  });

  return normalizeLookupResponse(response, ["entityTypes", "data"]);
}

export type AnalysisVersion = {
  analysisId: string;
  analysisJobId: string | null;
  versionNumber: number;
  inputHash: string | null;
  isCurrent: boolean;
  status: string;
  analysis: unknown;
  missingInformation: unknown;
  documentWarnings: unknown;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  error: unknown;
  confidenceScore: number | null;
  satisfactionScore: number | null;
  satisfactionScoreDetails: unknown;
  satisfactionScoreFactors: unknown;
  tokenUsage: unknown;
  model: string | null;
  schemaKey: string | null;
  schemaVersion: string | number | null;
};

export type AnalyzeCaseResult = {
  status: number;
  payload: unknown;
};

function getAnalysisVersionItems(response: unknown) {
  const versions = getArrayFromPayload(response, [
    "versions",
    "analysisVersions",
    "data",
    "items",
  ]);

  if (versions.length > 0 || !isRecord(response) || !isRecord(response.data)) {
    return versions;
  }

  return getArrayFromPayload(response.data, [
    "versions",
    "analysisVersions",
    "items",
    "data",
  ]);
}

function normalizeAnalysisVersion(item: unknown): AnalysisVersion | null {
  if (!isRecord(item)) return null;

  const schema = isRecord(item.schema) ? item.schema : null;
  const analysisId = readString(item, ["analysisId", "_id", "id"]);
  const versionNumber = readNumber(item, ["versionNumber", "version", "number"]);

  if (!analysisId || versionNumber === null) {
    return null;
  }

  return {
    analysisId,
    analysisJobId: readString(item, ["analysisJobId", "jobId"]) || null,
    versionNumber,
    inputHash: readString(item, ["inputHash"]) || null,
    isCurrent: readBoolean(item, ["isCurrent", "current"]),
    status: readString(item, ["status", "analysisStatus", "state"]) || "unknown",
    analysis: item.analysis ?? item.structuredOutput ?? item.result ?? null,
    missingInformation: item.missingInformation ?? null,
    documentWarnings: item.documentWarnings ?? null,
    createdAt: readString(item, ["createdAt", "createdDate", "created"]) || null,
    startedAt: readString(item, ["startedAt"]) || null,
    completedAt: readString(item, ["completedAt", "completedDate", "completed"]) || null,
    failedAt: readString(item, ["failedAt"]) || null,
    error: item.error ?? item.lastError ?? null,
    confidenceScore: readNumber(item, ["confidenceScore", "confidence", "score"]),
    satisfactionScore: readNumber(item, ["satisfactionScore"]),
    satisfactionScoreDetails: item.satisfactionScoreDetails ?? null,
    satisfactionScoreFactors: item.satisfactionScoreFactors ?? null,
    tokenUsage: item.tokenUsage ?? null,
    model: readString(item, ["openAiModel", "model", "modelName", "llmModel"]) || null,
    schemaKey: readString(item, ["structuredOutputSchemaKey", "schemaKey", "schemaName"]) || (schema ? readString(schema, ["key", "name"]) : null) || null,
    schemaVersion: readString(item, ["structuredOutputSchemaVersion", "schemaVersion"]) || readNumber(item, ["structuredOutputSchemaVersion", "schemaVersion"]) || (schema ? readString(schema, ["version"]) || readNumber(schema, ["version"]) : null),
  };
}

export function normalizeAnalysisVersionsResponse(response: unknown): AnalysisVersion[] {
  return getAnalysisVersionItems(response)
    .map(normalizeAnalysisVersion)
    .filter((item): item is AnalysisVersion => Boolean(item))
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function getCaseAnalysisVersions(caseId: string) {
  const response = await apiFetch<unknown>(
    `/api/admin/cases/${encodeURIComponent(caseId)}/analysis/versions`,
    {
      method: "GET",
    },
  );

  return normalizeAnalysisVersionsResponse(response);
}

export function getCaseAnalysisStatus(caseId: string) {
  return apiFetch<unknown>(`/api/admin/cases/${encodeURIComponent(caseId)}/analysis-status`, {
    method: "GET",
  });
}

export function getCaseLogs(caseId: string) {
  return apiFetch<unknown>(`/api/admin/cases/${encodeURIComponent(caseId)}/logs`, {
    method: "GET",
  });
}

async function parseRawResponse(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getRawPayloadMessage(payload: unknown) {
  if (!isRecord(payload)) return null;
  const message = payload.message ?? payload.error;
  return typeof message === "string" && message.trim() ? message : null;
}

export async function analyzeCase({
  caseId,
  inputHash,
  model,
}: {
  caseId: string;
  inputHash?: string;
  model?: string;
}): Promise<AnalyzeCaseResult> {
  const body: Record<string, unknown> = {};
  if (inputHash?.trim()) body.inputHash = inputHash.trim();
  if (model?.trim()) body.model = model.trim();

  const response = await fetch(
    `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/analyze`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const payload = await parseRawResponse(response);

  if (!response.ok) {
    throw new ApiError(getRawPayloadMessage(payload) ?? response.statusText, response.status, payload);
  }

  return {
    status: response.status,
    payload,
  };
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }

  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || null;
}

async function getDownloadErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return `Download failed with status ${response.status}.`;
  }

  try {
    const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = payload.message ?? payload.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Fall back to the response text below.
  }

  return text;
}

export async function downloadCaseAnalysisVersion({
  caseId,
  analysisId,
}: {
  caseId: string;
  analysisId: string;
}) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/cases/${encodeURIComponent(caseId)}/analysis/${encodeURIComponent(analysisId)}/download`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new ApiError(await getDownloadErrorMessage(response), response.status);
  }

  return {
    blob: await response.blob(),
    fileName: getFilenameFromDisposition(response.headers.get("content-disposition")),
  };
}

export function createUserCase(payload: CreateCaseInput) {
  return apiFetch<unknown>("/api/auth/user-cases", {
    method: "POST",
    body: payload,
  });
}

export type UploadUrlInput = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type UploadUrlResult = {
  uploadSessionId: string;
  presignedUrl: string;
  pathname: string;
};
export function normalizeUploadUrlResponse(response: unknown): UploadUrlResult {
  const payload = isRecord(response) && isRecord(response.data) ? response.data : response;

  if (!isRecord(payload)) {
    throw new Error("Upload URL response was not recognized.");
  }

  const uploadSessionId = readString(payload, [
    "uploadSessionId",
    "sessionId",
    "_id",
    "id",
  ]);

  const presignedUrl = readString(payload, [
    "presignedUrl",
    "uploadUrl",
    "signedUrl",
    "url",
  ]);

  const pathname = readString(payload, [
    "pathname",
    "path",
    "key",
    "blobName",
    "storageKey",
  ]);

  if (!uploadSessionId || !presignedUrl || !pathname) {
    throw new Error("Upload URL response is missing upload details.");
  }

  return {
    uploadSessionId,
    presignedUrl,
    pathname,
  };
}

export async function getUserCaseUploadUrl(payload: UploadUrlInput) {
  const response = await apiFetch<unknown>("/api/auth/user-cases/upload-url", {
    method: "POST",
    body: payload,
  });

  return normalizeUploadUrlResponse(response);
}

export async function uploadFileToPresignedUrl(
  file: File,
  presignedUrl: string,
): Promise<{ url: string } | null> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}.`);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function uploadCaseFile(file: File): Promise<CaseFileMetadata> {
  const upload = await getUserCaseUploadUrl({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  });

  const result = await uploadFileToPresignedUrl(file, upload.presignedUrl);

  return {
    uploadSessionId: upload.uploadSessionId,
    originalName: file.name,
    pathname: upload.pathname,
    url: result?.url,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}