import { apiFetch } from "../../../lib/api";
import {
  normalizeStructuredOutputSchemaFields,
  normalizeStructuredOutputSchemas,
} from "./structuredOutputSchemas.utils";

const endpoint = "/api/admin/structured-output-schemas";

export async function listStructuredOutputSchemas() {
  const response = await apiFetch<unknown>(endpoint, { method: "GET" });
  return normalizeStructuredOutputSchemas(response);
}

export async function getStructuredOutputSchemaFields(schemaKey: string) {
  const response = await apiFetch<unknown>(`${endpoint}/by-key/${encodeURIComponent(schemaKey)}/fields`, { method: "GET" });
  return normalizeStructuredOutputSchemaFields(response);
}
