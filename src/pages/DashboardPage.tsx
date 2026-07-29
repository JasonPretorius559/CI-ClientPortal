import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowUpRight, Briefcase, CheckCircle2, Clock3, FilePlus2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { DashboardMetricCard } from "../components/ui/DashboardMetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { InlineMeta } from "../components/ui/InlineMeta";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { PageShell, SectionDivider } from "../components/ui/PageShell";
import { CaseList } from "../features/cases/CaseList";
import { getUserCases } from "../features/cases/cases.api";
import { getCaseStatus, getStatusGroup } from "../features/cases/cases.utils";
import { useAuth } from "../features/auth/useAuth";
import { ApiError } from "../lib/api";
import { getUserDisplayName } from "../lib/user";

export function DashboardPage() {
  const { user } = useAuth();
  const casesQuery = useQuery({
    queryKey: ["cases", "mine"],
    queryFn: getUserCases,
  });

  const cases = casesQuery.data ?? [];
  const openCases = cases.filter((caseItem) => getStatusGroup(getCaseStatus(caseItem)) === "open").length;
  const completedCases = cases.filter((caseItem) => getStatusGroup(getCaseStatus(caseItem)) === "completed").length;
  const attentionCases = cases.filter((caseItem) => getStatusGroup(getCaseStatus(caseItem)) === "attention").length;
  const recentCases = cases.slice(0, 4);

  return (
    <PageShell>
      <PageHeader
        title={`Welcome, ${getUserDisplayName(user)}`}
        description="Track your insurance cases and manage new submissions from one secure place."
        action={
          <Button asChild>
            <Link to="/cases/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create New Case
            </Link>
          </Button>
        }
      />
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="surface-card border-ink-800 bg-ink-950 px-5 py-6 text-white sm:px-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Operations snapshot</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.9fr)]">
            <div>
              <h2 className="max-w-xl text-[1.8rem] font-semibold leading-tight tracking-[-0.05em] text-white sm:text-[2.4rem]">
                Keep active claims moving with fewer handoffs and a clearer review queue.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                Current workload, portfolio signals, and the next review queue—kept in one decision-ready view.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Today&apos;s focus</p>
              <div className="mt-4 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{openCases}</p>
                  <p className="mt-1 text-sm text-white/50">Active cases in progress</p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Priority queue</p>
                    <p className="mt-1 text-sm text-white/50">{attentionCases} cases need attention.</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/55" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <InlineMeta
          className="h-fit"
          items={[
            { label: "Total portfolio", value: `${cases.length} cases` },
            { label: "Open work", value: `${openCases} active` },
            { label: "Completed", value: `${completedCases} closed` },
            { label: "Needs attention", value: `${attentionCases} flagged` },
          ]}
        />
      </section>

      {casesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <LoadingSkeleton key={item} className="h-28" />
          ))}
        </div>
      ) : casesQuery.isError ? (
        <ErrorState
          message={casesQuery.error instanceof ApiError ? casesQuery.error.message : "Unable to load your cases."}
          onRetry={() => void casesQuery.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Total cases" value={cases.length} detail="Portfolio volume" icon={<Briefcase className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Open cases" value={openCases} detail="Currently moving" icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Completed cases" value={completedCases} detail="Resolved work" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Cases needing attention" value={attentionCases} detail="Needs review" icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} />
          </div>

          {cases.length === 0 ? (
            <EmptyState
              title="You do not have any cases yet."
              description="Create your first case to get started."
              action={
                <Button asChild>
                  <Link to="/cases/new">Create New Case</Link>
                </Button>
              }
            />
          ) : (
            <section className="space-y-4">
              <SectionDivider
                title="Recent cases"
                description="Continue the latest submissions and review recent movement."
                action={
                  <Link className="text-sm font-medium" to="/cases">
                    View all
                  </Link>
                }
              />
              <CaseList cases={recentCases} />
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
