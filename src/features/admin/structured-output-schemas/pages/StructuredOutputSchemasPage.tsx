import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FilePlus2, PencilLine, Trash2, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { SelectField } from "../../../../components/forms/SelectField";
import { TextField } from "../../../../components/forms/TextField";
import { Alert } from "../../../../components/ui/Alert";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/toast-context";
import { formatDate } from "../../../../lib/dates";
import { AdminPageAccess } from "../../AdminPageAccess";
import { listAdminMasterfileRecords } from "../../adminMasterfile.api";
import { adminMasterfileConfigs } from "../../adminMasterfile.config";
import { getRecordId } from "../../adminPayload.utils";
import { SchemaFieldsPreview } from "../components/SchemaFieldsPreview";
import {
  archiveStructuredOutputSchema,
  getStructuredOutputSchemaFields,
  listStructuredOutputSchemas,
  publishStructuredOutputSchema,
} from "../structuredOutputSchemas.api";
import type { StructuredOutputSchemaStatus } from "../structuredOutputSchemas.types";
import { getStructuredOutputSchemaDatabaseId, getStructuredOutputSchemaId } from "../structuredOutputSchemas.utils";

const statusOptions: Array<{ label: string; value: StructuredOutputSchemaStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export function StructuredOutputSchemasPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StructuredOutputSchemaStatus | "all">("all");
  const [caseTypeFilter, setCaseTypeFilter] = useState("all");
  const [linkedCaseTypeFilter, setLinkedCaseTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fieldsSchemaKey, setFieldsSchemaKey] = useState("");

  const schemasQuery = useQuery({ queryKey: ["admin", "structured-output-schemas"], queryFn: listStructuredOutputSchemas });
  const caseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "caseTypes"],
    queryFn: () => listAdminMasterfileRecords(adminMasterfileConfigs.caseTypes),
  });
  const linkedCaseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "linkedCaseTypes"],
    queryFn: () => listAdminMasterfileRecords(adminMasterfileConfigs.linkedCaseTypes),
  });
  const fieldsQuery = useQuery({
    queryKey: ["admin", "structured-output-schema-fields", fieldsSchemaKey],
    queryFn: () => getStructuredOutputSchemaFields(fieldsSchemaKey),
    enabled: Boolean(fieldsSchemaKey),
  });

  const publishMutation = useMutation({
    mutationFn: publishStructuredOutputSchema,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "structured-output-schemas"] });
      showToast({ tone: "success", title: "Schema published." });
    },
    onError: (error) => showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to publish this schema." }),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveStructuredOutputSchema,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "structured-output-schemas"] });
      showToast({ tone: "success", title: "Schema deleted." });
    },
    onError: (error) => showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to delete this schema." }),
  });

  const caseTypes = caseTypesQuery.data ?? [];
  const linkedCaseTypes = linkedCaseTypesQuery.data ?? [];
  const filteredSchemas = useMemo(() => {
    const schemas = schemasQuery.data ?? [];
    const query = search.trim().toLowerCase();
    return schemas.filter((schema) => {
      if (statusFilter !== "all" && schema.status !== statusFilter) return false;
      if (caseTypeFilter !== "all" && schema.caseType !== caseTypeFilter) return false;
      if (linkedCaseTypeFilter !== "all" && schema.linkedCaseType !== linkedCaseTypeFilter) return false;
      return !query || `${schema.name} ${schema.key}`.toLowerCase().includes(query);
    });
  }, [caseTypeFilter, linkedCaseTypeFilter, schemasQuery.data, search, statusFilter]);

  const getCaseTypeName = (caseTypeId?: string, snapshot?: string) =>
    snapshot || caseTypes.find((item) => getRecordId(item) === caseTypeId)?.name || caseTypeId || "Any";
  const getLinkedCaseTypeName = (linkedCaseTypeId?: string, snapshot?: string) =>
    snapshot || linkedCaseTypes.find((item) => getRecordId(item) === linkedCaseTypeId)?.name || linkedCaseTypeId || "Any";

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Structured Output Schemas"
          description="List, filter, draft, publish, and inspect AI output schemas used by case analysis."
          action={(
            <Button asChild>
              <Link to="/admin/setup/structured-output-schemas/new">
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                New Schema
              </Link>
            </Button>
          )}
        />

        <div className="grid gap-4 rounded-lg border border-ink-200 bg-white p-4 shadow-soft md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StructuredOutputSchemaStatus | "all")} options={statusOptions} />
          <SelectField
            label="Case type"
            value={caseTypeFilter}
            onChange={(event) => setCaseTypeFilter(event.target.value)}
            options={[{ label: "All case types", value: "all" }, ...caseTypes.map((item) => ({ label: item.name, value: getRecordId(item) }))]}
          />
          <SelectField
            label="Linked case type"
            value={linkedCaseTypeFilter}
            onChange={(event) => setLinkedCaseTypeFilter(event.target.value)}
            options={[{ label: "All linked case types", value: "all" }, ...linkedCaseTypes.map((item) => ({ label: item.name, value: getRecordId(item) }))]}
          />
          <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or key" />
        </div>

        {schemasQuery.isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-12" />
            <LoadingSkeleton className="h-80" />
          </div>
        ) : null}

        {schemasQuery.isError ? (
          <ErrorState
            title="Unable to load structured output schemas"
            message={schemasQuery.error instanceof Error ? schemasQuery.error.message : "Structured output schema data could not be loaded."}
            onRetry={() => void schemasQuery.refetch()}
          />
        ) : null}

        {!schemasQuery.isLoading && !schemasQuery.isError && filteredSchemas.length === 0 ? (
          <EmptyState
            title="No schemas found"
            description="Adjust the filters or create a new draft schema."
            action={<Button asChild><Link to="/admin/setup/structured-output-schemas/new">Create schema</Link></Button>}
          />
        ) : null}

        {!schemasQuery.isLoading && !schemasQuery.isError && filteredSchemas.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Case Type</th>
                    <th className="px-4 py-3">Linked Case Type</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {filteredSchemas.map((schema) => {
                    const id = getStructuredOutputSchemaId(schema);
                    const databaseId = getStructuredOutputSchemaDatabaseId(schema);
                    const canMutateSchema = schema.source !== "code" && Boolean(databaseId);
                    return (
                      <tr key={id}>
                        <td className="max-w-xs px-4 py-4 font-medium text-ink-950">{schema.name}</td>
                        <td className="px-4 py-4 font-mono text-xs text-ink-700">{schema.key}</td>
                        <td className="px-4 py-4 text-ink-700">{getCaseTypeName(schema.caseType, schema.caseTypeNameSnapshot || schema.caseTypeName)}</td>
                        <td className="px-4 py-4 text-ink-700">{getLinkedCaseTypeName(schema.linkedCaseType, schema.linkedCaseTypeNameSnapshot || schema.linkedCaseTypeName)}</td>
                        <td className="px-4 py-4 text-ink-700">v{schema.version}</td>
                        <td className="px-4 py-4"><Badge tone={schema.status === "published" ? "outline" : schema.status === "archived" ? "dashed" : "muted"}>{schema.status}</Badge></td>
                        <td className="px-4 py-4"><Badge tone={schema.isActive ? "outline" : "dashed"}>{schema.isActive ? "Active" : "Inactive"}</Badge></td>
                        <td className="px-4 py-4 text-ink-600">{formatDate(schema.updatedAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {canMutateSchema ? (
                              <Button asChild variant="secondary" className="px-3">
                                <Link to={`/admin/setup/structured-output-schemas/${encodeURIComponent(databaseId)}`} aria-label={`Edit ${schema.name}`}>
                                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                                </Link>
                              </Button>
                            ) : null}
                            {canMutateSchema && schema.status === "draft" ? (
                              <Button variant="secondary" className="px-3" disabled={publishMutation.isPending} isLoading={publishMutation.isPending} onClick={() => publishMutation.mutate(databaseId)}>
                                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                            {canMutateSchema ? (
                              <Button
                                variant="danger"
                                className="px-3"
                                aria-label={`Delete ${schema.name}`}
                                disabled={archiveMutation.isPending}
                                isLoading={archiveMutation.isPending}
                                onClick={() => {
                                  if (window.confirm(`Delete ${schema.name}?`)) archiveMutation.mutate(databaseId);
                                }}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            ) : null}
                            <Button variant="secondary" className="px-3" onClick={() => setFieldsSchemaKey(schema.key)}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
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

        {fieldsSchemaKey ? (
          <Card>
            <CardHeader>
              <CardTitle>Fields for {fieldsSchemaKey}</CardTitle>
            </CardHeader>
            <CardContent>
              {fieldsQuery.isLoading ? <LoadingSkeleton className="h-40" /> : null}
              {fieldsQuery.isError ? (
                <Alert tone="error">{fieldsQuery.error instanceof Error ? fieldsQuery.error.message : "Unable to load fields for this schema."}</Alert>
              ) : null}
              {fieldsQuery.data ? <SchemaFieldsPreview fields={fieldsQuery.data} /> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminPageAccess>
  );
}
