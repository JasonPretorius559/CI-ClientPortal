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
  productLine?: "personal" | "commercial" | "sectional_title" | "other";
  workflowType?: "comparison" | "policy_analysis" | "record_of_advice" | "agm_pack" | "other";
  createdAt?: string;
  updatedAt?: string;
  intakeFields?: IntakeFieldDefinition[];
  [key: string]: unknown;
};

export type IntakeFieldType = "text" | "textarea" | "number" | "date" | "email" | "phone" | "select" | "boolean";

export type IntakeFieldDefinition = {
  key: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  options: string[];
  helpText: string;
  includeInAnalysis: boolean;
  includeInReport: boolean;
  min?: number;
  max?: number;
  pattern?: string;
};

const intakeFieldTypes: IntakeFieldType[] = ["text", "textarea", "number", "date", "email", "phone", "select", "boolean"];

function normalizeIntakeFields(value: unknown): IntakeFieldDefinition[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((field) => {
    if (!isRecord(field)) return [];
    const type = readString(field, ["type"]);
    if (!intakeFieldTypes.includes(type as IntakeFieldType)) return [];

    const options = Array.isArray(field.options)
      ? field.options.filter((option): option is string => typeof option === "string").map((option) => option.trim()).filter(Boolean)
      : [];

    return [{
      key: readString(field, ["key"]),
      label: readString(field, ["label"]),
      type: type as IntakeFieldType,
      required: readBoolean(field, ["required"], false),
      options,
      helpText: readString(field, ["helpText"]),
      includeInAnalysis: readBoolean(field, ["includeInAnalysis"], true),
      includeInReport: readBoolean(field, ["includeInReport"], true),
      min: typeof field.min === "number" ? field.min : undefined,
      max: typeof field.max === "number" ? field.max : undefined,
      pattern: readString(field, ["pattern"]) || undefined,
    }];
  });
}

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
    productLine: (readString(item, ["productLine"]) as AdminMasterfileRecord["productLine"]) || undefined,
    workflowType: (readString(item, ["workflowType"]) as AdminMasterfileRecord["workflowType"]) || undefined,
    intakeFields: normalizeIntakeFields(item.intakeFields),
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
