import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        description="Review and track all cases submitted through your Cloud Insure account."
        action={
          <Button asChild>
            <Link to="/cases/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create New Case
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 rounded-lg border border-ink-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-ink-400" aria-hidden="true" />
          <TextField label="Search cases" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Open", value: "open" },
            { label: "Completed", value: "completed" },
            { label: "Needs attention", value: "attention" },
            { label: "Other", value: "other" },
          ]}
        />
      </div>

      {casesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <LoadingSkeleton key={item} className="h-32" />
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
          action={
            <Button asChild>
              <Link to="/cases/new">Create New Case</Link>
            </Button>
          }
        />
      ) : filteredCases.length === 0 ? (
        <EmptyState title="No cases match your filters." description="Adjust your search or status filter to see more cases." />
      ) : (
        <CaseList cases={filteredCases} />
      )}
    </div>
  );
}
