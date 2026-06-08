import { API_BASE_URL, ApiError } from "../../lib/api";
import type { GenerateReportRequest, ReportDownloadResponse } from "./reports.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || null;
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

function getPayloadMessage(payload: unknown) {
  if (!isRecord(payload)) return null;
  const candidate = payload.message ?? payload.error;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

async function throwBlobError(response: Response) {
  const payload = await parseRawResponse(response);
  throw new ApiError(getPayloadMessage(payload) ?? `Request failed with status ${response.status}.`, response.status, payload);
}

export async function generateCaseReport({ caseId, analysisId }: GenerateReportRequest): Promise<ReportDownloadResponse> {
  const endpoint = analysisId
    ? `/api/cases/${encodeURIComponent(caseId)}/analysis/${encodeURIComponent(analysisId)}/reports/generate`
    : `/api/cases/${encodeURIComponent(caseId)}/reports/generate`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream,application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) await throwBlobError(response);

  return {
    blob: await response.blob(),
    fileName: getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "cloud-insure-report.docx",
  };
}
