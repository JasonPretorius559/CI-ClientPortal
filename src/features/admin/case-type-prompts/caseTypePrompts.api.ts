import { apiFetch } from "../../../lib/api";
import { getRecordId, isRecord, readArrayFromPayload, readBoolean, readNumber, readObjectFromPayload, readString } from "../adminPayload.utils";
import type { CaseTypePrompt, SaveCaseTypePromptInput } from "./caseTypePrompts.types";

const endpoint = "/api/admin/case-type-prompts";

function normalizeCaseTypePrompt(payload: unknown): CaseTypePrompt {
  const item = readObjectFromPayload(payload, ["prompt", "caseTypePrompt", "record", "item", "data"]);
  const caseType = isRecord(item.caseType) ? item.caseType : null;
  const linkedCaseType = isRecord(item.linkedCaseType) ? item.linkedCaseType : null;

  return {
    ...item,
    id: readString(item, ["id"]) || getRecordId(item) || undefined,
    _id: readString(item, ["_id"]) || undefined,
    caseType: caseType ? getRecordId(caseType) : readString(item, ["caseType", "caseTypeId"]),
    caseTypeName: caseType ? readString(caseType, ["name", "label", "title"]) : readString(item, ["caseTypeName"]) || undefined,
    linkedCaseType: linkedCaseType ? getRecordId(linkedCaseType) : readString(item, ["linkedCaseType", "linkedCaseTypeId"]) || null,
    linkedCaseTypeName: linkedCaseType ? readString(linkedCaseType, ["name", "label", "title"]) : readString(item, ["linkedCaseTypeName"]) || undefined,
    prompt: readString(item, ["prompt", "text", "content"]),
    isActive: readBoolean(item, ["isActive", "active"], true),
    version: readNumber(item, ["version"]) ?? 1,
    createdAt: readString(item, ["createdAt"]) || undefined,
    updatedAt: readString(item, ["updatedAt"]) || undefined,
  };
}

function normalizeCaseTypePrompts(payload: unknown) {
  return readArrayFromPayload(payload, ["prompts", "caseTypePrompts", "items", "records", "data"])
    .map(normalizeCaseTypePrompt)
    .filter((item) => item.id || item._id)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function getCaseTypePromptId(prompt: Pick<CaseTypePrompt, "id" | "_id">) {
  return prompt.id ?? prompt._id ?? "";
}

export async function listCaseTypePrompts() {
  const response = await apiFetch<unknown>(endpoint, { method: "GET" });
  return normalizeCaseTypePrompts(response);
}

export async function getCaseTypePrompt(id: string) {
  const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, { method: "GET" });
  return normalizeCaseTypePrompt(response);
}

export async function createCaseTypePrompt(payload: SaveCaseTypePromptInput) {
  const response = await apiFetch<unknown>(endpoint, { method: "POST", body: payload });
  return normalizeCaseTypePrompt(response);
}

export async function updateCaseTypePrompt(id: string, payload: SaveCaseTypePromptInput) {
  const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: {
      prompt: payload.prompt,
      isActive: payload.isActive,
    },
  });
  return normalizeCaseTypePrompt(response);
}

export function deleteCaseTypePrompt(id: string) {
  return apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
