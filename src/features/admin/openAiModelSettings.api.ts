import { apiFetch } from "../../lib/api";
import { getRecordId, readArrayFromPayload, readObjectFromPayload, readString } from "./adminPayload.utils";

export type OpenAiModelSettings = {
  selectedModel: string;
  allowedModels: string[];
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  source: "database" | "fallback";
};

function normalizeSettings(payload: unknown): OpenAiModelSettings {
  const item = readObjectFromPayload(payload, ["settings", "record", "item", "data"]);

  const selectedModel = readString(item, ["selectedModel"]);
  const allowedModels = readArrayFromPayload(item, ["allowedModels"])
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return {
    selectedModel,
    allowedModels,
    version: typeof item.version === "number" ? item.version : Number(item.version ?? 0) || 0,
    updatedAt: readString(item, ["updatedAt"]) || undefined,
    updatedBy: readString(item, ["updatedBy"]) || getRecordId(item.updatedBy) || undefined,
    source: item.source === "database" ? "database" : "fallback",
  };
}

export async function getOpenAiModelSettings() {
  const response = await apiFetch<unknown>("/api/admin/masterfiles/openai-model-settings", {
    method: "GET",
  });

  return normalizeSettings(response);
}

export async function updateOpenAiModelSettings(input: {
  selectedModel: string;
  allowedModels: string[];
}) {
  const response = await apiFetch<unknown>("/api/admin/masterfiles/openai-model-settings", {
    method: "PUT",
    body: input,
  });

  return normalizeSettings(response);
}
