import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Briefcase, CheckCircle2, Clock3, FilePlus2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
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
    <div className="space-y-6">
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
            <StatCard label="Total cases" value={cases.length} icon={<Briefcase className="h-5 w-5" aria-hidden="true" />} />
            <StatCard label="Open cases" value={openCases} icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} />
            <StatCard label="Completed cases" value={completedCases} icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
            <StatCard label="Cases needing attention" value={attentionCases} icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} />
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
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-950">Recent cases</h2>
                <Link className="text-sm font-medium" to="/cases">
                  View all
                </Link>
              </div>
              <CaseList cases={recentCases} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
