import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, UploadCloud } from "lucide-react";
import { SelectField } from "../../../../components/forms/SelectField";
import { TextField } from "../../../../components/forms/TextField";
import { TextareaField } from "../../../../components/forms/TextareaField";
import { Alert } from "../../../../components/ui/Alert";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/toast-context";
import { AdminPageAccess } from "../../AdminPageAccess";
import { listAdminMasterfileRecords } from "../../adminMasterfile.api";
import { adminMasterfileConfigs } from "../../adminMasterfile.config";
import { getRecordId } from "../../adminPayload.utils";
import { JsonSchemaEditor } from "../components/JsonSchemaEditor";
import { SchemaFieldsPreview } from "../components/SchemaFieldsPreview";
import {
  createStructuredOutputSchema,
  getStructuredOutputSchema,
  getStructuredOutputSchemaFields,
  publishStructuredOutputSchema,
  updateStructuredOutputSchema,
} from "../structuredOutputSchemas.api";
import type { SaveStructuredOutputSchemaInput, StructuredOutputSchemaStatus } from "../structuredOutputSchemas.types";
import { getStructuredOutputSchemaId, starterJsonSchema, stringifyJsonSchema } from "../structuredOutputSchemas.utils";

type FormState = {
  name: string;
  key: string;
  description: string;
  version: string;
  caseType: string;
  linkedCaseType: string;
  status: StructuredOutputSchemaStatus;
  isActive: boolean;
  jsonSchemaText: string;
  systemPromptHint: string;
  userPromptHint: string;
};

const emptyForm: FormState = {
  name: "",
  key: "",
  description: "",
  version: "1",
  caseType: "",
  linkedCaseType: "",
  status: "draft",
  isActive: true,
  jsonSchemaText: JSON.stringify(starterJsonSchema, null, 2),
  systemPromptHint: "",
  userPromptHint: "",
};

function parseJsonSchema(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON schema must be an object.");
  return parsed as Record<string, unknown>;
}

function slugifyKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function StructuredOutputSchemaEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [jsonError, setJsonError] = useState("");
  const [formError, setFormError] = useState("");

  const schemaQuery = useQuery({
    queryKey: ["admin", "structured-output-schema", id ?? "new"],
    queryFn: () => getStructuredOutputSchema(id ?? ""),
    enabled: isEditing,
  });
  const caseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "caseTypes"],
    queryFn: () => listAdminMasterfileRecords(adminMasterfileConfigs.caseTypes),
  });
  const linkedCaseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "linkedCaseTypes"],
    queryFn: () => listAdminMasterfileRecords(adminMasterfileConfigs.linkedCaseTypes),
  });
  const fieldsQuery = useQuery({
    queryKey: ["admin", "structured-output-schema-fields", form.key],
    queryFn: () => getStructuredOutputSchemaFields(form.key),
    enabled: Boolean(form.key && isEditing),
  });

  useEffect(() => {
    if (!schemaQuery.data) {
      if (!isEditing) setForm(emptyForm);
      return;
    }

    setForm({
      name: schemaQuery.data.name,
      key: schemaQuery.data.key,
      description: schemaQuery.data.description || "",
      version: String(schemaQuery.data.version || 1),
      caseType: schemaQuery.data.caseType || "",
      linkedCaseType: schemaQuery.data.linkedCaseType || "",
      status: schemaQuery.data.status,
      isActive: schemaQuery.data.isActive,
      jsonSchemaText: stringifyJsonSchema(schemaQuery.data.jsonSchema),
      systemPromptHint: schemaQuery.data.systemPromptHint || "",
      userPromptHint: schemaQuery.data.userPromptHint || "",
    });
  }, [isEditing, schemaQuery.data]);

  const linkedCaseTypeOptions = useMemo(() => {
    const linkedCaseTypes = linkedCaseTypesQuery.data ?? [];
    const filtered = form.caseType ? linkedCaseTypes.filter((item) => !item.caseType || item.caseType === form.caseType) : linkedCaseTypes;
    return filtered.map((item) => ({ label: item.name, value: getRecordId(item) }));
  }, [form.caseType, linkedCaseTypesQuery.data]);
  const isPublished = form.status === "published";

  const buildPayload = (status?: StructuredOutputSchemaStatus): SaveStructuredOutputSchemaInput => {
    if (!form.name.trim()) throw new Error("Name is required.");
    if (!form.key.trim()) throw new Error("Key is required.");
    const version = Number(form.version);
    if (!Number.isFinite(version) || version < 1) throw new Error("Version must be a positive number.");

    return {
      name: form.name.trim(),
      key: form.key.trim(),
      description: form.description.trim(),
      version,
      caseType: form.caseType || undefined,
      linkedCaseType: form.linkedCaseType || undefined,
      status: status ?? form.status,
      isActive: form.isActive,
      jsonSchema: parseJsonSchema(form.jsonSchemaText),
      systemPromptHint: form.systemPromptHint.trim(),
      userPromptHint: form.userPromptHint.trim(),
    };
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      setJsonError("");
      const payload = buildPayload("draft");
      return isEditing && id ? updateStructuredOutputSchema(id, payload) : createStructuredOutputSchema(payload);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "structured-output-schemas"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "structured-output-schema-fields"] });
      showToast({ tone: "success", title: `Schema ${isEditing ? "updated" : "created"}.` });
      navigate(`/admin/setup/structured-output-schemas/${encodeURIComponent(getStructuredOutputSchemaId(saved))}`, { replace: !isEditing });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to save this schema.";
      if (message.toLowerCase().includes("json")) setJsonError(message);
      setFormError(message);
      showToast({ tone: "error", title: message });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      setJsonError("");
      const saved = isEditing && id
        ? await updateStructuredOutputSchema(id, buildPayload("draft"))
        : await createStructuredOutputSchema(buildPayload("draft"));
      return publishStructuredOutputSchema(getStructuredOutputSchemaId(saved));
    },
    onSuccess: (published) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "structured-output-schemas"] });
      showToast({ tone: "success", title: "Schema published." });
      navigate(`/admin/setup/structured-output-schemas/${encodeURIComponent(getStructuredOutputSchemaId(published))}`, { replace: true });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to publish this schema.";
      if (message.toLowerCase().includes("json")) setJsonError(message);
      setFormError(message);
      showToast({ tone: "error", title: message });
    },
  });

  if (isEditing && schemaQuery.isLoading) {
    return <AdminPageAccess><div className="space-y-6"><LoadingSkeleton className="h-16" /><LoadingSkeleton className="h-[40rem]" /></div></AdminPageAccess>;
  }

  if (isEditing && schemaQuery.isError) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Unable to load schema"
          message={schemaQuery.error instanceof Error ? schemaQuery.error.message : "This structured output schema could not be loaded."}
          onRetry={() => void schemaQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title={isEditing ? "Edit Structured Output Schema" : "New Structured Output Schema"}
          description="Draft JSON schemas, link them to case setup data, and publish active versions for analysis."
          action={(
            <>
              <Button asChild variant="secondary"><Link to="/admin/setup/structured-output-schemas">Cancel</Link></Button>
              <Button type="button" isLoading={saveMutation.isPending} disabled={isPublished} onClick={() => saveMutation.mutate()}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Draft
              </Button>
              <Button type="button" isLoading={publishMutation.isPending} disabled={isPublished} onClick={() => publishMutation.mutate()}>
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Publish
              </Button>
            </>
          )}
        />

        {isPublished ? <Alert tone="info">Published schemas cannot be edited directly. Create a new draft version if changes are needed.</Alert> : null}
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader><CardTitle>Schema Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Name"
                    value={form.name}
                    disabled={isPublished}
                    onChange={(event) => {
                      const name = event.target.value;
                      setForm((current) => ({ ...current, name, key: current.key || slugifyKey(name) }));
                    }}
                  />
                  <TextField
                    label="Key"
                    value={form.key}
                    disabled={isPublished || isEditing}
                    onChange={(event) => setForm((current) => ({ ...current, key: slugifyKey(event.target.value) }))}
                  />
                </div>
                <TextareaField label="Description" value={form.description} disabled={isPublished} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                <div className="grid gap-5 md:grid-cols-3">
                  <TextField label="Version" type="number" min={1} step={1} value={form.version} disabled={isPublished} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} />
                  <SelectField
                    label="Case Type"
                    value={form.caseType}
                    disabled={isPublished || caseTypesQuery.isLoading}
                    onChange={(event) => setForm((current) => ({ ...current, caseType: event.target.value, linkedCaseType: "" }))}
                    options={[{ label: "Any case type", value: "" }, ...(caseTypesQuery.data ?? []).map((item) => ({ label: item.name, value: getRecordId(item) }))]}
                  />
                  <SelectField
                    label="Linked Case Type"
                    value={form.linkedCaseType}
                    disabled={isPublished || linkedCaseTypesQuery.isLoading}
                    onChange={(event) => setForm((current) => ({ ...current, linkedCaseType: event.target.value }))}
                    options={[{ label: "Any linked case type", value: "" }, ...linkedCaseTypeOptions]}
                  />
                </div>
                <label className="flex items-center gap-3 rounded-md border border-ink-200 bg-ink-50 px-3 py-3 text-sm font-medium text-ink-800">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={isPublished}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-ink-300 text-ink-950 focus:ring-ink-200"
                  />
                  Active
                </label>
                <JsonSchemaEditor
                  value={form.jsonSchemaText}
                  error={jsonError}
                  disabled={isPublished}
                  onChange={(value) => setForm((current) => ({ ...current, jsonSchemaText: value }))}
                  onError={setJsonError}
                />
                <TextareaField label="System prompt hint" value={form.systemPromptHint} disabled={isPublished} onChange={(event) => setForm((current) => ({ ...current, systemPromptHint: event.target.value }))} />
                <TextareaField label="User prompt hint" value={form.userPromptHint} disabled={isPublished} onChange={(event) => setForm((current) => ({ ...current, userPromptHint: event.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fields Preview</CardTitle></CardHeader>
            <CardContent>
              {fieldsQuery.isLoading ? <LoadingSkeleton className="h-40" /> : null}
              {fieldsQuery.isError ? <Alert tone="error">{fieldsQuery.error instanceof Error ? fieldsQuery.error.message : "Unable to load generated fields."}</Alert> : null}
              <SchemaFieldsPreview fields={fieldsQuery.data ?? schemaQuery.data?.fields ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageAccess>
  );
}
