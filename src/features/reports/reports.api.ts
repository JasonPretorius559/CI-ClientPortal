import { API_BASE_URL, ApiError, apiFetch } from "../../lib/api";
import { createDefaultReportTemplate } from "./reportTemplate.defaults";
import { reportTemplateSchema, type GenerateReportRequest, type ReportAsset, type ReportTemplate } from "./reports.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readArray(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      for (const nestedKey of keys) {
        const nested = value[nestedKey];
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  return [];
}

function templatePayload(payload: unknown) {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  if (isRecord(data) && isRecord(data.template)) return data.template;
  return data;
}

function hydrateTemplate(payload: unknown): ReportTemplate {
  const defaults = createDefaultReportTemplate();
  const data = templatePayload(payload);
  if (!isRecord(data)) return defaults;

  const page = isRecord(data.page) ? data.page : {};
  const theme = isRecord(data.theme) ? data.theme : {};
  const coverPage = isRecord(data.coverPage) ? data.coverPage : {};

  return {
    ...defaults,
    ...data,
    name: typeof data.name === "string" && data.name.trim() ? data.name : defaults.name,
    isDefault: typeof data.isDefault === "boolean" ? data.isDefault : defaults.isDefault,
    version: typeof data.version === "number" ? data.version : defaults.version,
    page: {
      ...defaults.page,
      ...page,
    },
    theme: {
      ...defaults.theme,
      ...theme,
    },
    coverPage: {
      ...defaults.coverPage,
      ...coverPage,
      elements: Array.isArray(coverPage.elements) ? coverPage.elements : defaults.coverPage.elements,
    },
    sections: Array.isArray(data.sections) ? data.sections : defaults.sections,
    assets: Array.isArray(data.assets) ? data.assets as ReportAsset[] : defaults.assets,
  };
}

function normalizeTemplate(payload: unknown): ReportTemplate {
  return reportTemplateSchema.parse(hydrateTemplate(payload));
}

function normalizeTemplates(payload: unknown): ReportTemplate[] {
  return readArray(payload, ["templates", "reportTemplates", "items", "data"]).map(normalizeTemplate);
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read this image file."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read this image file."));
    reader.readAsDataURL(file);
  });
}

export async function getReportTemplates() {
  const response = await apiFetch<unknown>("/api/report-templates", { method: "GET" });
  return normalizeTemplates(response);
}

export async function getReportTemplate(templateId: string) {
  const response = await apiFetch<unknown>(`/api/report-templates/${encodeURIComponent(templateId)}`, { method: "GET" });
  return normalizeTemplate(response);
}

export async function createReportTemplate(template: ReportTemplate) {
  const response = await apiFetch<unknown>("/api/report-templates", {
    method: "POST",
    body: reportTemplateSchema.parse(template),
  });
  return normalizeTemplate(response);
}

export async function updateReportTemplate(templateId: string, template: ReportTemplate) {
  const response = await apiFetch<unknown>(`/api/report-templates/${encodeURIComponent(templateId)}`, {
    method: "PUT",
    body: reportTemplateSchema.parse(template),
  });
  return normalizeTemplate(response);
}

export function deleteReportTemplate(templateId: string) {
  return apiFetch<unknown>(`/api/report-templates/${encodeURIComponent(templateId)}`, { method: "DELETE" });
}

export async function uploadReportAsset(file: File, templateId?: string) {
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1] ?? "";
  const body = {
    templateId,
    name: file.name,
    fileName: file.name,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    contentType: file.type || "application/octet-stream",
    size: file.size,
    base64,
    data: base64,
    dataUrl,
  };

  const response = await fetch(`${API_BASE_URL}/api/report-templates/assets`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) await throwBlobError(response);
  const payload = await response.json() as unknown;
  return (isRecord(payload) && isRecord(payload.data) ? payload.data : payload) as ReportAsset;
}

export function deleteReportAsset(assetId: string) {
  return apiFetch<unknown>(`/api/report-templates/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
}

export function getCaseReportData(caseId: string, analysisId?: string) {
  const params = new URLSearchParams();
  if (analysisId) params.set("analysisId", analysisId);
  const query = params.toString();
  return apiFetch<unknown>(`/api/cases/${encodeURIComponent(caseId)}/report-data${query ? `?${query}` : ""}`, { method: "GET" });
}

export type PreviewCaseReportInput = {
  caseId: string;
  analysisId?: string;
  templateId?: string;
  template?: ReportTemplate;
};

export function previewCaseReport({ caseId, analysisId, templateId, template }: PreviewCaseReportInput) {
  const endpoint = analysisId
    ? `/api/cases/${encodeURIComponent(caseId)}/analysis/${encodeURIComponent(analysisId)}/reports/preview`
    : `/api/cases/${encodeURIComponent(caseId)}/reports/preview`;

  return apiFetch<unknown>(endpoint, {
    method: "POST",
    body: { templateId, template },
  });
}

export async function generateCaseReport({ caseId, analysisId, templateId, template, format }: GenerateReportRequest) {
  const endpoint = analysisId
    ? `/api/cases/${encodeURIComponent(caseId)}/analysis/${encodeURIComponent(analysisId)}/reports/generate`
    : `/api/cases/${encodeURIComponent(caseId)}/reports/generate`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream,application/json",
    },
    body: JSON.stringify({ templateId, template, format }),
  });

  if (!response.ok) await throwBlobError(response);

  return {
    blob: await response.blob(),
    fileName: getFilenameFromDisposition(response.headers.get("content-disposition")) ?? `cloud-insure-report.${format}`,
  };
}

export function getReportAssetUrl(assetId: string) {
  return `${API_BASE_URL}/api/report-templates/assets/${encodeURIComponent(assetId)}`;
}
