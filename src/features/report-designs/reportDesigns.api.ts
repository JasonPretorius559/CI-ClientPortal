import { API_BASE_URL, ApiError, apiFetch } from "../../lib/api";
import type { ReportDesignGenerateResult, ReportDesignRunInput, SaveReportDesignInput } from "./reportDesigns.types";
import {
  normalizeReportDesign,
  normalizeReportDesigns,
  normalizeReportDataSourceFields,
  normalizeReportDataSources,
  normalizeStructuredOutputSchemaFields,
  normalizeStructuredOutputSchemas,
} from "./reportDesigns.utils";

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ""));

  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || null;
}

async function parseRawResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const message = (payload as { message?: unknown; error?: unknown }).message ?? (payload as { message?: unknown; error?: unknown }).error;
  return typeof message === "string" && message.trim() ? message : null;
}

async function throwFetchError(response: Response) {
  const payload = await parseRawResponse(response);
  throw new ApiError(readPayloadMessage(payload) ?? `Request failed with status ${response.status}.`, response.status, payload);
}

export async function getStructuredOutputSchemas() {
  const response = await apiFetch<unknown>("/api/admin/structured-output-schemas", { method: "GET" });
  return normalizeStructuredOutputSchemas(response);
}

export async function getReportDataSources() {
  const response = await apiFetch<unknown>("/api/admin/report-data-sources", { method: "GET" });
  return normalizeReportDataSources(response);
}

export async function getReportDataSourceFields(sourceKey: string, schemaKey?: string) {
  const params = new URLSearchParams();
  if (schemaKey?.trim()) params.set("schemaKey", schemaKey.trim());
  const query = params.toString();
  const response = await apiFetch<unknown>(`/api/admin/report-data-sources/${encodeURIComponent(sourceKey)}/fields${query ? `?${query}` : ""}`, { method: "GET" });
  return normalizeReportDataSourceFields(response, sourceKey);
}

export async function getStructuredOutputSchemaFields(schemaKey: string) {
  const response = await apiFetch<unknown>(`/api/admin/structured-output-schemas/${encodeURIComponent(schemaKey)}/fields`, { method: "GET" });
  return normalizeStructuredOutputSchemaFields(response);
}

export async function getReportDesigns(schemaKey?: string) {
  const params = new URLSearchParams();
  if (schemaKey?.trim()) params.set("schemaKey", schemaKey.trim());

  const response = await apiFetch<unknown>(`/api/admin/report-designs${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
  });
  return normalizeReportDesigns(response);
}

export async function getReportDesign(reportDesignId: string) {
  const response = await apiFetch<unknown>(`/api/admin/report-designs/${encodeURIComponent(reportDesignId)}`, {
    method: "GET",
  });
  return normalizeReportDesign(response);
}

export async function createReportDesign(payload: SaveReportDesignInput) {
  const response = await apiFetch<unknown>("/api/admin/report-designs", {
    method: "POST",
    body: payload,
  });
  return normalizeReportDesign(response);
}

export async function updateReportDesign(reportDesignId: string, payload: SaveReportDesignInput) {
  const response = await apiFetch<unknown>(`/api/admin/report-designs/${encodeURIComponent(reportDesignId)}`, {
    method: "PUT",
    body: payload,
  });
  return normalizeReportDesign(response);
}

export function deleteReportDesign(reportDesignId: string) {
  return apiFetch<unknown>(`/api/admin/report-designs/${encodeURIComponent(reportDesignId)}`, {
    method: "DELETE",
  });
}

export function previewReportDesign(reportDesignId: string, payload: ReportDesignRunInput) {
  return apiFetch<unknown>(`/api/admin/report-designs/${encodeURIComponent(reportDesignId)}/preview`, {
    method: "POST",
    body: payload,
  });
}

export async function generateReportDesign(reportDesignId: string, payload: ReportDesignRunInput): Promise<ReportDesignGenerateResult> {
  const response = await fetch(`${API_BASE_URL}/api/admin/report-designs/${encodeURIComponent(reportDesignId)}/generate`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json,application/pdf,application/octet-stream,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwFetchError(response);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return {
      kind: "json",
      payload: await response.json() as unknown,
    };
  }

  return {
    kind: "file",
    blob: await response.blob(),
    fileName: getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "cloud-insure-report",
    contentType,
  };
}
