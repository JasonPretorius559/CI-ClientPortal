import { apiFetch } from "../../lib/api";
import { getRecordId, isRecord, readArrayFromPayload, readBoolean, readObjectFromPayload, readString } from "./adminPayload.utils";
import type { AdminMasterfileConfig } from "./adminMasterfile.config";

export type AdminMasterfileRecord = {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  caseType?: string;
  caseTypeName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

function normalizeRecord(item: unknown): AdminMasterfileRecord | null {
  if (!isRecord(item)) return null;
  const id = getRecordId(item);
  const name = readString(item, ["name", "label", "title"]);
  if (!id && !name) return null;

  const caseType = item.caseType;
  const caseTypeRecord = isRecord(caseType) ? caseType : null;

  return {
    ...item,
    id: readString(item, ["id"]) || id || undefined,
    _id: readString(item, ["_id"]) || undefined,
    name,
    description: readString(item, ["description", "summary"]) || undefined,
    isActive: readBoolean(item, ["isActive", "active"], true),
    caseType: caseTypeRecord ? getRecordId(caseTypeRecord) : readString(item, ["caseType", "caseTypeId"]) || undefined,
    caseTypeName: caseTypeRecord ? readString(caseTypeRecord, ["name", "label", "title"]) : readString(item, ["caseTypeName"]) || undefined,
    createdAt: readString(item, ["createdAt"]) || undefined,
    updatedAt: readString(item, ["updatedAt"]) || undefined,
  };
}

function normalizeList(payload: unknown, config: AdminMasterfileConfig): AdminMasterfileRecord[] {
  return readArrayFromPayload(payload, config.listKeys)
    .map(normalizeRecord)
    .filter((item): item is AdminMasterfileRecord => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeObject(payload: unknown, config: AdminMasterfileConfig) {
  const record = normalizeRecord(readObjectFromPayload(payload, config.objectKeys));
  if (record) return record;
  return { name: "" };
}

export async function listAdminMasterfileRecords(config: AdminMasterfileConfig): Promise<AdminMasterfileRecord[]> {
  const response = await apiFetch<unknown>(config.endpoint, { method: "GET" });
  return normalizeList(response, config);
}

export async function getAdminMasterfileRecord(config: AdminMasterfileConfig, id: string): Promise<AdminMasterfileRecord> {
  const response = await apiFetch<unknown>(`${config.endpoint}/${encodeURIComponent(id)}`, { method: "GET" });
  return normalizeObject(response, config);
}

export async function createAdminMasterfileRecord(
  config: AdminMasterfileConfig,
  payload: Record<string, unknown>,
): Promise<AdminMasterfileRecord> {
  const response = await apiFetch<unknown>(config.endpoint, { method: "POST", body: payload });
  return normalizeObject(response, config);
}

export async function updateAdminMasterfileRecord(
  config: AdminMasterfileConfig,
  id: string,
  payload: Record<string, unknown>,
): Promise<AdminMasterfileRecord> {
  const response = await apiFetch<unknown>(`${config.endpoint}/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
  return normalizeObject(response, config);
}

export async function archiveAdminMasterfileRecord(config: AdminMasterfileConfig, id: string): Promise<unknown> {
  return apiFetch<unknown>(`${config.endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
