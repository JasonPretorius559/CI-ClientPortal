import { getRecordId, isRecord, readArrayFromPayload, readBoolean, readNumber, readObjectFromPayload, readString } from "../adminPayload.utils";
import type { StructuredOutputSchema, StructuredOutputSchemaField, StructuredOutputSchemaStatus } from "./structuredOutputSchemas.types";

function readStatus(value: unknown): StructuredOutputSchemaStatus {
  const status = readString(value, ["status", "state"]).toLowerCase();
  if (status === "draft" || status === "published" || status === "archived") return status;
  if (isRecord(value) && value.isArchived === true) return "archived";
  if (isRecord(value) && value.publishedAt) return "published";
  return "draft";
}

function normalizeField(item: unknown): StructuredOutputSchemaField | null {
  if (!isRecord(item)) return null;
  const path = readString(item, ["path", "fieldPath", "fullPath", "key", "name"]);
  if (!path) return null;

  return {
    path,
    label: readString(item, ["label", "displayName", "title", "name", "key"]) || path,
    type: readString(item, ["type", "fieldType", "valueType", "dataType"]) || "string",
    array: readBoolean(item, ["array", "isArray"], false),
    required: readBoolean(item, ["required", "isRequired"], false),
    description: readString(item, ["description", "helpText", "summary"]) || undefined,
  };
}

function normalizeFieldsFromPayload(payload: unknown): StructuredOutputSchemaField[] {
  return readArrayFromPayload(payload, ["fields", "items", "data"])
    .map(normalizeField)
    .filter((item): item is StructuredOutputSchemaField => Boolean(item))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function normalizeStructuredOutputSchema(payload: unknown): StructuredOutputSchema {
  const container = readObjectFromPayload(payload, ["schema", "structuredOutputSchema", "record", "item", "data"]);
  const id = getRecordId(container);
  const caseType = isRecord(container.caseType) ? container.caseType : null;
  const linkedCaseType = isRecord(container.linkedCaseType) ? container.linkedCaseType : null;
  const key = readString(container, ["key", "schemaKey", "name", "id", "_id"]) || id;
  const version = readNumber(container, ["version", "schemaVersion"]) ?? 1;
  const fields = normalizeFieldsFromPayload(container);

  return {
    ...container,
    id: readString(container, ["id"]) || id || undefined,
    _id: readString(container, ["_id"]) || undefined,
    name: readString(container, ["name", "label", "title", "schemaName"]) || key || "Untitled schema",
    key,
    description: readString(container, ["description", "summary"]) || undefined,
    version,
    caseType: caseType ? getRecordId(caseType) : readString(container, ["caseType", "caseTypeId"]) || undefined,
    linkedCaseType: linkedCaseType ? getRecordId(linkedCaseType) : readString(container, ["linkedCaseType", "linkedCaseTypeId"]) || undefined,
    caseTypeName: caseType ? readString(caseType, ["name", "label", "title"]) : readString(container, ["caseTypeName"]) || undefined,
    linkedCaseTypeName: linkedCaseType ? readString(linkedCaseType, ["name", "label", "title"]) : readString(container, ["linkedCaseTypeName"]) || undefined,
    caseTypeNameSnapshot: readString(container, ["caseTypeNameSnapshot"]) || undefined,
    linkedCaseTypeNameSnapshot: readString(container, ["linkedCaseTypeNameSnapshot"]) || undefined,
    status: readStatus(container),
    isActive: readBoolean(container, ["isActive", "active"], true),
    source: "admin",
    jsonSchema: isRecord(container.jsonSchema) ? container.jsonSchema : isRecord(container.schema) ? container.schema : undefined,
    fields,
    tree: readArrayFromPayload(container, ["tree", "fieldTree"]),
    systemPromptHint: readString(container, ["systemPromptHint"]) || undefined,
    userPromptHint: readString(container, ["userPromptHint"]) || undefined,
    createdAt: readString(container, ["createdAt"]) || undefined,
    updatedAt: readString(container, ["updatedAt"]) || undefined,
    publishedAt: readString(container, ["publishedAt"]) || undefined,
  };
}

export function normalizeStructuredOutputSchemas(payload: unknown): StructuredOutputSchema[] {
  return readArrayFromPayload(payload, ["schemas", "structuredOutputSchemas", "items", "records", "data"])
    .map(normalizeStructuredOutputSchema)
    .filter((item) => item.key)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeStructuredOutputSchemaFields(payload: unknown) {
  return normalizeFieldsFromPayload(readObjectFromPayload(payload, ["schema", "data", "record", "item"]));
}

export function getStructuredOutputSchemaId(schema: Pick<StructuredOutputSchema, "id" | "_id" | "key">) {
  return schema.id ?? schema._id ?? schema.key;
}

export function isObjectIdString(value: string | undefined) {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value));
}

export function getStructuredOutputSchemaDatabaseId(schema: Pick<StructuredOutputSchema, "id" | "_id">) {
  if (isObjectIdString(schema.id)) return schema.id ?? "";
  if (isObjectIdString(schema._id)) return schema._id ?? "";
  return "";
}

export function stringifyJsonSchema(value: unknown) {
  return JSON.stringify(value && isRecord(value) ? value : starterJsonSchema, null, 2);
}

export const starterJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["analysisStatus"],
  properties: {
    analysisStatus: {
      type: "string",
      enum: ["completed", "completed_with_warnings", "needs_more_information", "unable_to_analyse"],
      description: "Overall analysis status",
    },
  },
};
