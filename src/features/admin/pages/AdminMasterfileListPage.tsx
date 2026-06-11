import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, FilePlus2, PencilLine } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/ui/toast-context";
import { formatDate } from "../../../lib/dates";
import { AdminPageAccess } from "../AdminPageAccess";
import { archiveAdminMasterfileRecord, listAdminMasterfileRecords } from "../adminMasterfile.api";
import { getAdminMasterfileConfig, type AdminMasterfileResourceKey } from "../adminMasterfile.config";
import { getRecordId } from "../adminPayload.utils";

type AdminMasterfileListPageProps = {
  resourceKey: AdminMasterfileResourceKey;
};

export function AdminMasterfileListPage({ resourceKey }: AdminMasterfileListPageProps) {
  const config = getAdminMasterfileConfig(resourceKey);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const recordsQuery = useQuery({
    queryKey: ["admin", "masterfiles", config.resourceKey],
    queryFn: () => listAdminMasterfileRecords(config),
  });

  const caseTypesConfig = getAdminMasterfileConfig("caseTypes");
  const caseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "caseTypes", "lookup"],
    queryFn: () => listAdminMasterfileRecords(caseTypesConfig),
    enabled: Boolean(config.requiresCaseType),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveAdminMasterfileRecord(config, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "masterfiles", config.resourceKey] });
      showToast({ tone: "success", title: `${config.singularLabel} archived.` });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : `Unable to archive this ${config.singularLabel.toLowerCase()}.` });
    },
  });

  const records = recordsQuery.data ?? [];
  const caseTypeNameById = useMemo(() => {
    return new Map((caseTypesQuery.data ?? []).map((caseType) => [getRecordId(caseType), caseType.name]));
  }, [caseTypesQuery.data]);

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title={config.label}
          description={config.description}
          action={(
            <Button asChild>
              <Link to={`/admin/setup/${config.routePath}/new`}>
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                New
              </Link>
            </Button>
          )}
        />

        {recordsQuery.isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-12" />
            <LoadingSkeleton className="h-72" />
          </div>
        ) : null}

        {recordsQuery.isError ? (
          <ErrorState
            title={`Unable to load ${config.label.toLowerCase()}`}
            message={recordsQuery.error instanceof Error ? recordsQuery.error.message : "The admin masterfile data could not be loaded."}
            onRetry={() => void recordsQuery.refetch()}
          />
        ) : null}

        {!recordsQuery.isLoading && !recordsQuery.isError && records.length === 0 ? (
          <EmptyState
            title={`No ${config.label.toLowerCase()} yet`}
            description={`Create the first ${config.singularLabel.toLowerCase()} to make it available in admin setup.`}
            action={(
              <Button asChild>
                <Link to={`/admin/setup/${config.routePath}/new`}>Create {config.singularLabel}</Link>
              </Button>
            )}
          />
        ) : null}

        {!recordsQuery.isLoading && !recordsQuery.isError && records.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
            {archiveMutation.isError ? (
              <Alert tone="error" className="m-4">
                {archiveMutation.error instanceof Error ? archiveMutation.error.message : "Unable to archive this record."}
              </Alert>
            ) : null}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    {config.requiresCaseType ? <th className="px-4 py-3">Case Type</th> : null}
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {records.map((record) => {
                    const id = getRecordId(record);
                    const caseTypeName = record.caseTypeName || (record.caseType ? caseTypeNameById.get(record.caseType) : "") || "None";
                    return (
                      <tr key={id || record.name}>
                        <td className="max-w-xs px-4 py-4 font-medium text-ink-950">{record.name || "Untitled"}</td>
                        {config.requiresCaseType ? <td className="px-4 py-4 text-ink-700">{caseTypeName}</td> : null}
                        <td className="max-w-md px-4 py-4 text-ink-600">{record.description || "No description provided."}</td>
                        <td className="px-4 py-4">
                          <Badge tone={record.isActive === false ? "dashed" : "outline"}>{record.isActive === false ? "Inactive" : "Active"}</Badge>
                        </td>
                        <td className="px-4 py-4 text-ink-600">{formatDate(record.updatedAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="secondary" className="px-3">
                              <Link to={`/admin/setup/${config.routePath}/${encodeURIComponent(id)}`} aria-label={`Edit ${record.name}`}>
                                <PencilLine className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            <Button
                              variant="secondary"
                              className="px-3"
                              aria-label={`Archive ${record.name}`}
                              disabled={!id || archiveMutation.isPending}
                              isLoading={archiveMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Archive ${record.name || config.singularLabel}?`)) archiveMutation.mutate(id);
                              }}
                            >
                              <Archive className="h-4 w-4" aria-hidden="true" />
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
        ) : null}
      </div>
    </AdminPageAccess>
  );
}
