import { apiFetch } from "../../lib/api";
import { getRecordId, readObjectFromPayload, readString } from "./adminPayload.utils";

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export type OpenAiFinanceSettings = {
  monthlyBudgetUsd: number | null;
  lowBudgetThresholdUsd: number | null;
  usdToZarExchangeRate: number | null;
  exchangeRateProvider: string | null;
  exchangeRateDocumentationUrl?: string;
  exchangeRateBaseCode: string;
  exchangeRateTargetCode: string;
  exchangeRateFetchedAt?: string;
  exchangeRateNextUpdateAt?: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  source: "database" | "fallback";
};

function normalizeSettings(payload: unknown): OpenAiFinanceSettings {
  const item = readObjectFromPayload(payload, ["settings", "record", "item", "data"]);

  return {
    monthlyBudgetUsd: readNumber(item.monthlyBudgetUsd),
    lowBudgetThresholdUsd: readNumber(item.lowBudgetThresholdUsd),
    usdToZarExchangeRate: readNumber(item.usdToZarExchangeRate),
    exchangeRateProvider: readString(item, ["exchangeRateProvider"]) || null,
    exchangeRateDocumentationUrl:
      readString(item, ["exchangeRateDocumentationUrl"]) || undefined,
    exchangeRateBaseCode: readString(item, ["exchangeRateBaseCode"]) || "USD",
    exchangeRateTargetCode: readString(item, ["exchangeRateTargetCode"]) || "ZAR",
    exchangeRateFetchedAt: readString(item, ["exchangeRateFetchedAt"]) || undefined,
    exchangeRateNextUpdateAt:
      readString(item, ["exchangeRateNextUpdateAt"]) || undefined,
    version: typeof item.version === "number" ? item.version : Number(item.version ?? 0) || 0,
    updatedAt: readString(item, ["updatedAt"]) || undefined,
    updatedBy: readString(item, ["updatedBy"]) || getRecordId(item.updatedBy) || undefined,
    source: item.source === "database" ? "database" : "fallback",
  };
}

export async function getOpenAiFinanceSettings() {
  const response = await apiFetch<unknown>("/api/admin/masterfiles/openai-finance-settings", {
    method: "GET",
  });

  return normalizeSettings(response);
}

export async function updateOpenAiFinanceSettings(input: {
  monthlyBudgetUsd: number | null;
  lowBudgetThresholdUsd: number | null;
  usdToZarExchangeRate: number | null;
}) {
  const response = await apiFetch<unknown>("/api/admin/masterfiles/openai-finance-settings", {
    method: "PUT",
    body: input,
  });

  return normalizeSettings(response);
}

export async function refreshOpenAiFinanceExchangeRate() {
  const response = await apiFetch<unknown>(
    "/api/admin/masterfiles/openai-finance-settings/refresh-exchange-rate",
    {
      method: "POST",
    },
  );

  return normalizeSettings(response);
}
