import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SelectField } from "../../../components/forms/SelectField";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { formatDate } from "../../../lib/dates";
import { cn } from "../../../lib/cn";
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

function formatCompactCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDelta(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return `${value > 0 ? "+" : ""}${formatUsd(value)}`;
}

function statusTone(status: string) {
  if (status === "critical") return "solid" as const;
  if (status === "warning") return "dashed" as const;
  return "outline" as const;
}

function toneFromDelta(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "text-ink-500";
  if (Math.abs(value) < 0.01) return "text-success-700";
  return value > 0 ? "text-warning-700" : "text-success-700";
}

function maxCost(items: Array<{ costUsd: number }>) {
  return items.reduce((max, item) => Math.max(max, item.costUsd), 0);
}

function SparkBars({
  values,
  className,
}: {
  values: Array<{ label: string; value: number }>;
  className?: string;
}) {
  const peak = values.reduce((max, item) => Math.max(max, item.value), 0);

  if (!values.length) {
    return <div className={cn("h-24 rounded-2xl border border-dashed border-ink-200 bg-ink-50", className)} />;
  }

  return (
    <div className={cn("flex h-24 items-end gap-1.5 rounded-2xl border border-ink-200 bg-white/80 px-3 py-3", className)}>
      {values.map((item) => {
        const ratio = peak > 0 ? item.value / peak : 0;
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-full bg-success-500/85 transition-all"
              style={{ height: `${Math.max(10, ratio * 72)}px` }}
              title={`${item.label}: ${formatUsd(item.value)}`}
            />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
              {item.label.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FinanceMetric({
  label,
  value,
  detail,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  accent?: "neutral" | "positive" | "warning";
}) {
  const accentClasses =
    accent === "positive"
      ? "border-success-100 bg-success-50 text-success-700"
      : accent === "warning"
        ? "border-warning-100 bg-warning-50 text-warning-700"
        : "border-ink-200 bg-white text-ink-700";

  return (
    <div className="rounded-2xl border border-ink-200 bg-white px-4 py-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-[-0.03em] text-ink-950">{value}</p>
          {detail ? <p className="text-xs text-ink-500">{detail}</p> : null}
        </div>
        <div className={cn("rounded-2xl border p-2.5", accentClasses)}>{icon}</div>
      </div>
    </div>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
      {children}
    </p>
  );
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
          <LoadingSkeleton className="h-72" />
          <LoadingSkeleton className="h-80" />
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

  const spendBars = data.officialCostData.trailingWindow.dailyCosts.slice(-14).map((item) => ({
    label: item.date,
    value: item.costUsd,
  }));
  const budgetProgress =
    data.budget.monthlyBudgetUsd && data.budget.monthlyBudgetUsd > 0 && data.officialCostData.monthToDate.totalCostUsd !== null
      ? Math.min((data.officialCostData.monthToDate.totalCostUsd / data.budget.monthlyBudgetUsd) * 100, 100)
      : null;
  const remainingBudgetTone =
    data.budget.status === "critical" ? "warning" : data.budget.status === "warning" ? "warning" : "positive";
  const monthReconciliation = data.officialCostData.reconciliation?.monthToDate;
  const trailingReconciliation = data.officialCostData.reconciliation?.trailingWindow;
  const topCasePeak = maxCost(
    data.caseEstimates.topCostCases.map((item) => ({ costUsd: item.totalEstimatedCostUsd })),
  );

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="AI Cost Dashboard"
          description="Monitor spend, reconcile estimated case costs with official OpenAI totals, and keep budget runway in view."
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
          <Alert tone={data.budget.alert.level === "critical" ? "error" : "info"}>
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

        <Card className="overflow-hidden border-ink-200 bg-[linear-gradient(180deg,rgba(238,249,243,0.65),rgba(255,255,255,0.98)_42%,rgba(255,255,255,1)_100%)]">
          <CardContent className="space-y-8 p-6 sm:p-7">
            <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <SectionKicker>Finance Overview</SectionKicker>
                    <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink-950">
                      {formatCurrencyPair(
                        data.officialCostData.monthToDate.totalCostUsd,
                        data.officialCostData.monthToDate.totalCostZar,
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600">
                      <span className="inline-flex items-center gap-1.5 text-success-700">
                        <TrendingUp className="h-4 w-4" aria-hidden="true" />
                        Trailing {days}-day spend {formatCompactCurrency(data.officialCostData.trailingWindow.totalCostUsd)}
                      </span>
                      <span className="text-ink-400">•</span>
                      <span>{data.caseEstimates.pricedAnalysesCount} priced analyses</span>
                    </div>
                  </div>
                  <Badge tone={statusTone(data.budget.status)}>
                    Budget status: {data.budget.status}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FinanceMetric
                    label="Month to date"
                    value={formatUsd(data.officialCostData.monthToDate.totalCostUsd)}
                    detail={formatZar(data.officialCostData.monthToDate.totalCostZar ?? null)}
                    icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
                    accent="positive"
                  />
                  <FinanceMetric
                    label={`Trailing ${days} days`}
                    value={formatUsd(data.officialCostData.trailingWindow.totalCostUsd)}
                    detail={formatZar(data.officialCostData.trailingWindow.totalCostZar ?? null)}
                    icon={<Activity className="h-5 w-5" aria-hidden="true" />}
                    accent="neutral"
                  />
                  <FinanceMetric
                    label="Budget remaining"
                    value={formatUsd(data.budget.remainingBudgetUsd)}
                    detail={formatZar(data.budget.remainingBudgetZar ?? null)}
                    icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
                    accent={remainingBudgetTone}
                  />
                  <FinanceMetric
                    label="Estimated case spend"
                    value={formatUsd(data.caseEstimates.totalEstimatedCaseCostUsd)}
                    detail={formatZar(data.caseEstimates.totalEstimatedCaseCostZar ?? null)}
                    icon={<Scale className="h-5 w-5" aria-hidden="true" />}
                    accent="neutral"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr]">
                  <div className="rounded-[24px] border border-ink-200 bg-white/90 p-5 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <SectionKicker>Daily Spend</SectionKicker>
                        <p className="mt-2 text-lg font-semibold text-ink-950">
                          Official OpenAI cost trend
                        </p>
                      </div>
                      <p className="text-xs text-ink-500">
                        {spendBars.length ? `Last ${spendBars.length} recorded days` : "No daily costs yet"}
                      </p>
                    </div>
                    <div className="mt-5">
                      <SparkBars values={spendBars} />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                      <span>Peak day {formatUsd(maxCost(spendBars.map((item) => ({ costUsd: item.value }))))}</span>
                      <span>Source: OpenAI Admin Costs API</span>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-ink-200 bg-white/90 p-5 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <SectionKicker>Budget Runway</SectionKicker>
                        <p className="mt-2 text-lg font-semibold text-ink-950">
                          {formatCurrencyPair(
                            data.budget.monthlyBudgetUsd,
                            data.budget.monthlyBudgetZar,
                          )}
                        </p>
                      </div>
                      <Badge tone={statusTone(data.budget.status)}>
                        {data.budget.status}
                      </Badge>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            data.budget.status === "critical"
                              ? "bg-danger-500"
                              : data.budget.status === "warning"
                                ? "bg-warning-500"
                                : "bg-success-500",
                          )}
                          style={{ width: `${budgetProgress ?? 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-500">Spent this month</span>
                        <span className="font-medium text-ink-950">
                          {budgetProgress !== null ? `${budgetProgress.toFixed(1)}%` : "Unavailable"}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-ink-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                            Threshold
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-950">
                            {formatCurrencyPair(
                              data.budget.lowBudgetThresholdUsd,
                              data.budget.lowBudgetThresholdZar,
                            )}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-ink-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                            USD/ZAR
                          </p>
                          <p className="mt-2 text-sm font-semibold text-ink-950">
                            {formatRate(data.budget.usdToZarExchangeRate ?? null)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-ink-200 bg-white/92 p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <SectionKicker>Reconciliation</SectionKicker>
                      <p className="mt-2 text-lg font-semibold text-ink-950">
                        Estimated vs official spend
                      </p>
                    </div>
                    <Scale className="h-5 w-5 text-ink-500" aria-hidden="true" />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                            Month to date
                          </p>
                          <p className="mt-2 text-sm text-ink-600">
                            Local {formatUsd(monthReconciliation?.localEstimatedUsd ?? null)}
                          </p>
                          <p className="mt-1 text-sm text-ink-600">
                            Official {formatUsd(monthReconciliation?.officialUsd ?? null)}
                          </p>
                        </div>
                        <div className={cn("text-right", toneFromDelta(monthReconciliation?.deltaUsd ?? null))}>
                          <div className="inline-flex items-center gap-1 text-sm font-semibold">
                            {(monthReconciliation?.deltaUsd ?? 0) > 0 ? (
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                            )}
                            {formatDelta(monthReconciliation?.deltaUsd ?? null)}
                          </div>
                          <p className="mt-1 text-xs">{formatPercent(monthReconciliation?.deltaPercent ?? null)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                            Trailing window
                          </p>
                          <p className="mt-2 text-sm text-ink-600">
                            Local {formatUsd(trailingReconciliation?.localEstimatedUsd ?? null)}
                          </p>
                          <p className="mt-1 text-sm text-ink-600">
                            Official {formatUsd(trailingReconciliation?.officialUsd ?? null)}
                          </p>
                        </div>
                        <div className={cn("text-right", toneFromDelta(trailingReconciliation?.deltaUsd ?? null))}>
                          <div className="inline-flex items-center gap-1 text-sm font-semibold">
                            {(trailingReconciliation?.deltaUsd ?? 0) > 0 ? (
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                            )}
                            {formatDelta(trailingReconciliation?.deltaUsd ?? null)}
                          </div>
                          <p className="mt-1 text-xs">{formatPercent(trailingReconciliation?.deltaPercent ?? null)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-ink-500">
                      <p>Settings updated: {formatDate(data.budget.updatedAt || null)}</p>
                      <p>Exchange rate synced: {formatDate(data.budget.exchangeRateFetchedAt || null)}</p>
                      <p>Next provider update: {formatDate(data.budget.exchangeRateNextUpdateAt || null)}</p>
                      <p>Pricing version: {data.caseEstimates.pricingVersion || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-ink-200 bg-ink-50/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SectionKicker>Top Cost Cases</SectionKicker>
                  <CardTitle className="mt-2">Most expensive cases in the selected window</CardTitle>
                </div>
                <Badge tone="outline">{data.caseEstimates.totalCases} cases</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.caseEstimates.topCostCases.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-ink-200 bg-white">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                        <th className="px-5 py-3.5">Case</th>
                        <th className="px-4 py-3.5">Cost</th>
                        <th className="px-4 py-3.5">Load</th>
                        <th className="px-4 py-3.5">Analyses</th>
                        <th className="px-5 py-3.5">Last analysed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.caseEstimates.topCostCases.map((item) => {
                        const width = topCasePeak > 0 ? (item.totalEstimatedCostUsd / topCasePeak) * 100 : 0;
                        return (
                          <tr key={item.caseId} className="border-b border-ink-100 transition-colors hover:bg-ink-50/80">
                            <td className="px-5 py-4">
                              <Link
                                to={`/cases/${encodeURIComponent(item.caseId)}`}
                                className="font-medium text-ink-950 hover:no-underline"
                              >
                                {item.caseTitle}
                              </Link>
                              <p className="mt-1 text-xs text-ink-500">
                                {item.caseReferenceNumber || "No reference"} • {item.latestModel || "Unknown model"}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-ink-950">
                                {formatUsd(item.totalEstimatedCostUsd)}
                              </p>
                              <p className="mt-1 text-xs text-ink-500">
                                {formatZar(item.totalEstimatedCostZar ?? null)}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="w-28">
                                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                                  <div
                                    className="h-full rounded-full bg-success-500"
                                    style={{ width: `${Math.max(8, width)}%` }}
                                  />
                                </div>
                                <p className="mt-2 text-xs text-ink-500">
                                  {formatInteger(item.totalTokens)} tokens
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-ink-600">{item.analysesCount}</td>
                            <td className="px-5 py-4 text-ink-600">
                              {formatDate(item.lastAnalysedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-sm text-ink-600">
                  No priced case analyses were found in this window.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-ink-200 bg-ink-50/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SectionKicker>Recent Analyses</SectionKicker>
                  <CardTitle className="mt-2">Latest analysis ledger</CardTitle>
                </div>
                <Badge tone="outline">
                  {data.caseEstimates.pricedAnalysesCount} priced
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.caseEstimates.recentAnalyses.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-ink-200 bg-white">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                        <th className="px-5 py-3.5">Analysis</th>
                        <th className="px-4 py-3.5">Usage</th>
                        <th className="px-4 py-3.5">Cost split</th>
                        <th className="px-5 py-3.5">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.caseEstimates.recentAnalyses.map((item) => (
                        <tr key={item.analysisId} className="border-b border-ink-100 align-top transition-colors hover:bg-ink-50/80">
                          <td className="px-5 py-4">
                            <Link
                              to={`/cases/${encodeURIComponent(item.caseId)}`}
                              className="font-medium text-ink-950 hover:no-underline"
                            >
                              {item.caseTitle}
                            </Link>
                            <p className="mt-1 text-xs text-ink-500">
                              {item.model || "Unknown"} • v{item.versionNumber ?? "?"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1 text-sm text-ink-600">
                              <p>Input {formatInteger(item.promptTokens)}</p>
                              <p>Cached {formatInteger(item.cachedPromptTokens ?? 0)}</p>
                              <p>Output {formatInteger(item.completionTokens)}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-ink-950">{formatUsd(item.estimatedCostUsd)}</p>
                            <p className="mt-1 text-xs text-success-700">
                              Input {formatUsd(item.costBreakdown?.inputCostUsd ?? null)}
                            </p>
                            <p className="mt-1 text-xs text-success-700">
                              Cached {formatUsd(item.costBreakdown?.cachedInputCostUsd ?? null)}
                            </p>
                            <p className="mt-1 text-xs text-ink-500">
                              Output {formatUsd(item.costBreakdown?.outputCostUsd ?? null)}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-ink-600">
                            {formatDate(item.completedAt || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-sm text-ink-600">
                  No recent analyses were found in this window.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageAccess>
  );
}
