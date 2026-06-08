import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { SelectField } from "../../../../components/forms/SelectField";
import { TextareaField } from "../../../../components/forms/TextareaField";
import { Alert } from "../../../../components/ui/Alert";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent } from "../../../../components/ui/Card";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/toast-context";
import { AdminPageAccess } from "../../AdminPageAccess";
import { listAdminMasterfileRecords } from "../../adminMasterfile.api";
import { adminMasterfileConfigs } from "../../adminMasterfile.config";
import { getRecordId } from "../../adminPayload.utils";
import {
  createCaseTypePrompt,
  getCaseTypePrompt,
  getCaseTypePromptId,
  updateCaseTypePrompt,
} from "../caseTypePrompts.api";

type FormState = {
  caseType: string;
  linkedCaseType: string;
  prompt: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  caseType: "",
  linkedCaseType: "",
  prompt: "",
  isActive: true,
};

export function CaseTypePromptEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [caseTypeError, setCaseTypeError] = useState("");
  const [promptError, setPromptError] = useState("");

  const promptQuery = useQuery({
    queryKey: ["admin", "case-type-prompts", id ?? "new"],
    queryFn: () => getCaseTypePrompt(id ?? ""),
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

  useEffect(() => {
    if (!promptQuery.data) {
      if (!isEditing) setForm(emptyForm);
      return;
    }

    setForm({
      caseType: promptQuery.data.caseType || "",
      linkedCaseType: promptQuery.data.linkedCaseType || "",
      prompt: promptQuery.data.prompt || "",
      isActive: promptQuery.data.isActive,
    });
  }, [isEditing, promptQuery.data]);

  const linkedCaseTypeOptions = useMemo(() => {
    const linked = linkedCaseTypesQuery.data ?? [];
    return linked
      .filter((item) => !form.caseType || item.caseType === form.caseType)
      .map((item) => ({ label: item.name, value: getRecordId(item) }));
  }, [form.caseType, linkedCaseTypesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextCaseTypeError = form.caseType.trim() ? "" : "Case type is required.";
      const nextPromptError = form.prompt.trim() ? "" : "Prompt is required.";
      setCaseTypeError(nextCaseTypeError);
      setPromptError(nextPromptError);
      if (nextCaseTypeError || nextPromptError) throw new Error("Please complete the required fields.");

      const payload = {
        caseType: form.caseType,
        linkedCaseType: form.linkedCaseType || null,
        prompt: form.prompt.trim(),
        isActive: form.isActive,
      };

      return isEditing && id ? updateCaseTypePrompt(id, payload) : createCaseTypePrompt(payload);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "case-type-prompts"] });
      showToast({ tone: "success", title: `Case type prompt ${isEditing ? "updated" : "created"}.` });
      const savedId = getCaseTypePromptId(saved) || id;
      navigate(savedId ? `/admin/setup/case-type-prompts/${encodeURIComponent(savedId)}` : "/admin/setup/case-type-prompts", {
        replace: !isEditing,
      });
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to save this prompt." });
    },
  });

  if (isEditing && promptQuery.isLoading) {
    return (
      <AdminPageAccess>
        <div className="space-y-6">
          <LoadingSkeleton className="h-16" />
          <LoadingSkeleton className="h-96" />
        </div>
      </AdminPageAccess>
    );
  }

  if (isEditing && promptQuery.isError) {
    return (
      <AdminPageAccess>
        <ErrorState
          title="Unable to load case type prompt"
          message={promptQuery.error instanceof Error ? promptQuery.error.message : "The selected prompt could not be loaded."}
          onRetry={() => void promptQuery.refetch()}
        />
      </AdminPageAccess>
    );
  }

  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title={isEditing ? "Edit Case Type Prompt" : "New Case Type Prompt"}
          description="Set the OpenAI analysis prompt for a case type and optional linked case type."
          action={(
            <>
              <Button asChild variant="secondary">
                <Link to="/admin/setup/case-type-prompts">Cancel</Link>
              </Button>
              <Button type="button" isLoading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Save
              </Button>
            </>
          )}
        />

        {isEditing ? (
          <Alert tone="info">Case type pairing is locked after creation. Edit the prompt text or active status here.</Alert>
        ) : null}
        {saveMutation.isError ? (
          <Alert tone="error">{saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save this prompt."}</Alert>
        ) : null}

        <Card>
          <CardContent>
            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Case Type"
                  value={form.caseType}
                  error={caseTypeError}
                  disabled={isEditing || caseTypesQuery.isLoading}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, caseType: event.target.value, linkedCaseType: "" }));
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
                <SelectField
                  label="Linked Case Type"
                  value={form.linkedCaseType}
                  disabled={isEditing || linkedCaseTypesQuery.isLoading || !form.caseType}
                  onChange={(event) => setForm((current) => ({ ...current, linkedCaseType: event.target.value }))}
                  options={[
                    { label: linkedCaseTypesQuery.isLoading ? "Loading linked case types..." : "Fallback for this case type", value: "" },
                    ...linkedCaseTypeOptions,
                  ]}
                />
              </div>

              <TextareaField
                label="Prompt"
                value={form.prompt}
                error={promptError}
                rows={16}
                className="font-mono leading-6"
                onChange={(event) => {
                  setForm((current) => ({ ...current, prompt: event.target.value }));
                  if (event.target.value.trim()) setPromptError("");
                }}
              />

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
