import { apiFetch } from "../../lib/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readString(record: unknown, keys: string[]) {
  if (!isRecord(record)) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readArray(record: unknown, keys: string[]) {
  if (!isRecord(record)) return [];
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function dataRecord(payload: unknown) {
  if (isRecord(payload) && isRecord(payload.data)) return payload.data;
  return isRecord(payload) ? payload : {};
}

export type AdminFinanceResponse = {
  officialCostData: {
    adminApiConfigured: boolean;
    liveBalanceSupported: boolean;
    liveBalanceMessage: string;
    monthToDate: {
      available: boolean;
      currency: string;
      totalCostUsd: number | null;
      totalCostZar?: number | null;
      dailyCosts: Array<{ date: string; costUsd: number }>;
    };
    trailingWindow: {
      available: boolean;
      currency: string;
      totalCostUsd: number | null;
      totalCostZar?: number | null;
      dailyCosts: Array<{ date: string; costUsd: number }>;
    };
  };
  budget: {
    monthlyBudgetUsd: number | null;
    lowBudgetThresholdUsd: number | null;
    monthlyBudgetZar?: number | null;
    lowBudgetThresholdZar?: number | null;
    remainingBudgetUsd: number | null;
    remainingBudgetZar?: number | null;
    usdToZarExchangeRate?: number | null;
    exchangeRateProvider?: string | null;
    exchangeRateDocumentationUrl?: string | null;
    exchangeRateBaseCode?: string | null;
    exchangeRateTargetCode?: string | null;
    exchangeRateFetchedAt?: string | null;
    exchangeRateNextUpdateAt?: string | null;
    status: string;
    settingsSource?: string;
    version?: number;
    updatedAt?: string | null;
    alert: null | {
      level: string;
      title: string;
      message: string;
    };
  };
  caseEstimates: {
    pricingSource: string;
    pricingCoverageModels: string[];
    totalEstimatedCaseCostUsd: number;
    totalEstimatedCaseCostZar?: number | null;
    pricedAnalysesCount: number;
    unpricedAnalysesCount: number;
    totalCases: number;
    topCostCases: Array<{
      caseId: string;
      caseTitle: string;
      caseReferenceNumber: string | number | null;
      caseStatus: string | null;
      analysesCount: number;
      pricedAnalysesCount: number;
      unpricedAnalysesCount: number;
      totalTokens: number;
      totalEstimatedCostUsd: number;
      totalEstimatedCostZar?: number | null;
      latestModel: string | null;
      lastAnalysedAt: string | null;
    }>;
    recentAnalyses: Array<{
      analysisId: string;
      caseId: string;
      caseTitle: string;
      caseReferenceNumber: string | number | null;
      caseStatus: string | null;
      analysisStatus: string;
      analysisJobId: string | null;
      versionNumber: number | null;
      model: string | null;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCostUsd: number | null;
      estimatedCostZar?: number | null;
      createdAt: string | null;
      completedAt: string | null;
    }>;
  };
};

function normalizeCostBucket(record: unknown) {
  return {
    date: readString(record, ["date"]),
    costUsd: readNumber(isRecord(record) ? record.costUsd : null) ?? 0,
  };
}

export async function getAdminFinance(days = 30): Promise<AdminFinanceResponse> {
  const response = await apiFetch<unknown>(`/api/admin/dashboard/finance?days=${encodeURIComponent(String(days))}`, {
    method: "GET",
  });

  const data = dataRecord(response);
  const officialCostData = isRecord(data.officialCostData) ? data.officialCostData : {};
  const budget = isRecord(data.budget) ? data.budget : {};
  const caseEstimates = isRecord(data.caseEstimates) ? data.caseEstimates : {};
  const monthToDate = isRecord(officialCostData.monthToDate) ? officialCostData.monthToDate : {};
  const trailingWindow = isRecord(officialCostData.trailingWindow) ? officialCostData.trailingWindow : {};
  const alert = isRecord(budget.alert) ? budget.alert : null;

  return {
    officialCostData: {
      adminApiConfigured: officialCostData.adminApiConfigured === true,
      liveBalanceSupported: officialCostData.liveBalanceSupported === true,
      liveBalanceMessage: readString(officialCostData, ["liveBalanceMessage"]),
      monthToDate: {
        available: monthToDate.available === true,
        currency: readString(monthToDate, ["currency"]) || "usd",
        totalCostUsd: readNumber(monthToDate.totalCostUsd),
        totalCostZar: readNumber(monthToDate.totalCostZar),
        dailyCosts: readArray(monthToDate, ["dailyCosts"]).map(normalizeCostBucket),
      },
      trailingWindow: {
        available: trailingWindow.available === true,
        currency: readString(trailingWindow, ["currency"]) || "usd",
        totalCostUsd: readNumber(trailingWindow.totalCostUsd),
        totalCostZar: readNumber(trailingWindow.totalCostZar),
        dailyCosts: readArray(trailingWindow, ["dailyCosts"]).map(normalizeCostBucket),
      },
    },
    budget: {
      monthlyBudgetUsd: readNumber(budget.monthlyBudgetUsd),
      lowBudgetThresholdUsd: readNumber(budget.lowBudgetThresholdUsd),
      monthlyBudgetZar: readNumber(budget.monthlyBudgetZar),
      lowBudgetThresholdZar: readNumber(budget.lowBudgetThresholdZar),
      remainingBudgetUsd: readNumber(budget.remainingBudgetUsd),
      remainingBudgetZar: readNumber(budget.remainingBudgetZar),
      usdToZarExchangeRate: readNumber(budget.usdToZarExchangeRate),
      exchangeRateProvider: readString(budget, ["exchangeRateProvider"]) || null,
      exchangeRateDocumentationUrl:
        readString(budget, ["exchangeRateDocumentationUrl"]) || null,
      exchangeRateBaseCode: readString(budget, ["exchangeRateBaseCode"]) || null,
      exchangeRateTargetCode: readString(budget, ["exchangeRateTargetCode"]) || null,
      exchangeRateFetchedAt: readString(budget, ["exchangeRateFetchedAt"]) || null,
      exchangeRateNextUpdateAt: readString(budget, ["exchangeRateNextUpdateAt"]) || null,
      status: readString(budget, ["status"]) || "unavailable",
      settingsSource: readString(budget, ["settingsSource"]) || undefined,
      version: readNumber(budget.version) ?? undefined,
      updatedAt: readString(budget, ["updatedAt"]) || null,
      alert: alert
        ? {
            level: readString(alert, ["level"]) || "info",
            title: readString(alert, ["title"]) || "Budget alert",
            message: readString(alert, ["message"]),
          }
        : null,
    },
    caseEstimates: {
      pricingSource: readString(caseEstimates, ["pricingSource"]),
      pricingCoverageModels: readArray(caseEstimates, ["pricingCoverageModels"]).filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      ),
      totalEstimatedCaseCostUsd: readNumber(caseEstimates.totalEstimatedCaseCostUsd) ?? 0,
      totalEstimatedCaseCostZar: readNumber(caseEstimates.totalEstimatedCaseCostZar),
      pricedAnalysesCount: readNumber(caseEstimates.pricedAnalysesCount) ?? 0,
      unpricedAnalysesCount: readNumber(caseEstimates.unpricedAnalysesCount) ?? 0,
      totalCases: readNumber(caseEstimates.totalCases) ?? 0,
      topCostCases: readArray(caseEstimates, ["topCostCases"]).map((item) => ({
        caseId: readString(item, ["caseId"]),
        caseTitle: readString(item, ["caseTitle"]),
        caseReferenceNumber: readString(item, ["caseReferenceNumber"]) || null,
        caseStatus: readString(item, ["caseStatus"]) || null,
        analysesCount: readNumber(isRecord(item) ? item.analysesCount : null) ?? 0,
        pricedAnalysesCount: readNumber(isRecord(item) ? item.pricedAnalysesCount : null) ?? 0,
        unpricedAnalysesCount: readNumber(isRecord(item) ? item.unpricedAnalysesCount : null) ?? 0,
        totalTokens: readNumber(isRecord(item) ? item.totalTokens : null) ?? 0,
        totalEstimatedCostUsd: readNumber(isRecord(item) ? item.totalEstimatedCostUsd : null) ?? 0,
        totalEstimatedCostZar: readNumber(isRecord(item) ? item.totalEstimatedCostZar : null),
        latestModel: readString(item, ["latestModel"]) || null,
        lastAnalysedAt: readString(item, ["lastAnalysedAt"]) || null,
      })),
      recentAnalyses: readArray(caseEstimates, ["recentAnalyses"]).map((item) => ({
        analysisId: readString(item, ["analysisId"]),
        caseId: readString(item, ["caseId"]),
        caseTitle: readString(item, ["caseTitle"]),
        caseReferenceNumber: readString(item, ["caseReferenceNumber"]) || null,
        caseStatus: readString(item, ["caseStatus"]) || null,
        analysisStatus: readString(item, ["analysisStatus"]),
        analysisJobId: readString(item, ["analysisJobId"]) || null,
        versionNumber: readNumber(isRecord(item) ? item.versionNumber : null),
        model: readString(item, ["model"]) || null,
        promptTokens: readNumber(isRecord(item) ? item.promptTokens : null) ?? 0,
        completionTokens: readNumber(isRecord(item) ? item.completionTokens : null) ?? 0,
        totalTokens: readNumber(isRecord(item) ? item.totalTokens : null) ?? 0,
        estimatedCostUsd: readNumber(isRecord(item) ? item.estimatedCostUsd : null),
        estimatedCostZar: readNumber(isRecord(item) ? item.estimatedCostZar : null),
        createdAt: readString(item, ["createdAt"]) || null,
        completedAt: readString(item, ["completedAt"]) || null,
      })),
    },
  };
}
