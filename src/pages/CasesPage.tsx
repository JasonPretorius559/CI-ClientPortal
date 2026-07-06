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
import { PageTabs } from "../components/ui/PageTabs";
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
        tabs={(
          <PageTabs
            items={[
              { key: "all", label: "All cases", active: true, suffix: <span>{cases.length}</span> },
              { key: "open", label: "Open" },
              { key: "completed", label: "Completed" },
            ]}
          />
        )}
        action={(
          <Button asChild>
            <Link to="/cases/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create New Case
            </Link>
          </Button>
        )}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="surface-card px-5 py-6 sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500">Case Directory</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.9fr)]">
            <div>
              <h2 className="max-w-2xl text-[1.8rem] font-semibold leading-tight tracking-[-0.05em] text-ink-950 sm:text-[2.3rem]">
                Search, filter, and resume work from one consistent case index.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600">
                The list is structured around quick triage first, with active filters and search controls grouped into one persistent control deck.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-surface-line bg-surface-muted p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Visible results</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink-950">{filteredCases.length}</p>
              <p className="mt-2 text-sm text-ink-600">
                Showing {statusFilter === "all" ? "all statuses" : statusFilter} with live search applied.
              </p>
            </div>
          </div>
        </div>

        {!casesQuery.isLoading && !casesQuery.isError ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardMetricCard label="Total cases" value={metrics.total} detail="All submissions" icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Open" value={metrics.open} detail="In progress" icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Completed" value={metrics.completed} detail="Finished" icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} />
            <DashboardMetricCard label="Needs attention" value={metrics.attention} detail="Flagged" icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />} />
          </div>
        ) : null}
      </section>

      <CommandBar sticky>
        <div className="toolbar">
          <div>
            <p className="page-toolbar-meta">Case filters</p>
            <p className="text-sm text-ink-600">
              Find active work quickly and narrow your view without losing context.
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
