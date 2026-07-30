import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Briefcase, CheckCircle2, Clock3, FilePlus2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { DashboardMetricCard } from "../components/ui/DashboardMetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
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
          <section aria-label="Portfolio summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Total cases" value={cases.length} detail="Portfolio volume" icon={<Briefcase className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Open cases" value={openCases} detail="Currently moving" icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Completed cases" value={completedCases} detail="Resolved work" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Cases needing attention" value={attentionCases} detail="Needs review" icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} />
          </section>

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
