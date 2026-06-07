import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Archive, FilePlus2, PencilLine } from "lucide-react";
import { SelectField } from "../../components/forms/SelectField";
import { TextField } from "../../components/forms/TextField";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../components/ui/toast-context";
import { formatDate } from "../../lib/dates";
import { createReportDesign, deleteReportDesign, getReportDesigns, getStructuredOutputSchemas } from "../../features/report-designs/reportDesigns.api";
import { buildSaveReportDesignInput, getReportDesignId, getSchemaDisplayName } from "../../features/report-designs/reportDesigns.utils";

export function ReportDesignsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [schemaFilter, setSchemaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const schemaKeyFilter = schemaFilter === "all" ? undefined : schemaFilter;

  const schemasQuery = useQuery({
    queryKey: ["admin", "structured-output-schemas"],
    queryFn: getStructuredOutputSchemas,
  });

  const reportDesignsQuery = useQuery({
    queryKey: ["admin", "report-designs", schemaKeyFilter ?? "all"],
    queryFn: () => getReportDesigns(schemaKeyFilter),
  });

  const archiveMutation = useMutation({
    mutationFn: (reportDesignId: string) => deleteReportDesign(reportDesignId),
    onMutate: () => setPageError(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "report-designs"] });
      showToast({
        tone: "success",
        title: "Report design archived.",
      });
    },
    onError: (error) => setPageError(error instanceof Error ? error.message : "Unable to archive this report design."),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (reportDesignId: string) => {
      const design = (reportDesignsQuery.data ?? []).find((item) => getReportDesignId(item) === reportDesignId);
      const payload = design ? buildSaveReportDesignInput({ ...design, name: `${design.name} Copy`, isArchived: false }) : null;

      if (!payload) {
        throw new Error("Unable to duplicate this report design.");
      }

      return createReportDesign(payload);
    },
    onMutate: () => setPageError(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "report-designs"] });
      showToast({ tone: "success", title: "Report design duplicated." });
    },
    onError: (error) => setPageError(error instanceof Error ? error.message : "Unable to duplicate this report design."),
  });

  const schemas = schemasQuery.data ?? [];
  const reportDesigns = (reportDesignsQuery.data ?? []).filter((design) => {
    const query = search.trim().toLowerCase();
    return !query || `${design.name} ${design.description} ${design.schemaKey}`.toLowerCase().includes(query);
  });

  if (reportDesignsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-20" />
        <LoadingSkeleton className="h-72" />
      </div>
    );
  }

  if (reportDesignsQuery.isError) {
    return (
      <ErrorState
        title="Unable to load report designs"
        message={reportDesignsQuery.error instanceof Error ? reportDesignsQuery.error.message : "The report design library could not be loaded."}
        onRetry={() => void reportDesignsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Designs"
        description="Create schema-first report layouts that bind directly to structured output fields and can be previewed against completed analysis runs."
        action={(
          <Button asChild>
            <Link to="/admin/report-designs/new">
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              New Design
            </Link>
          </Button>
        )}
      />

      <div className="grid gap-4 rounded-lg border border-ink-200 bg-white p-4 shadow-soft md:grid-cols-[260px_260px_minmax(0,1fr)]">
        <SelectField
          label="Schema filter"
          value={schemaFilter}
          onChange={(event) => setSchemaFilter(event.target.value)}
          options={[
            { label: "All schemas", value: "all" },
            ...schemas.map((schema) => ({
              label: schema.version ? `${schema.name} (v${schema.version})` : schema.name,
              value: schema.key,
            })),
          ]}
        />
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or schema" />
        <div className="flex items-end">
          <p className="text-sm text-ink-600">
            {schemaKeyFilter ? `Showing report designs for ${getSchemaDisplayName(schemas.find((schema) => schema.key === schemaKeyFilter), schemaKeyFilter)}.` : "Showing every report design across available structured output schemas."}
          </p>
        </div>
      </div>

      {pageError ? <Alert tone="error">{pageError}</Alert> : null}

      {reportDesigns.length === 0 ? (
        <EmptyState
          title="No report designs yet"
          description="Start by choosing a structured output schema, then add bound components for the report layout."
          action={(
            <Button asChild>
              <Link to="/admin/report-designs/new">Create report design</Link>
            </Button>
          )}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200 text-sm">
              <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Schema</th>
                  <th className="px-4 py-3">Case Type</th>
                  <th className="px-4 py-3">Linked Case Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
          {reportDesigns.map((reportDesign) => {
            const reportDesignId = getReportDesignId(reportDesign);
            const schema = schemas.find((item) => item.key === reportDesign.schemaKey);

            return (
              <tr key={reportDesignId || reportDesign.name}>
                <td className="max-w-xs px-4 py-4">
                  <p className="font-medium text-ink-950">{reportDesign.name}</p>
                  <p className="mt-1 text-xs text-ink-600">{reportDesign.description || "No description provided."}</p>
                  {reportDesign.warnings?.length ? <Badge tone="attention" className="mt-2">Warnings</Badge> : null}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="outline">{getSchemaDisplayName(schema, reportDesign.schemaKey)}</Badge>
                    {reportDesign.schemaVersion ? <Badge tone="muted">v{reportDesign.schemaVersion}</Badge> : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-ink-700">{schema?.caseTypeNameSnapshot || schema?.caseTypeName || schema?.caseType || "Any"}</td>
                <td className="px-4 py-4 text-ink-700">{schema?.linkedCaseTypeNameSnapshot || schema?.linkedCaseTypeName || schema?.linkedCaseType || "Any"}</td>
                <td className="px-4 py-4">
                  <Badge tone={reportDesign.status === "archived" || reportDesign.isArchived ? "dashed" : reportDesign.status === "published" ? "outline" : "muted"}>
                    {reportDesign.status || (reportDesign.isArchived ? "archived" : "draft")}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-ink-600">{formatDate(reportDesign.updatedAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary">
                      <Link to={`/admin/report-designs/${encodeURIComponent(reportDesignId)}`}>
                        <PencilLine className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => duplicateMutation.mutate(reportDesignId)}
                      isLoading={duplicateMutation.isPending}
                      disabled={!reportDesignId}
                    >
                      <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => archiveMutation.mutate(reportDesignId)}
                      isLoading={archiveMutation.isPending}
                      disabled={!reportDesignId}
                    >
                      <Archive className="h-4 w-4" aria-hidden="true" />
                      Archive
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
