import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { SelectField } from "../../../components/forms/SelectField";
import { TextField } from "../../../components/forms/TextField";
import { TextareaField } from "../../../components/forms/TextareaField";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/ui/toast-context";
import { AdminPageAccess } from "../AdminPageAccess";
import { AdminIntakeFieldsEditor } from "../AdminIntakeFieldsEditor";
import {
  createAdminMasterfileRecord,
  getAdminMasterfileRecord,
  listAdminMasterfileRecords,
  updateAdminMasterfileRecord,
} from "../adminMasterfile.api";
import type { IntakeFieldDefinition } from "../adminMasterfile.api";
import { adminMasterfileConfigs, getAdminMasterfileConfig, type AdminMasterfileResourceKey } from "../adminMasterfile.config";
import { getRecordId } from "../adminPayload.utils";

type AdminMasterfileFormPageProps = {
  resourceKey: AdminMasterfileResourceKey;
};

type FormState = {
  name: string;
  description: string;
  isActive: boolean;
  caseType: string;
  intakeFields: IntakeFieldDefinition[];
  productLine: string;
  workflowType: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  isActive: true,
  caseType: "",
  intakeFields: [],
  productLine: "other",
  workflowType: "other",
};

export function AdminMasterfileFormPage({ resourceKey }: AdminMasterfileFormPageProps) {
  const config = getAdminMasterfileConfig(resourceKey);
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [nameError, setNameError] = useState("");
  const [caseTypeError, setCaseTypeError] = useState("");
  const [intakeFieldsError, setIntakeFieldsError] = useState("");
  const supportsIntakeFields = config.resourceKey === "caseTypes" || config.resourceKey === "linkedCaseTypes";

  const recordQuery = useQuery({
    queryKey: ["admin", "masterfiles", config.resourceKey, id ?? "new"],
    queryFn: () => getAdminMasterfileRecord(config, id ?? ""),
    enabled: isEditing,
  });

  const caseTypesQuery = useQuery({
    queryKey: ["admin", "masterfiles", "caseTypes"],
    queryFn: () => listAdminMasterfileRecords(adminMasterfileConfigs.caseTypes),
    enabled: Boolean(config.requiresCaseType),
  });

  useEffect(() => {
    if (!recordQuery.data) {
      if (!isEditing) setForm(emptyForm);
      return;
    }

    setForm({
      name: recordQuery.data.name || "",
      description: recordQuery.data.description || "",
      isActive: recordQuery.data.isActive !== false,
      caseType: recordQuery.data.caseType || "",
      intakeFields: recordQuery.data.intakeFields || [],
      productLine: recordQuery.data.productLine || "other",
      workflowType: recordQuery.data.workflowType || "other",
    });
  }, [isEditing, recordQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextNameError = form.name.trim() ? "" : "Name is required.";
      const nextCaseTypeError = config.requiresCaseType && !form.caseType.trim() ? "Case type is required." : "";
      const invalidIntakeField = form.intakeFields.find((field) => !field.key.trim() || !field.label.trim() || (field.type === "select" && field.options.length === 0));
      const duplicateIntakeKeys = new Set(form.intakeFields.map((field) => field.key.trim()).filter(Boolean)).size !== form.intakeFields.map((field) => field.key.trim()).filter(Boolean).length;
      const nextIntakeFieldsError = invalidIntakeField
        ? "Each intake question needs a label, data key, and options for select lists."
        : duplicateIntakeKeys ? "Each intake question must use a unique data key." : "";
      setNameError(nextNameError);
      setCaseTypeError(nextCaseTypeError);
      setIntakeFieldsError(nextIntakeFieldsError);
      if (nextNameError || nextCaseTypeError || nextIntakeFieldsError) throw new Error("Please complete the required fields.");

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      };
      if (config.requiresCaseType) payload.caseType = form.caseType;
      if (config.resourceKey === "caseTypes") payload.productLine = form.productLine;
      if (config.resourceKey === "linkedCaseTypes") payload.workflowType = form.workflowType;
      if (supportsIntakeFields) payload.intakeFields = form.intakeFields.map((field) => ({ ...field, key: field.key.trim(), label: field.label.trim(), helpText: field.helpText.trim(), options: field.options.map((option) => option.trim()).filter(Boolean) }));

      return isEditing && id
        ? updateAdminMasterfileRecord(config, id, payload)
        : createAdminMasterfileRecord(config, payload);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "masterfiles", config.resourceKey] });
      showToast({ tone: "success", title: `${config.singularLabel} ${isEditing ? "updated" : "created"}.` });
      const savedId = getRecordId(saved) || id;
      navigate(savedId ? `/admin/setup/${config.routePath}/${encodeURIComponent(savedId)}` : `/admin/setup/${config.routePath}`, {
        replace: !isEditing,
      });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : `Unable to save this ${config.singularLabel.toLowerCase()}.` });
    },
  });

  if (isEditing && recordQuery.isLoading) {
    return (
      <AdminPageAccess>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16" />
          <LoadingSkeleton className="h-80" />
        </div>
      </AdminPageAccess>
    );
  }

  if (isEditing && recordQuery.isError) {
    return (
      <AdminPageAccess>
        <ErrorState
          title={`Unable to load ${config.singularLabel.toLowerCase()}`}
          message={recordQuery.error instanceof Error ? recordQuery.error.message : "The selected record could not be loaded."}
          onRetry={() => void recordQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title={isEditing ? `Edit ${config.singularLabel}` : `New ${config.singularLabel}`}
          description={config.description}
          action={(
            <>
              <Button asChild variant="secondary">
                <Link to={`/admin/setup/${config.routePath}`}>Cancel</Link>
              </Button>
              <Button type="button" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save
              </Button>
            </>
          )}
        />

        {saveMutation.isError ? (
          <Alert tone="error">{saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save this record."}</Alert>
        ) : null}

        <Card>
          <CardContent>
            <div className="grid gap-5">
              <TextField
                label="Name"
                value={form.name}
                error={nameError}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  if (event.target.value.trim()) setNameError("");
                }}
              />

              {config.requiresCaseType ? (
                <SelectField
                  label="Case Type"
                  value={form.caseType}
                  error={caseTypeError}
                  disabled={caseTypesQuery.isLoading}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, caseType: event.target.value }));
                    if (event.target.value.trim()) setCaseTypeError("");
                  }}
                  options={[
                    { label: caseTypesQuery.isLoading ? "Loading case types..." : "Select case type", value: "" },
                    ...(caseTypesQuery.data ?? []).map((caseType) => ({
                      label: caseType.name,
                      value: getRecordId(caseType),
                    })),
                  ]}
                />
              ) : null}

              {config.resourceKey === "caseTypes" ? (
                <SelectField
                  label="Product line"
                  value={form.productLine}
                  onChange={(event) => setForm((current) => ({ ...current, productLine: event.target.value }))}
                  options={[
                    { label: "Personal lines", value: "personal" },
                    { label: "Commercial lines", value: "commercial" },
                    { label: "Sectional title", value: "sectional_title" },
                    { label: "Other / custom", value: "other" },
                  ]}
                />
              ) : null}

              {config.resourceKey === "linkedCaseTypes" ? (
                <SelectField
                  label="Analysis workflow"
                  value={form.workflowType}
                  onChange={(event) => setForm((current) => ({ ...current, workflowType: event.target.value }))}
                  options={[
                    { label: "Comparison", value: "comparison" },
                    { label: "Policy analysis", value: "policy_analysis" },
                    { label: "Record of Advice", value: "record_of_advice" },
                    { label: "AGM Pack", value: "agm_pack" },
                  ]}
                />
              ) : null}

              <TextareaField
                label="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />

              {supportsIntakeFields ? (
                <AdminIntakeFieldsEditor
                  fields={form.intakeFields}
                  error={intakeFieldsError}
                  onChange={(intakeFields) => {
                    setForm((current) => ({ ...current, intakeFields }));
                    setIntakeFieldsError("");
                  }}
                />
              ) : null}

              <label className="flex items-center gap-3 rounded-md border border-ink-200 bg-ink-50 px-3 py-3 text-sm font-medium text-ink-800">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-ink-300 text-ink-950 focus:ring-ink-200"
                />
                Active
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageAccess>
  );
}
