import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";
import { CaseDetails } from "../features/cases/CaseDetails";
import { getUserCases } from "../features/cases/cases.api";
import { getCaseTitle, matchesCaseId } from "../features/cases/cases.utils";
import { ApiError } from "../lib/api";

export function CaseDetailPage() {
  const { id = "" } = useParams();
  const decodedId = decodeURIComponent(id);
  const casesQuery = useQuery({
    queryKey: ["cases", "mine"],
    queryFn: getUserCases,
  });

  const caseItem = (casesQuery.data ?? []).find((item) => matchesCaseId(item, decodedId));

  if (casesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-56" />
      </div>
    );
  }

  if (casesQuery.isError) {
    return <ErrorState message={casesQuery.error instanceof ApiError ? casesQuery.error.message : "Unable to load this case."} onRetry={() => void casesQuery.refetch()} />;
  }

  if (!caseItem) {
    return (
      <EmptyState
        title="Case not found"
        description="We could not find this case in your account."
        action={
          <Button asChild variant="secondary">
            <Link to="/cases">Back to My Cases</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getCaseTitle(caseItem)}
        description="Case details and submitted information."
        action={
          <Button asChild variant="secondary">
            <Link to="/cases">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to My Cases
            </Link>
          </Button>
        }
      />
      <CaseDetails caseItem={caseItem} />
    </div>
  );
}
