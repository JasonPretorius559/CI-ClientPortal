import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, DollarSign, Wallet, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { SelectField } from "../../../components/forms/SelectField";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { formatDate } from "../../../lib/dates";
import { AdminPageAccess } from "../AdminPageAccess";
import { getAdminFinance } from "../adminFinance.api";

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

function formatCurrencyPair(usd: number | null, zar?: number | null) {
  const zarValue = typeof zar === "number" ? zar : null;
  return `${formatUsd(usd)} / ${formatZar(zarValue)}`;
}

function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return value.toFixed(2);
}

function formatInteger(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function statusTone(status: string) {
  if (status === "critical") return "solid" as const;
  if (status === "warning") return "dashed" as const;
  return "outline" as const;
}

export function AdminFinancePage() {
  const [days, setDays] = useState("30");

  const financeQuery = useQuery({
    queryKey: ["admin", "dashboard", "finance", days],
    queryFn: () => getAdminFinance(Number(days)),
  });

  if (financeQuery.isLoading) {
    return (
      <AdminPageAccess>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <LoadingSkeleton key={item} className="h-28" />
            ))}
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </AdminPageAccess>
    );
  }

  if (financeQuery.isError) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Unable to load the AI cost dashboard"
          message={
            financeQuery.error instanceof Error
              ? financeQuery.error.message
              : "The finance dashboard could not be loaded."
          }
          onRetry={() => void financeQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  const data = financeQuery.data;

  if (!data) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Finance dashboard unavailable"
          message="No finance data was returned by the server."
          onRetry={() => void financeQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="AI Cost Dashboard"
          description="Track official OpenAI organization spend, estimated remaining budget, and estimated per-case analysis cost."
          action={(
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-44">
                <SelectField
                  label="Window"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  options={[
                    { label: "Last 7 days", value: "7" },
                    { label: "Last 30 days", value: "30" },
                    { label: "Last 90 days", value: "90" },
                  ]}
                />
              </div>
              <Button asChild variant="secondary">
                <Link to="/admin/financial-settings">Financial Settings</Link>
              </Button>
            </div>
          )}
        />

        {data.budget.alert ? (
          <Alert tone={data.budget.alert.level === "critical" ? "error" : data.budget.alert.level === "warning" ? "info" : "info"}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{data.budget.alert.title}</p>
                <p className="mt-1 text-sm">{data.budget.alert.message}</p>
              </div>
            </div>
          </Alert>
        ) : null}

        {!data.officialCostData.adminApiConfigured ? (
          <Alert tone="info">
            Official OpenAI organization cost data is unavailable until `OPENAI_ADMIN_KEY` is configured on the backend.
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Month-to-date OpenAI spend"
            value={formatCurrencyPair(
              data.officialCostData.monthToDate.totalCostUsd,
              data.officialCostData.monthToDate.totalCostZar,
            )}
            icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label={`Trailing ${days}-day spend`}
            value={formatCurrencyPair(
              data.officialCostData.trailingWindow.totalCostUsd,
              data.officialCostData.trailingWindow.totalCostZar,
            )}
            icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Configured budget remaining"
            value={formatCurrencyPair(
              data.budget.remainingBudgetUsd,
              data.budget.remainingBudgetZar,
            )}
            icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Estimated case spend"
            value={formatCurrencyPair(
              data.caseEstimates.totalEstimatedCaseCostUsd,
              data.caseEstimates.totalEstimatedCaseCostZar,
            )}
            icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
          />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Monthly budget
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-950">
                    {formatCurrencyPair(
                      data.budget.monthlyBudgetUsd,
                      data.budget.monthlyBudgetZar,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Low-budget threshold
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-950">
                    {formatCurrencyPair(
                      data.budget.lowBudgetThresholdUsd,
                      data.budget.lowBudgetThresholdZar,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Current USD/ZAR rate
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-950">
                    {formatRate(data.budget.usdToZarExchangeRate ?? null)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-ink-500">
                <p>
                  Settings updated: {formatDate(data.budget.updatedAt || null)}
                </p>
                <p>
                  Exchange rate synced: {formatDate(data.budget.exchangeRateFetchedAt || null)}
                </p>
                <p>
                  Next provider update: {formatDate(data.budget.exchangeRateNextUpdateAt || null)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Cost Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {data.caseEstimates.topCostCases.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ink-200 text-sm">
                  <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3">Case</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Total cost</th>
                      <th className="px-4 py-3">Tokens</th>
                      <th className="px-4 py-3">Analyses</th>
                      <th className="px-4 py-3">Last model</th>
                      <th className="px-4 py-3">Last analysed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {data.caseEstimates.topCostCases.map((item) => (
                      <tr key={item.caseId}>
                        <td className="px-4 py-4 font-medium text-ink-950">
                          <Link to={`/cases/${encodeURIComponent(item.caseId)}`} className="hover:underline">
                            {item.caseTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {item.caseReferenceNumber || "Not assigned"}
                        </td>
                        <td className="px-4 py-4 text-ink-950">
                          {formatCurrencyPair(
                            item.totalEstimatedCostUsd,
                            item.totalEstimatedCostZar,
                          )}
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {formatInteger(item.totalTokens)}
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {item.analysesCount}
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {item.latestModel || "Unknown"}
                        </td>
                        <td className="px-4 py-4 text-ink-600">
                          {formatDate(item.lastAnalysedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink-600">No priced case analyses were found in this window.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {data.caseEstimates.recentAnalyses.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ink-200 text-sm">
                  <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3">Case</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Prompt tokens</th>
                      <th className="px-4 py-3">Output tokens</th>
                      <th className="px-4 py-3">Estimated cost (USD)</th>
                      <th className="px-4 py-3">Estimated cost (ZAR)</th>
                      <th className="px-4 py-3">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {data.caseEstimates.recentAnalyses.map((item) => (
                      <tr key={item.analysisId}>
                        <td className="px-4 py-4 font-medium text-ink-950">
                          <Link to={`/cases/${encodeURIComponent(item.caseId)}`} className="hover:underline">
                            {item.caseTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-ink-600">{item.model || "Unknown"}</td>
                        <td className="px-4 py-4 text-ink-600">{formatInteger(item.promptTokens)}</td>
                        <td className="px-4 py-4 text-ink-600">{formatInteger(item.completionTokens)}</td>
                        <td className="px-4 py-4 text-ink-950">{formatUsd(item.estimatedCostUsd)}</td>
                        <td className="px-4 py-4 text-ink-950">{formatZar(item.estimatedCostZar ?? null)}</td>
                        <td className="px-4 py-4 text-ink-600">{formatDate(item.completedAt || item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink-600">No recent analyses were found in this window.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageAccess>
  );
}
