import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileCheck2, FileSearch, GitCompareArrows, Loader, Paperclip, Presentation, Save, ShieldCheck, Upload as UploadIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { createCaseSchema, type CaseFileMetadata, type CreateCaseInput, type IntakeFieldDefinition } from "./cases.schemas";
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

const productGuidance = {
  comparison: {
    eyebrow: "Policy comparison",
    title: "Compare cover on equal terms",
    description: "Upload each insurer option so premiums, sums insured, excesses, exclusions, and material differences can be assessed side by side.",
    evidence: ["Two or more policy schedules or quotations", "Applicable policy wordings", "Current or renewal schedule where relevant"],
    icon: GitCompareArrows,
  },
  policy_analysis: {
    eyebrow: "Policy analysis",
    title: "Turn policy wording into clear advice",
    description: "The analysis reviews insured sections, uninsured exposures, exclusions, conditions, limits, and practical recommendations.",
    evidence: ["Full policy schedule", "Policy wording and endorsements", "Latest client or risk information"],
    icon: FileSearch,
  },
  record_of_advice: {
    eyebrow: "Record of advice",
    title: "Create an advice trail that stands up to review",
    description: "The output connects client needs, policy evidence, material disclosures, alternatives considered, recommendations, and the reasons behind the advice.",
    evidence: ["Client needs analysis or fact find", "Recommended policy schedule and wording", "Alternative quotations and adviser notes"],
    icon: FileCheck2,
  },
  agm_pack: {
    eyebrow: "Sectional title AGM pack",
    title: "Prepare trustees and owners for the meeting",
    description: "The pack turns scheme insurance evidence into agenda-ready risks, resolutions, action items, section summaries, and replacement-value guidance.",
    evidence: ["Current policy schedule and wording", "Latest valuation and claims history", "AGM agenda, prior minutes, and trustee notes"],
    icon: Presentation,
  },
  sectional_title: {
    eyebrow: "Sectional title",
    title: "Review the scheme as a connected risk",
    description: "Scheme-specific review covers buildings, participation quota, replacement values, liability, fidelity, machinery, geysers, SASRIA, and trustee exposures.",
    evidence: ["Scheme policy schedule and wording", "Latest valuation and replacement-value schedule", "Participation quota or unit schedule"],
    icon: Building2,
  },
} as const;

function ProductPathPanel({ caseType, linkedType }: { caseType: CaseLookupOption | null; linkedType: CaseLookupOption | null }) {
  const key = linkedType?.workflowType === "comparison" || linkedType?.label.toLowerCase().includes("comparison")
      ? "comparison"
      : linkedType?.workflowType === "policy_analysis" || linkedType?.label.toLowerCase().includes("policy analysis")
        ? "policy_analysis"
        : linkedType?.workflowType === "record_of_advice" || linkedType?.label.toLowerCase().includes("record of advice")
          ? "record_of_advice"
          : linkedType?.workflowType === "agm_pack" || linkedType?.label.toLowerCase().includes("agm")
            ? "agm_pack"
            : caseType?.productLine === "sectional_title" || caseType?.sectionalType
              ? "sectional_title"
              : null;
  if (!key) return null;
  const guidance = productGuidance[key];
  const Icon = guidance.icon;

  return (
    <aside className="overflow-hidden rounded-[1.75rem] border border-ink-950 bg-ink-950 text-white shadow-[0_24px_60px_rgba(17,17,17,0.14)]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">{guidance.eyebrow}</p>
          </div>
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{guidance.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{guidance.description}</p>
        </div>
        <div className="rounded-[1.35rem] bg-white p-4 text-ink-950">
          <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Best evidence set</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            {guidance.evidence.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-950" />{item}</li>)}
          </ul>
        </div>
      </div>
    </aside>
  );
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
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <button
            key={step.title}
            type="button"
            onClick={() => onStepClick(index)}
            className={[
              "rounded-xl border px-2 py-3 text-left transition sm:px-3",
              isActive ? "border-ink-950 bg-white shadow-[0_14px_30px_rgba(17,17,17,0.06)]" : isComplete ? "border-ink-300 bg-white" : "border-ink-200 bg-white/70",
            ].join(" ")}
          >
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold",
                  isActive || isComplete ? "border-ink-950 bg-ink-950 text-white" : "border-ink-300 bg-white text-ink-600",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-xs font-semibold leading-tight text-ink-950 sm:text-sm">{step.title}</p>
                <p className="mt-0.5 hidden text-xs text-ink-600 sm:block">{step.description}</p>
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
  const inputId = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-950">{label}</label>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white p-3 text-sm text-ink-600">
          <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading...
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-600">{emptyText}</div>
      ) : (
        <select
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-ink-300 bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500"
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
  const [intakeData, setIntakeData] = useState<Record<string, unknown>>({});

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

  const requiresEntityType = Boolean(selectedCaseType?.sectionalType || selectedCaseType?.productLine === "sectional_title");

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

  const intakeFields = useMemo(() => {
    const fields = new Map<string, IntakeFieldDefinition>();
    for (const field of selectedCaseType?.intakeFields || []) fields.set(field.key, field);
    for (const field of selectedLinkedCaseType?.intakeFields || []) fields.set(field.key, field);
    return [...fields.values()];
  }, [selectedCaseType, selectedLinkedCaseType]);

  useEffect(() => {
    setIntakeData({});
  }, [caseTypeId, linkedCaseTypeId]);

  function validateIntakeFields() {
    const missing = intakeFields.find((field) => field.required && (intakeData[field.key] === undefined || intakeData[field.key] === null || intakeData[field.key] === ""));
    if (missing) {
      showToast({ tone: "error", title: `${missing.label} is required.` });
      return false;
    }
    return true;
  }

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
        intakeData,
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

      if (!validateIntakeFields()) return;
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

    if (!validateIntakeFields()) {
      setCurrentStep(1);
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

      <div className="surface-card px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">Submission progress</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-ink-950">{steps[currentStep]?.title}</h2>
          </div>
          <p className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-4">
          <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      </div>

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

            <ProductPathPanel caseType={selectedCaseType} linkedType={selectedLinkedCaseType} />

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

            {intakeFields.length > 0 ? (
              <div className="rounded-[1.5rem] border border-ink-200 bg-ink-50 p-5">
                <p className="text-sm font-semibold text-ink-950">Case-specific information</p>
                <p className="mt-1 text-sm text-ink-600">These questions are configured for the selected case type and will be retained with this submission.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {intakeFields.map((field) => (
                    <label key={field.key} className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}>
                      <span className="text-sm font-medium text-ink-950">{field.label}{field.required ? " *" : ""}</span>
                      {field.helpText ? <span className="block text-xs text-ink-600">{field.helpText}</span> : null}
                      {field.type === "select" ? (
                        <select value={String(intakeData[field.key] ?? "")} onChange={(event) => setIntakeData((current) => ({ ...current, [field.key]: event.target.value }))} className="h-12 w-full rounded-xl border border-ink-300 bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200">
                          <option value="">Select an option</option>
                          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : field.type === "boolean" ? (
                        <input type="checkbox" checked={intakeData[field.key] === true} onChange={(event) => setIntakeData((current) => ({ ...current, [field.key]: event.target.checked }))} className="h-5 w-5 rounded border-ink-300 text-ink-950 focus:ring-ink-500" />
                      ) : field.type === "textarea" ? (
                        <textarea value={String(intakeData[field.key] ?? "")} onChange={(event) => setIntakeData((current) => ({ ...current, [field.key]: event.target.value }))} rows={4} className="w-full rounded-xl border border-ink-300 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200" />
                      ) : (
                        <input type={field.type === "phone" ? "tel" : field.type} value={String(intakeData[field.key] ?? "")} onChange={(event) => setIntakeData((current) => ({ ...current, [field.key]: field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value }))} className="h-12 w-full rounded-xl border border-ink-300 bg-white px-4 text-sm text-ink-950 outline-none transition focus:border-ink-950 focus:ring-2 focus:ring-ink-200" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <Card className="bg-surface-muted">
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
              className={["rounded-[1.75rem] border-2 border-dashed px-6 py-10 transition", dragActive ? "border-ink-950 bg-white" : "border-ink-300 bg-ink-50"].join(" ")}
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
                <div className="rounded-2xl border border-ink-200 bg-white p-3">
                  <UploadIcon className="h-5 w-5 text-ink-950" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-ink-950">Upload supporting documents</p>
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
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-ink-200 bg-white p-4">
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
              <div className="rounded-[1.5rem] border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">
                No files attached yet. You can still create the case without attachments.
              </div>
            )}

            <Card className="bg-surface-muted">
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

      <div className="sticky bottom-0 z-20 -mx-4 px-4 pb-2 pt-2 sm:static sm:mx-0 sm:p-0">
        <div className="surface-card border border-surface-line px-4 py-4 sm:px-5">
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
      </div>
    </form>
  );
}
