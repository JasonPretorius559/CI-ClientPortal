import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { getCaseId, getCaseStatus, getCaseTitle } from "./cases.utils";

export function CaseTable({ cases }: { cases: unknown[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-200">
          <thead className="bg-ink-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Case</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {cases.map((caseItem, index) => {
              const id = getCaseId(caseItem);
              return (
                <tr key={`${id}-${index}`} className="transition hover:bg-ink-50">
                  <td className="max-w-sm px-5 py-4">
                    <p className="truncate text-sm font-semibold text-ink-950">{getCaseTitle(caseItem)}</p>
                    <p className="mt-1 text-xs text-ink-500">Case ID: {id || "Not assigned"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <CaseStatusBadge status={getCaseStatus(caseItem)} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {id ? (
                      <Button asChild variant="secondary" className="min-h-9 px-3 py-1.5">
                        <Link to={`/cases/${encodeURIComponent(id)}`}>View details</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" className="min-h-9 px-3 py-1.5" disabled>
                        View details
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
