import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import {
  DataGrid,
  DataGridCell,
  DataGridHeaderCell,
  DataGridTable,
} from "../../components/ui/DataGrid";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { getCaseId, getCaseStatus, getCaseTitle } from "./cases.utils";

export function CaseTable({ cases }: { cases: unknown[] }) {
  return (
    <DataGrid className="data-table-shell">
      <DataGridTable>
          <thead>
            <tr>
              <DataGridHeaderCell className="px-6 py-4">Case</DataGridHeaderCell>
              <DataGridHeaderCell className="px-6 py-4">Status</DataGridHeaderCell>
              <DataGridHeaderCell className="px-6 py-4 text-right">Action</DataGridHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {cases.map((caseItem, index) => {
              const id = getCaseId(caseItem);
              return (
                <tr key={`${id}-${index}`}>
                  <DataGridCell className="max-w-sm px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Case record</p>
                    <p className="mt-2 truncate text-sm font-semibold text-ink-950">{getCaseTitle(caseItem)}</p>
                    <p className="mt-1 text-xs text-ink-500">Case ID: {id || "Not assigned"}</p>
                  </DataGridCell>
                  <DataGridCell className="px-6 py-5">
                    <CaseStatusBadge status={getCaseStatus(caseItem)} />
                  </DataGridCell>
                  <DataGridCell className="px-6 py-5 text-right">
                    {id ? (
                      <Button asChild variant="secondary" className="min-h-9 px-3 py-1.5">
                        <Link to={`/cases/${encodeURIComponent(id)}`}>View details</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" className="min-h-9 px-3 py-1.5" disabled>
                        View details
                      </Button>
                    )}
                  </DataGridCell>
                </tr>
              );
            })}
          </tbody>
      </DataGridTable>
    </DataGrid>
  );
}
