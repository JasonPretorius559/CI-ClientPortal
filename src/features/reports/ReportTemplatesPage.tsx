import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Edit3, FilePlus2, Trash2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatDate } from "../../lib/dates";
import { createDefaultReportTemplate } from "./reportTemplate.defaults";
import { createReportTemplate, deleteReportTemplate, getReportTemplates } from "./reports.api";
import { getReportTemplateId, type ReportTemplate } from "./reports.types";

function duplicateTemplate(template: ReportTemplate): ReportTemplate {
  const { id, _id, createdAt, updatedAt, ...rest } = template;
  void id;
  void _id;
  void createdAt;
  void updatedAt;
  return {
    ...rest,
    name: `${template.name} Copy`,
    isDefault: false,
    version: 1,
  };
}

export function ReportTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const templatesQuery = useQuery({
    queryKey: ["report-templates"],
    queryFn: getReportTemplates,
  });

  const createMutation = useMutation({
    mutationFn: () => createReportTemplate(createDefaultReportTemplate()),
    onSuccess: (template) => {
      void queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      const id = getReportTemplateId(template);
      navigate(id ? `/reports/designer/${encodeURIComponent(id)}` : "/reports/designer");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (template: ReportTemplate) => createReportTemplate(duplicateTemplate(template)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["report-templates"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => deleteReportTemplate(templateId),
    onMutate: () => setDeleteError(null),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["report-templates"] }),
    onError: (error) => setDeleteError(error instanceof Error ? error.message : "Unable to delete template."),
  });

  const templates = templatesQuery.data ?? [];

  if (templatesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-64" />
      </div>
    );
  }

  if (templatesQuery.isError) {
    return <ErrorState message={templatesQuery.error instanceof Error ? templatesQuery.error.message : "Unable to load report templates."} onRetry={() => void templatesQuery.refetch()} />;
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Report Templates"
        description="Create and manage reusable report layouts for Cloud Insure cases."
        action={
          <Button type="button" onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Create Template
          </Button>
        }
      />

      {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
      {createMutation.isError ? <Alert tone="error">{createMutation.error instanceof Error ? createMutation.error.message : "Unable to create template."}</Alert> : null}

      {templates.length ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {templates.map((template) => {
            const templateId = getReportTemplateId(template);
            return (
              <Card key={templateId || template.name} className="min-w-0 rounded-2xl">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="break-words">{template.name}</CardTitle>
                    <p className="mt-1 break-words text-sm text-ink-600">{template.description || "No description provided."}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {template.isDefault ? <Badge tone="solid">Default</Badge> : null}
                    {template.isArchived ? <Badge tone="muted">Archived</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="min-w-0">
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Version</dt>
                      <dd className="mt-1 break-words text-ink-950">{template.version}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Updated</dt>
                      <dd className="mt-1 break-words text-ink-950">{formatDate(template.updatedAt)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Page</dt>
                      <dd className="mt-1 break-words text-ink-950">{template.page.size} / {template.page.orientation}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                      <Link to={`/reports/designer/${encodeURIComponent(templateId)}`}>
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => duplicateMutation.mutate(template)} isLoading={duplicateMutation.isPending}>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Duplicate
                    </Button>
                    <Button type="button" variant="danger" onClick={() => deleteMutation.mutate(templateId)} disabled={!templateId} isLoading={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No report templates yet"
          description="Create a template to design cover pages, configure sections, and generate case reports."
          action={
            <Button type="button" onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Create Template
            </Button>
          }
        />
      )}
    </div>
  );
}
