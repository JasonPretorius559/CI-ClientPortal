import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, FilePlus2, FolderKanban, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { CommandBar, CommandBarGroup } from "../components/ui/CommandBar";
import { DashboardMetricCard } from "../components/ui/DashboardMetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { FilterPill } from "../components/ui/FilterPill";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { PageShell } from "../components/ui/PageShell";
import { SearchInput } from "../components/ui/SearchInput";
import { CaseList } from "../features/cases/CaseList";
import { getUserCases } from "../features/cases/cases.api";
import { getCaseDescription, getCaseId, getCaseStatus, getCaseTitle, getStatusGroup } from "../features/cases/cases.utils";
import { ApiError } from "../lib/api";

export function CasesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const casesQuery = useQuery({
    queryKey: ["cases", "mine"],
    queryFn: getUserCases,
  });

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (casesQuery.data ?? []).filter((caseItem) => {
      const statusGroup = getStatusGroup(getCaseStatus(caseItem));
      const matchesStatus = statusFilter === "all" || statusGroup === statusFilter;
      const searchable = [getCaseTitle(caseItem), getCaseId(caseItem), getCaseStatus(caseItem), getCaseDescription(caseItem)].join(" ").toLowerCase();
      const matchesSearch = !term || searchable.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [casesQuery.data, search, statusFilter]);

  const cases = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);
  const metrics = useMemo(() => ({
    total: cases.length,
    open: cases.filter((item) => getStatusGroup(getCaseStatus(item)) === "open").length,
    completed: cases.filter((item) => getStatusGroup(getCaseStatus(item)) === "completed").length,
    attention: cases.filter((item) => getStatusGroup(getCaseStatus(item)) === "attention").length,
  }), [cases]);

  return (
    <PageShell>
      <PageHeader
        title="My Cases"
        description="Review and track all cases submitted through your Cloud Insure account."
        action={(
          <Button asChild>
            <Link to="/cases/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create New Case
            </Link>
          </Button>
        )}
      />

      {!casesQuery.isLoading && !casesQuery.isError ? (
          <section aria-label="Case summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Total cases" value={metrics.total} detail="All submissions" icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Open" value={metrics.open} detail="In progress" icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Completed" value={metrics.completed} detail="Finished" icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Needs attention" value={metrics.attention} detail="Flagged" icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />} />
          </section>
        ) : null}

      <CommandBar sticky>
        <div className="toolbar">
          <div>
            <p className="page-toolbar-meta">Case filters</p>
            <p className="text-sm text-ink-600">
              {filteredCases.length} {filteredCases.length === 1 ? "result" : "results"}
            </p>
          </div>
        </div>
        <CommandBarGroup>
          <div className="flex flex-wrap items-center gap-3">
            <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterPill>
            <FilterPill active={statusFilter === "open"} onClick={() => setStatusFilter("open")}>Open</FilterPill>
            <FilterPill active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")}>Completed</FilterPill>
            <FilterPill active={statusFilter === "attention"} onClick={() => setStatusFilter("attention")}>Needs attention</FilterPill>
          </div>
          <div className="min-w-0 flex-1 sm:max-w-md">
            <SearchInput label="Search cases" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, ID, or status..." />
          </div>
        </CommandBarGroup>
      </CommandBar>

      {casesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <LoadingSkeleton key={item} className="h-32 rounded-[1.75rem]" />
          ))}
        </div>
      ) : casesQuery.isError ? (
        <ErrorState
          message={casesQuery.error instanceof ApiError ? casesQuery.error.message : "Unable to load your cases."}
          onRetry={() => void casesQuery.refetch()}
        />
      ) : (casesQuery.data ?? []).length === 0 ? (
        <EmptyState
          title="You do not have any cases yet."
          description="Create your first case to get started."
          action={(
            <Button asChild>
              <Link to="/cases/new">Create New Case</Link>
            </Button>
          )}
        />
      ) : filteredCases.length === 0 ? (
        <EmptyState title="No cases match your filters." description="Adjust your search or status filter to see more cases." />
      ) : (
        <CaseList cases={filteredCases} />
      )}
    </PageShell>
  );
}
