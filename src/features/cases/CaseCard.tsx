import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { getCaseId, getCaseStatus, getCaseTitle } from "./cases.utils";

export function CaseCard({ caseItem }: { caseItem: unknown }) {
  const id = getCaseId(caseItem);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-ink-950">{getCaseTitle(caseItem)}</h2>
            <CaseStatusBadge status={getCaseStatus(caseItem)} />
          </div>
          <p className="mt-1 text-sm text-ink-500">Case ID: {id || "Not assigned"}</p>
        </div>
        {id ? (
          <Button asChild className="w-full sm:w-auto" variant="secondary">
            <Link to={`/cases/${encodeURIComponent(id)}`}>View details</Link>
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" variant="secondary" disabled>
            View details
          </Button>
        )}
      </div>
    </Card>
  );
}
