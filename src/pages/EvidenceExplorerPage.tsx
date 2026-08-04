import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileSearch2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { PageShell } from "../components/ui/PageShell";
import { EvidenceExplorer } from "../features/cases/EvidenceExplorer";
import { getCaseAnalysisVersions, getUserCases } from "../features/cases/cases.api";
import { getCaseTitle, matchesCaseId } from "../features/cases/cases.utils";
import { ApiError } from "../lib/api";

export function EvidenceExplorerPage() {
  const { id = "" } = useParams();
  const caseId = decodeURIComponent(id);
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("analysisId") || "";
  const analysisTypeId = searchParams.get("analysisTypeId") || "";
  const casesQuery = useQuery({ queryKey: ["cases", "mine"], queryFn: getUserCases });
  const versionsQuery = useQuery({
    queryKey: ["case-analysis-versions", caseId],
    queryFn: () => getCaseAnalysisVersions(caseId),
    enabled: Boolean(caseId),
  });

  const caseItem = (casesQuery.data ?? []).find((item) => matchesCaseId(item, caseId));
  const versions = useMemo(
    () => (versionsQuery.data ?? []).filter((version) => !analysisTypeId || version.linkedCaseType?.id === analysisTypeId || version.analysisId === analysisId),
    [analysisId, analysisTypeId, versionsQuery.data],
  );
  const selectedVersion = versions.find((version) => version.analysisId === analysisId) ?? versions.find((version) => version.isCurrent) ?? versions[0] ?? null;

  if (casesQuery.isLoading || versionsQuery.isLoading) {
    return <div className="space-y-6"><LoadingSkeleton className="h-32" /><LoadingSkeleton className="h-96" /></div>;
  }

  if (casesQuery.isError || versionsQuery.isError) {
    const error = casesQuery.error || versionsQuery.error;
    return <ErrorState message={error instanceof ApiError ? error.message : "Unable to load evidence."} onRetry={() => { void casesQuery.refetch(); void versionsQuery.refetch(); }} />;
  }

  if (!caseItem) {
    return <EmptyState title="Case not found" description="We could not find this case in your account." action={<Button asChild variant="secondary"><Link to="/cases">Back to My Cases</Link></Button>} />;
  }

  const backHref = `/cases/${encodeURIComponent(caseId)}`;
  const analysisName = selectedVersion?.linkedCaseType?.name || "Selected analysis";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Evidence explorer"
        title={getCaseTitle(caseItem)}
        description={`${analysisName}${selectedVersion ? ` · Version ${selectedVersion.versionNumber}` : ""}`}
        action={<Button asChild variant="secondary"><Link to={backHref}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to case</Link></Button>}
      />
      <section className="rounded-2xl border border-surface-line bg-white p-5 shadow-soft sm:p-7">
        <div className="mb-6 flex items-start gap-4 border-b border-surface-line pb-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center bg-ink-950 text-white"><FileSearch2 className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Source-linked findings</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">Search claims, inspect source references, and review evidence quality without crowding the analysis result.</p>
          </div>
        </div>
        {selectedVersion ? <EvidenceExplorer evidence={selectedVersion.evidenceExplorer} /> : <EmptyState title="No evidence available" description="Run this analysis before opening its evidence record." />}
      </section>
    </PageShell>
  );
}
