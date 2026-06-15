import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TextField } from "../../../components/forms/TextField";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { formatDate } from "../../../lib/dates";
import { AdminPageAccess } from "../AdminPageAccess";
import {
  getOpenAiFinanceSettings,
  refreshOpenAiFinanceExchangeRate,
  updateOpenAiFinanceSettings,
} from "../openAiFinanceSettings.api";
import { useToast } from "../../../components/ui/toast-context";

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatZar(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return value.toFixed(2);
}

export function AdminFinancialSettingsPage() {
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState("");
  const [lowBudgetThresholdUsd, setLowBudgetThresholdUsd] = useState("");
  const [usdToZarExchangeRate, setUsdToZarExchangeRate] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["admin", "masterfiles", "openai-finance-settings"],
    queryFn: getOpenAiFinanceSettings,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setMonthlyBudgetUsd(
      settingsQuery.data.monthlyBudgetUsd === null
        ? ""
        : String(settingsQuery.data.monthlyBudgetUsd),
    );
    setLowBudgetThresholdUsd(
      settingsQuery.data.lowBudgetThresholdUsd === null
        ? ""
        : String(settingsQuery.data.lowBudgetThresholdUsd),
    );
    setUsdToZarExchangeRate(
      settingsQuery.data.usdToZarExchangeRate === null
        ? ""
        : String(settingsQuery.data.usdToZarExchangeRate),
    );
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const monthlyValue =
        monthlyBudgetUsd.trim() === "" ? null : Number(monthlyBudgetUsd);
      const thresholdValue =
        lowBudgetThresholdUsd.trim() === "" ? null : Number(lowBudgetThresholdUsd);
      const exchangeRateValue =
        usdToZarExchangeRate.trim() === "" ? null : Number(usdToZarExchangeRate);

      if (
        monthlyValue !== null &&
        thresholdValue !== null &&
        thresholdValue > monthlyValue
      ) {
        throw new Error(
          "Low-budget threshold cannot be greater than the monthly budget.",
        );
      }

      setSettingsError("");
      return updateOpenAiFinanceSettings({
        monthlyBudgetUsd: monthlyValue,
        lowBudgetThresholdUsd: thresholdValue,
        usdToZarExchangeRate: exchangeRateValue,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "masterfiles", "openai-finance-settings"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard", "finance"],
        }),
      ]);
      showToast({ tone: "success", title: "Financial settings updated." });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update financial settings.";
      setSettingsError(message);
      showToast({ tone: "error", title: message });
    },
  });

  const refreshExchangeRateMutation = useMutation({
    mutationFn: refreshOpenAiFinanceExchangeRate,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "masterfiles", "openai-finance-settings"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard", "finance"],
        }),
      ]);
      showToast({ tone: "success", title: "USD/ZAR exchange rate refreshed." });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to refresh the USD/ZAR exchange rate.";
      setSettingsError(message);
      showToast({ tone: "error", title: message });
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <AdminPageAccess>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16" />
          <LoadingSkeleton className="h-96" />
        </div>
      </AdminPageAccess>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Unable to load financial settings"
          message={
            settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "The financial settings could not be loaded."
          }
          onRetry={() => void settingsQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  const settings = settingsQuery.data;

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Financial Settings"
          description="Manage the OpenAI budget thresholds and the USD to ZAR exchange rate used across the finance dashboard."
        />

        <Card>
          <CardHeader>
            <CardTitle>OpenAI Cost Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsError ? <Alert tone="error">{settingsError}</Alert> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Monthly budget (USD)"
                type="number"
                min="0"
                step="0.01"
                value={monthlyBudgetUsd}
                onChange={(event) => setMonthlyBudgetUsd(event.target.value)}
              />
              <TextField
                label="Low-budget threshold (USD)"
                type="number"
                min="0"
                step="0.01"
                value={lowBudgetThresholdUsd}
                onChange={(event) => setLowBudgetThresholdUsd(event.target.value)}
              />
              <TextField
                label="USD to ZAR exchange rate"
                type="number"
                min="0"
                step="0.000001"
                value={usdToZarExchangeRate}
                onChange={(event) => setUsdToZarExchangeRate(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                isLoading={saveSettingsMutation.isPending}
                onClick={() => saveSettingsMutation.mutate()}
              >
                Save Financial Settings
              </Button>
              <Button
                type="button"
                variant="secondary"
                isLoading={refreshExchangeRateMutation.isPending}
                onClick={() => refreshExchangeRateMutation.mutate()}
              >
                Refresh Live USD/ZAR
              </Button>
              <Badge tone="outline">
                Source: {settings.source === "database" ? "Database" : "Fallback"}
              </Badge>
              <Badge tone="outline">Version: {settings.version}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Monthly budget
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-950">
                  {formatUsd(settings.monthlyBudgetUsd)}
                </p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Low-budget threshold
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-950">
                  {formatUsd(settings.lowBudgetThresholdUsd)}
                </p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Current USD/ZAR rate
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-950">
                  {formatRate(settings.usdToZarExchangeRate)}
                </p>
                <p className="mt-1 text-sm text-ink-600">
                  {formatZar(settings.usdToZarExchangeRate)}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs text-ink-500">
              <p>Settings updated: {formatDate(settings.updatedAt || null)}</p>
              <p>Exchange rate synced: {formatDate(settings.exchangeRateFetchedAt || null)}</p>
              <p>Next provider update: {formatDate(settings.exchangeRateNextUpdateAt || null)}</p>
              <p>
                Exchange provider: {settings.exchangeRateProvider || "manual"}
                {settings.exchangeRateDocumentationUrl ? (
                  <>
                    {" "}
                    via{" "}
                    <a
                      href={settings.exchangeRateDocumentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline"
                    >
                      ExchangeRate-API
                    </a>
                  </>
                ) : null}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageAccess>
  );
}
