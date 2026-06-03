import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Paperclip, Save, Upload as UploadIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { TextareaField } from "../../components/forms/TextareaField";
import { TextField } from "../../components/forms/TextField";
import { useToast } from "../../components/ui/toast-context";
import { ApiError } from "../../lib/api";
import {
  createUserCase,
  getUserCaseTypes,
  getUserEntityTypes,
  getUserLinkedCaseTypes,
  uploadCaseFile,
  type CaseLookupOption,
} from "./cases.api";
import { createCaseSchema, type CaseFileMetadata, type CreateCaseInput } from "./cases.schemas";
import { getCaseId } from "./cases.utils";

const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
]);

const steps = [
  {
    title: "Case setup",
    description: "Choose the case structure",
  },
  {
    title: "Details",
    description: "Add context and notes",
  },
  {
    title: "Files",
    description: "Attach supporting documents",
  },
];

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isAllowedFile(file: File) {
  return file.type.startsWith("image/") || ALLOWED_MIME_TYPES.has(file.type);
}

function validateIncomingFiles(existingFiles: File[], incomingFiles: File[]) {
  const accepted: File[] = [];
  const rejected: string[] = [];
  const existingTotal = existingFiles.reduce((sum, file) => sum + file.size, 0);
  let nextTotal = existingTotal;

  for (const file of incomingFiles) {
    if (existingFiles.length + accepted.length >= MAX_FILES) {
      rejected.push(`You can upload up to ${MAX_FILES} files.`);
      continue;
    }

    if (!isAllowedFile(file)) {
      rejected.push(`${file.name} is not an allowed file type.`);
      continue;
    }

    if (file.size > MAX_FILE_BYTES) {
      rejected.push(`${file.name} is larger than 10 MB.`);
      continue;
    }

    if (nextTotal + file.size > MAX_TOTAL_BYTES) {
      rejected.push("Files cannot exceed 25 MB total.");
      continue;
    }

    accepted.push(file);
    nextTotal += file.size;
  }

  return { accepted, rejected };
}

function StepIndicator({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <button
            key={step.title}
            type="button"
            onClick={() => onStepClick(index)}
            className={[
              "rounded-lg border p-4 text-left transition",
              isActive ? "border-ink-950 bg-white shadow-sm" : isComplete ? "border-ink-300 bg-white" : "border-ink-200 bg-ink-50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  isActive || isComplete ? "border-ink-950 bg-ink-950 text-white" : "border-ink-300 bg-white text-ink-600",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-950">{step.title}</p>
                <p className="mt-0.5 text-xs text-ink-600">{step.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  placeholder,
  isLoading,
  error,
  emptyText,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: CaseLookupOption[];
  placeholder: string;
  isLoading?: boolean;
  error?: string;
  emptyText: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-950">{label}</label>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-600">
          <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading...
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-600">{emptyText}</div>
      ) : (
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function CaseCreateForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateCaseInput>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      caseTitle: "",
      description: "",
      notes: "",
      caseTypeId: "",
      linkedCaseTypeId: "",
      entityTypeId: "",
      incidentDate: "",
      policyNumber: "",
      claimantFirstName: "",
      claimantLastName: "",
      claimantEmail: "",
      claimantPhone: "",
    },
  });

  const caseTypeId = watch("caseTypeId");
  const linkedCaseTypeId = watch("linkedCaseTypeId");
  const entityTypeId = watch("entityTypeId");
  const caseTitle = watch("caseTitle");

  const caseTypesQuery = useQuery({
    queryKey: ["case-lookups", "case-types"],
    queryFn: async () => (await getUserCaseTypes()).filter((item) => item.isActive),
  });

  const selectedCaseType = useMemo(
    () => caseTypesQuery.data?.find((option) => option.id === caseTypeId) || null,
    [caseTypesQuery.data, caseTypeId],
  );

  const requiresEntityType = Boolean(selectedCaseType?.sectionalType);

  const linkedCaseTypesQuery = useQuery({
    queryKey: ["case-lookups", "linked-case-types", caseTypeId],
    enabled: Boolean(caseTypeId),
    queryFn: async () => (await getUserLinkedCaseTypes(caseTypeId)).filter((item) => item.isActive),
  });

  const selectedLinkedCaseType = useMemo(
    () => linkedCaseTypesQuery.data?.find((option) => option.id === linkedCaseTypeId) || null,
    [linkedCaseTypesQuery.data, linkedCaseTypeId],
  );

  const entityTypesQuery = useQuery({
    queryKey: ["case-lookups", "entity-types"],
    enabled: requiresEntityType,
    queryFn: async () => (await getUserEntityTypes()).filter((item) => item.isActive),
  });

  const selectedEntityType = useMemo(
    () => entityTypesQuery.data?.find((option) => option.id === entityTypeId) || null,
    [entityTypesQuery.data, entityTypeId],
  );

  const canProceedFromSetup =
    Boolean(caseTitle?.trim()) &&
    Boolean(caseTypeId) &&
    Boolean(linkedCaseTypeId) &&
    (!requiresEntityType || Boolean(entityTypeId)) &&
    !caseTypesQuery.isLoading &&
    !linkedCaseTypesQuery.isLoading &&
    !entityTypesQuery.isLoading;

  const mutation = useMutation({
    mutationFn: async (values: CreateCaseInput) => {
      const files: CaseFileMetadata[] = [];

      for (const file of uploadedFiles) {
        setUploadingFileName(file.name);
        files.push(await uploadCaseFile(file));
      }

      setUploadingFileName(null);

      return createUserCase({
        ...values,
        entityTypeId: selectedEntityType ? selectedEntityType.id : undefined,
        files,
      });
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["cases", "mine"] });
      showToast({ tone: "success", title: "Case submitted successfully." });

      const id = getCaseId(response);
      reset();
      setUploadedFiles([]);

      navigate(id ? `/cases/${encodeURIComponent(id)}` : "/cases", {
        replace: true,
      });
    },
    onError: (error) => {
      setUploadingFileName(null);
      showToast({
        tone: "error",
        title: error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Unable to create the case right now.",
      });
    },
  });

  function resetLinkedAndEntityValues() {
    setValue("linkedCaseTypeId", "");
    setValue("entityTypeId", "");
  }

  function appendFiles(files: File[]) {
    const { accepted, rejected } = validateIncomingFiles(uploadedFiles, files);

    if (rejected.length > 0) {
      showToast({ tone: "error", title: rejected[0] });
    }

    if (accepted.length > 0) {
      setUploadedFiles((previous) => [...previous, ...accepted]);
    }
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    appendFiles(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function handleDrag(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.length) {
      appendFiles(Array.from(event.dataTransfer.files));
    }
  }

  async function goNext() {
    if (currentStep === 0) {
      const isValid = await trigger(["caseTitle", "caseTypeId", "linkedCaseTypeId"]);

      if (!isValid || !canProceedFromSetup) {
        showToast({ tone: "error", title: "Complete the required case setup fields first." });
        return;
      }

      if (requiresEntityType && !entityTypeId) {
        showToast({ tone: "error", title: "Please select an entity type." });
        return;
      }
    }

    if (currentStep === 1) {
      const isValid = await trigger(["description"]);

      if (!isValid) {
        showToast({ tone: "error", title: "Add the case description before continuing." });
        return;
      }
    }

    setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  }

  function onSubmit(values: CreateCaseInput) {
    if (!selectedCaseType) {
      showToast({ tone: "error", title: "Please select a case type." });
      setCurrentStep(0);
      return;
    }

    if (!selectedLinkedCaseType) {
      showToast({ tone: "error", title: "Please select a linked case type." });
      setCurrentStep(0);
      return;
    }

    if (requiresEntityType && !selectedEntityType) {
      showToast({ tone: "error", title: "Please select an entity type." });
      setCurrentStep(0);
      return;
    }

    mutation.mutate(values);
  }

  const submitFinalCase = handleSubmit(onSubmit);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {mutation.error ? (
        <Alert tone="error">{mutation.error instanceof ApiError ? mutation.error.message : "Unable to create the case right now."}</Alert>
      ) : null}

      <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      {currentStep === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Case setup</CardTitle>
            <p className="mt-1 text-sm text-ink-600">Choose the case structure before adding details and files.</p>
          </CardHeader>

          <CardContent className="space-y-5">
            <TextField label="Case title" autoComplete="off" error={errors.caseTitle?.message} {...register("caseTitle")} />

            <SelectBox
              label="Case type *"
              value={caseTypeId}
              options={caseTypesQuery.data || []}
              placeholder="Select a case type"
              emptyText="No case types available."
              isLoading={caseTypesQuery.isLoading}
              error={
                caseTypesQuery.error instanceof ApiError
                  ? caseTypesQuery.error.message
                  : caseTypesQuery.error
                    ? "Failed to load case types."
                    : errors.caseTypeId?.message
              }
              onChange={(value) => {
                setValue("caseTypeId", value, { shouldValidate: true });
                resetLinkedAndEntityValues();
              }}
            />

            <SelectBox
              label="Linked case type *"
              value={linkedCaseTypeId}
              options={linkedCaseTypesQuery.data || []}
              placeholder="Select a linked case type"
              emptyText={caseTypeId ? "No linked case types found for the selected case type." : "Select a case type first."}
              disabled={!caseTypeId}
              isLoading={linkedCaseTypesQuery.isLoading}
              error={
                linkedCaseTypesQuery.error instanceof ApiError
                  ? linkedCaseTypesQuery.error.message
                  : linkedCaseTypesQuery.error
                    ? "Failed to load linked case types."
                    : errors.linkedCaseTypeId?.message
              }
              onChange={(value) => {
                setValue("linkedCaseTypeId", value, { shouldValidate: true });
              }}
            />

            {requiresEntityType ? (
              <SelectBox
                label="Entity type *"
                value={entityTypeId || ""}
                options={entityTypesQuery.data || []}
                placeholder="Select an entity type"
                emptyText="No entity types available."
                isLoading={entityTypesQuery.isLoading}
                error={
                  entityTypesQuery.error instanceof ApiError
                    ? entityTypesQuery.error.message
                    : entityTypesQuery.error
                      ? "Failed to load entity types."
                      : errors.entityTypeId?.message
                }
                onChange={(value) => {
                  setValue("entityTypeId", value, { shouldValidate: true });
                }}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <p className="mt-1 text-sm text-ink-600">Add description and notes for the support team.</p>
          </CardHeader>

          <CardContent className="space-y-5">
            <TextareaField label="Description" rows={5} error={errors.description?.message} {...register("description")} />
            <TextareaField label="Notes" rows={4} error={errors.notes?.message} {...register("notes")} />

            <Card>
              <CardHeader>
                <CardTitle>What we&apos;ll submit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Title</p>
                    <p className="mt-1 text-sm text-ink-950">{caseTitle || "Not set yet"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Case type</p>
                    <p className="mt-1 text-sm text-ink-950">{selectedCaseType?.label || "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Linked type</p>
                    <p className="mt-1 text-sm text-ink-950">{selectedLinkedCaseType?.label || "Not selected"}</p>
                  </div>
                  {requiresEntityType ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Entity type</p>
                      <p className="mt-1 text-sm text-ink-950">{selectedEntityType?.label || "Not selected"}</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <p className="mt-1 text-sm text-ink-600">Attach supporting documents. You can submit without files.</p>
          </CardHeader>

          <CardContent className="space-y-5">
            <div
              className={["rounded-lg border-2 border-dashed px-6 py-8 transition", dragActive ? "border-ink-950 bg-white" : "border-ink-300 bg-ink-50"].join(" ")}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="create-case-upload-input"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                hidden
                onChange={handleFileInputChange}
              />

              <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
                <div className="rounded-full border border-ink-200 bg-white p-3">
                  <UploadIcon className="h-5 w-5 text-ink-950" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-base font-semibold text-ink-950">Upload supporting documents</p>
                  <p className="mt-1 text-sm text-ink-600">Up to {MAX_FILES} files, 10 MB each, and 25 MB total.</p>
                </div>

                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Click to browse
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-950">{file.name}</p>
                        <p className="text-xs text-ink-600">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setUploadedFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">
                No files attached yet. You can still create the case without attachments.
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Final check before submission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Case</p>
                    <p className="mt-1 text-sm text-ink-950">{caseTitle || "Untitled case"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Files</p>
                    <p className="mt-1 text-sm text-ink-950">{uploadedFiles.length} attached</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Case type</p>
                    <p className="mt-1 text-sm text-ink-950">{selectedCaseType?.label || "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Linked type</p>
                    <p className="mt-1 text-sm text-ink-950">{selectedLinkedCaseType?.label || "Not selected"}</p>
                  </div>
                  {requiresEntityType ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Entity type</p>
                      <p className="mt-1 text-sm text-ink-950">{selectedEntityType?.label || "Not selected"}</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-ink-200 bg-ink-100/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div>
            {currentStep > 0 ? (
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate("/cases")}>
              Cancel
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" isLoading={mutation.isPending} onClick={() => void submitFinalCase()}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {uploadingFileName ? `Uploading ${uploadingFileName}` : mutation.isPending ? "Creating..." : "Create Case"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
