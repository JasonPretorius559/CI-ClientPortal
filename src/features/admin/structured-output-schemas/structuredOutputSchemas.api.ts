import { ApiError, apiFetch } from "../../../lib/api";
import type { SaveStructuredOutputSchemaInput } from "./structuredOutputSchemas.types";
import {
  getStructuredOutputSchemaId,
  normalizeStructuredOutputSchema,
  normalizeStructuredOutputSchemaFields,
  normalizeStructuredOutputSchemas,
} from "./structuredOutputSchemas.utils";

const endpoint = "/api/admin/structured-output-schemas";

export async function listStructuredOutputSchemas() {
  const response = await apiFetch<unknown>(endpoint, { method: "GET" });
  return normalizeStructuredOutputSchemas(response);
}

export async function getStructuredOutputSchema(id: string) {
  try {
    const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, { method: "GET" });
    return normalizeStructuredOutputSchema(response);
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 404)) throw error;
    const schemas = await listStructuredOutputSchemas();
    const match = schemas.find((schema) => getStructuredOutputSchemaId(schema) === id || schema.key === id);
    if (!match) throw error;
    return match;
  }
}

export async function createStructuredOutputSchema(payload: SaveStructuredOutputSchemaInput) {
  const response = await apiFetch<unknown>(endpoint, { method: "POST", body: payload });
  return normalizeStructuredOutputSchema(response);
}

export async function updateStructuredOutputSchema(id: string, payload: SaveStructuredOutputSchemaInput) {
  const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
  return normalizeStructuredOutputSchema(response);
}

export function deleteStructuredOutputSchema(id: string) {
  return apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function publishStructuredOutputSchema(id: string) {
  const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(id)}/publish`, { method: "POST" });
  return normalizeStructuredOutputSchema(response);
}

export async function getStructuredOutputSchemaFields(schemaKey: string) {
  try {
    const response = await apiFetch<unknown>(`${endpoint}/by-key/${encodeURIComponent(schemaKey)}/fields`, { method: "GET" });
    return normalizeStructuredOutputSchemaFields(response);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const response = await apiFetch<unknown>(`${endpoint}/${encodeURIComponent(schemaKey)}/fields`, { method: "GET" });
    return normalizeStructuredOutputSchemaFields(response);
  }
}
