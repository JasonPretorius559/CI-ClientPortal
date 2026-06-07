import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Eye, Maximize2, Minimize2, Monitor, Save, X } from "lucide-react";
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
import { cn } from "../../lib/cn";
import { getCaseAnalysisVersions } from "../../features/cases/cases.api";
import {
  buildReportDesignDocument,
  buildSaveReportDesignInput,
  createComponentBindingFromField,
  DEFAULT_REPORT_DATA_SOURCE_KEY,
  getReportDesignId,
  getReportDesignTemplate,
  getSchemaMismatchMessage,
} from "../../features/report-designs/reportDesigns.utils";
import {
  createReportDesign,
  generateReportDesign,
  getReportDataSourceFields,
  getReportDataSources,
  getReportDesign,
  getStructuredOutputSchemas,
  previewReportDesign,
  updateReportDesign,
} from "../../features/report-designs/reportDesigns.api";
import type { ReportDesign, ReportDesignBinding, StructuredOutputSchemaField } from "../../features/report-designs/reportDesigns.types";
import { createDefaultReportTemplate } from "../../features/reports/reportTemplate.defaults";
import { supportedReportFonts } from "../../features/reports/reportFonts";
import { useReportDesignerStore } from "../../features/reports/reportDesigner.store";
import { ReportCanvas } from "../../features/reports/components/ReportCanvas";
import { downloadBlob } from "../../features/reports/reportExport";
import { AdminReportDesignerSidebar } from "../../features/report-designs/components/AdminReportDesignerSidebar";
import { AdminReportPropertiesPanel } from "../../features/report-designs/components/AdminReportPropertiesPanel";
import { AdminReportPreviewModal } from "../../features/report-designs/components/AdminReportPreviewModal";

type DesignerPage = {
  id: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeDesignerPages(pages: unknown[], elementPages: string[]): DesignerPage[] {
  const pageMap = new Map<string, DesignerPage>();
  pageMap.set("cover", { id: "cover", name: "Cover" });

  for (const page of pages) {
    if (!isRecord(page)) continue;
    const id = typeof page.id === "string" && page.id.trim() ? page.id.trim() : "";
    if (!id) continue;
    const name = typeof page.name === "string" && page.name.trim() ? page.name.trim() : id === "cover" ? "Cover" : id;
    pageMap.set(id, { id, name });
  }

  for (const pageId of elementPages) {
    if (!pageId || pageMap.has(pageId)) continue;
    pageMap.set(pageId, { id: pageId, name: pageId === "cover" ? "Cover" : pageId });
  }

  return Array.from(pageMap.values());
}

function getPayloadWarnings(payload: unknown) {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(data) || !Array.isArray(data.warnings)) return [];
  return data.warnings
    .map((warning) => (typeof warning === "string" ? warning : isRecord(warning) && typeof warning.message === "string" ? warning.message : ""))
    .filter(Boolean);
}

function createEmptyReportDesign(): ReportDesign {
  return {
    name: "",
    description: "",
    schemaKey: "",
    schemaVersion: null,
    design: {
      pages: [],
      components: [],
      template: createDefaultReportTemplate(),
    },
    bindings: [],
    isArchived: false,
  };
}

function syncBindingsWithTemplate(template: ReturnType<typeof createDefaultReportTemplate>, bindings: ReportDesignBinding[], sourceKey = DEFAULT_REPORT_DATA_SOURCE_KEY) {
  const bindingMap = new Map(bindings.map((binding) => [binding.componentId, binding]));

  return template.coverPage.elements
    .filter((element) => element.type === "field")
    .map((element) => {
      const existing = bindingMap.get(element.id);
      return {
        componentId: element.id,
        sourceKey: existing?.sourceKey ?? sourceKey,
        path: existing?.path ?? element.fieldKey ?? "",
        fallback: existing?.fallback ?? element.content ?? "",
      };
    })
    .filter((binding) => binding.path);
}

export function ReportDesignEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<ReportDesign>(() => createEmptyReportDesign());
  const [bindings, setBindings] = useState<ReportDesignBinding[]>([]);
  const [metaDirty, setMetaDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<unknown>(null);
  const [runMode, setRunMode] = useState<"preview" | "generate" | null>(null);
  const [caseId, setCaseId] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [runError, setRunError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSourceKey, setSelectedSourceKey] = useState("");

  const template = useReportDesignerStore((state) => state.template);
  const dirty = useReportDesignerStore((state) => state.dirty) || metaDirty;
  const selectedElementId = useReportDesignerStore((state) => state.selectedElementId);
  const activePage = useReportDesignerStore((state) => state.activePage);
  const setTemplate = useReportDesignerStore((state) => state.setTemplate);
  const markSaved = useReportDesignerStore((state) => state.markSaved);
  const updateTheme = useReportDesignerStore((state) => state.updateTheme);
  const updateElement = useReportDesignerStore((state) => state.updateElement);
  const addElement = useReportDesignerStore((state) => state.addElement);
  const removeElement = useReportDesignerStore((state) => state.removeElement);
  const setActivePage = useReportDesignerStore((state) => state.setActivePage);

  const schemasQuery = useQuery({
    queryKey: ["admin", "structured-output-schemas"],
    queryFn: getStructuredOutputSchemas,
  });

  const dataSourcesQuery = useQuery({
    queryKey: ["admin", "report-data-sources"],
    queryFn: getReportDataSources,
  });

  const reportDesignQuery = useQuery({
    queryKey: ["admin", "report-design", id ?? "new"],
    queryFn: () => getReportDesign(id ?? ""),
    enabled: isEditing,
  });

  const sourceFieldsQuery = useQuery({
    queryKey: ["admin", "report-data-source-fields", selectedSourceKey, draft.schemaKey],
    queryFn: () => getReportDataSourceFields(selectedSourceKey, draft.schemaKey),
    enabled: Boolean(selectedSourceKey && draft.schemaKey),
  });

  const analysisVersionsQuery = useQuery({
    queryKey: ["admin", "case-analysis-versions", caseId],
    queryFn: () => getCaseAnalysisVersions(caseId),
    enabled: Boolean(runMode && caseId.trim()),
  });

  const schemaFieldsVersion = sourceFieldsQuery.data?.schemaVersion ?? null;
  const schemaFields = sourceFieldsQuery.data?.fields ?? [];
  const fieldWarnings = sourceFieldsQuery.data?.warnings ?? [];
  const schemas = schemasQuery.data ?? [];
  const dataSources = dataSourcesQuery.data ?? [];
  const selectedElement = template.coverPage.elements.find((element) => element.id === selectedElementId);
  const activeFont = selectedElement?.style.fontFamily ?? template.theme.fontFamily;
  const designerPages = useMemo(
    () => normalizeDesignerPages(draft.design.pages, template.coverPage.elements.map((element) => element.page || "cover")),
    [draft.design.pages, template.coverPage.elements],
  );
  const bindingDisabledReason = !draft.schemaKey
    ? "Select a schema before mapping fields."
    : !selectedSourceKey
      ? "Select a report data source before mapping fields."
      : sourceFieldsQuery.isLoading
        ? "Loading report data-source fields..."
        : undefined;

  useEffect(() => {
    if (reportDesignQuery.data) {
      const nextDraft = reportDesignQuery.data;
      const nextTemplate = getReportDesignTemplate(nextDraft);
      setDraft({ ...nextDraft, design: { ...nextDraft.design, template: nextTemplate } });
      const nextSourceKey = nextDraft.bindings.find((binding) => binding.sourceKey)?.sourceKey || DEFAULT_REPORT_DATA_SOURCE_KEY;
      setSelectedSourceKey(nextSourceKey);
      setBindings(syncBindingsWithTemplate(nextTemplate, nextDraft.bindings, nextSourceKey));
      setTemplate(nextTemplate);
      setMetaDirty(false);
    }
  }, [reportDesignQuery.data, setTemplate]);

  useEffect(() => {
    if (!isEditing) {
      const nextTemplate = createDefaultReportTemplate();
      setTemplate(nextTemplate);
      setBindings([]);
      setMetaDirty(false);
    }
  }, [isEditing, setTemplate]);

  useEffect(() => {
    if (selectedSourceKey || dataSources.length === 0) return;

    const defaultSource = dataSources.find((source) => source.key === DEFAULT_REPORT_DATA_SOURCE_KEY) ?? (dataSources.length === 1 ? dataSources[0] : null);
    if (defaultSource) setSelectedSourceKey(defaultSource.key);
  }, [dataSources, selectedSourceKey]);

  useEffect(() => {
    if (!isEditing && schemaFieldsVersion !== null && draft.schemaKey && draft.schemaVersion !== schemaFieldsVersion) {
      setDraft((current) => ({ ...current, schemaVersion: schemaFieldsVersion }));
      setMetaDirty(true);
    }
  }, [draft.schemaKey, draft.schemaVersion, isEditing, schemaFieldsVersion]);

  const updateDesignName = (name: string) => {
    setDraft((current) => ({ ...current, name }));
    setMetaDirty(true);
  };

  const updateDesignDescription = (description: string) => {
    setDraft((current) => ({ ...current, description }));
    setMetaDirty(true);
  };

  const updateDesignSchema = (schemaKey: string) => {
    const schema = schemas.find((item) => item.key === schemaKey);
    const nextTemplate = createDefaultReportTemplate();

    setDraft((current) => ({
      ...current,
      schemaKey,
      schemaVersion: schema?.version ?? null,
      design: { ...current.design, template: nextTemplate, components: [], pages: [{ id: "cover", name: "Cover" }] },
    }));
    setBindings([]);
    setTemplate(nextTemplate);
    setActivePage("cover");
    setMetaDirty(true);
  };

  const updateDataSource = (sourceKey: string) => {
    setSelectedSourceKey(sourceKey);
    setBindings((current) => current.map((binding) => ({ ...binding, sourceKey: sourceKey || binding.sourceKey })));
    setMetaDirty(true);
  };

  const addDesignerPage = () => {
    const nextIndex = designerPages.length + 1;
    const pageId = `page-${Date.now()}`;
    const page = { id: pageId, name: `Page ${nextIndex}` };

    setDraft((current) => ({
      ...current,
      design: {
        ...current.design,
        pages: [...normalizeDesignerPages(current.design.pages, template.coverPage.elements.map((element) => element.page || "cover")), page],
      },
    }));
    setActivePage(pageId);
    setMetaDirty(true);
  };

  const addFieldElements = (fields: StructuredOutputSchemaField[], position?: { x: number; y: number }) => {
    if (fields.length === 0 || !selectedSourceKey) return;

    const existingComponents = template.coverPage.elements.map((element) => ({
        id: element.id,
        type: element.type,
        label: element.content || element.fieldKey || element.type,
      }));
    const createdBindings: ReportDesignBinding[] = [];

    fields.forEach((field, index) => {
      const created = createComponentBindingFromField({ ...field, sourceKey: field.sourceKey || selectedSourceKey }, existingComponents);
      existingComponents.push({
        id: created.component.id,
        type: "field",
        label: created.component.label,
      });
      createdBindings.push(created.binding);

      addElement({
        type: "field",
        page: activePage,
        x: position ? position.x + index * 16 : created.component.x ?? 64,
        y: position ? position.y + index * 84 : created.component.y ?? 64,
        width: created.component.width ?? 260,
        height: created.component.height ?? 72,
        zIndex: template.coverPage.elements.length + index + 1,
        fieldKey: field.path,
        content: "",
        style: {
          fontFamily: created.component.style?.fontFamily,
          fontSize: created.component.style?.fontSize,
          fontWeight: created.component.style?.fontWeight,
          color: created.component.style?.color,
          backgroundColor: created.component.style?.backgroundColor,
          textAlign: created.component.style?.textAlign,
          borderRadius: created.component.style?.borderRadius,
          opacity: created.component.style?.opacity,
        },
      });
    });

    setBindings((current) => [...current, ...createdBindings]);
    setMetaDirty(true);
  };

  const addFieldElement = (field: StructuredOutputSchemaField) => addFieldElements([field]);

  const addDroppedFields = (fieldPaths: string[], position: { x: number; y: number }) => {
    const fieldsByPath = new Map(schemaFields.map((field) => [field.path, field]));
    const fields = fieldPaths.map((fieldPath) => fieldsByPath.get(fieldPath)).filter((field): field is StructuredOutputSchemaField => Boolean(field));
    addFieldElements(fields, position);
  };

  const updateBinding = (componentId: string, updates: Partial<ReportDesignBinding>) => {
    setBindings((current) =>
      current.map((binding) => (binding.componentId === componentId ? { ...binding, ...updates } : binding)),
    );
    setMetaDirty(true);
  };

  const duplicateElementWithBinding = (elementId: string) => {
    const source = template.coverPage.elements.find((element) => element.id === elementId);
    if (!source) return;

    const cloneId = `${source.id}-copy-${Date.now()}`;
    addElement({
      ...source,
      id: cloneId,
      x: source.x + 20,
      y: source.y + 20,
      zIndex: source.zIndex + 1,
    });

    if (source.type === "field") {
      const sourceBinding = bindings.find((binding) => binding.componentId === elementId);
      if (sourceBinding) {
        setBindings((current) => [...current, { ...sourceBinding, componentId: cloneId }]);
      }
    }

    setMetaDirty(true);
  };

  const removeElementWithBinding = (elementId: string) => {
    removeElement(elementId);
    setBindings((current) => current.filter((binding) => binding.componentId !== elementId));
    setMetaDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextDesign: ReportDesign = {
        ...draft,
        bindings,
        design: buildReportDesignDocument(template, bindings, designerPages),
      };
      const payload = buildSaveReportDesignInput(nextDesign);

      if (!payload) {
        throw new Error("Name, schema, and schema version are required before you can save this report design.");
      }

      const savedDesign = isEditing && id ? await updateReportDesign(id, payload) : await createReportDesign(payload);
      return { savedDesign, submittedDesign: nextDesign, submittedTemplate: template };
    },
    onSuccess: ({ savedDesign, submittedDesign, submittedTemplate }) => {
      const savedId = getReportDesignId(savedDesign);
      const nextDesign = {
        ...savedDesign,
        bindings: submittedDesign.bindings,
        design: submittedDesign.design,
      };

      setDraft(nextDesign);
      setBindings(syncBindingsWithTemplate(submittedTemplate, submittedDesign.bindings, selectedSourceKey || DEFAULT_REPORT_DATA_SOURCE_KEY));
      markSaved(submittedTemplate);
      setMetaDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["admin", "report-designs"] });
      if (savedId) {
        queryClient.setQueryData(["admin", "report-design", savedId], nextDesign);
      }
      showToast({ tone: "success", title: isEditing ? "Report design updated." : "Report design created." });
      if (savedDesign.warnings?.length) {
        showToast({ tone: "success", title: `Saved with warnings: ${savedDesign.warnings.join(" ")}` });
      }

      if (!isEditing && savedId) {
        navigate(`/admin/report-designs/${encodeURIComponent(savedId)}`, { replace: true });
      }
    },
    onError: (error) => {
      showToast({ tone: "error", title: error instanceof Error ? error.message : "Unable to save this report design." });
    },
  });
  const isSavingDesign = saveMutation.isPending;
  const triggerSaveDesign = saveMutation.mutate;

  const saveDesign = useCallback(() => {
    if (isSavingDesign) return;
    triggerSaveDesign();
  }, [isSavingDesign, triggerSaveDesign]);

  const previewMutation = useMutation({
    mutationFn: () => previewReportDesign(id ?? "", { caseId: caseId.trim(), analysisId: analysisId.trim() }),
    onMutate: () => setRunError(null),
    onSuccess: (payload) => {
      setPreviewPayload(payload);
      setPreviewOpen(true);
      setRunMode(null);
      showToast({ tone: "success", title: "Preview loaded." });
      const warnings = getPayloadWarnings(payload);
      if (warnings.length) showToast({ tone: "success", title: `Preview warnings: ${warnings.join(" ")}` });
    },
    onError: (error) => {
      const message = getSchemaMismatchMessage(error);
      setRunError(message);
      showToast({ tone: "error", title: message });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateReportDesign(id ?? "", { caseId: caseId.trim(), analysisId: analysisId.trim() }),
    onMutate: () => setRunError(null),
    onSuccess: (result) => {
      if (result.kind === "file") {
        downloadBlob(result.blob, result.fileName);
      } else {
        const warnings = getPayloadWarnings(result.payload);
        if (warnings.length) showToast({ tone: "success", title: `Report warnings: ${warnings.join(" ")}` });
      }
      setRunMode(null);
      showToast({ tone: "success", title: "Report generated." });
    },
    onError: (error) => {
      const message = getSchemaMismatchMessage(error);
      setRunError(message);
      showToast({ tone: "error", title: message });
    },
  });

  const applyFont = (fontFamily: string) => {
    if (selectedElementId) {
      updateElement(selectedElementId, { style: { fontFamily } });
      return;
    }

    updateTheme({ fontFamily });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDesign();
      }

      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, saveDesign]);

  const runActionLabel = useMemo(() => (runMode === "preview" ? "Load Preview" : "Generate Report"), [runMode]);

  if (isEditing && reportDesignQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-[32rem]" />
      </div>
    );
  }

  if (isEditing && reportDesignQuery.isError) {
    return (
      <ErrorState
        title="Unable to load report design"
        message={reportDesignQuery.error instanceof Error ? reportDesignQuery.error.message : "This report design could not be loaded."}
        onRetry={() => void reportDesignQuery.refetch()}
      />
    );
  }

  if (schemasQuery.isLoading && schemas.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  if (dataSourcesQuery.isLoading && dataSources.length === 0) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  if (schemasQuery.isError) {
    return (
      <ErrorState
        title="Unable to load schemas"
        message={schemasQuery.error instanceof Error ? schemasQuery.error.message : "Schema metadata could not be loaded."}
        onRetry={() => void schemasQuery.refetch()}
      />
    );
  }

  if (dataSourcesQuery.isError) {
    return (
      <ErrorState
        title="Unable to load report data sources"
        message={dataSourcesQuery.error instanceof Error ? dataSourcesQuery.error.message : "Report data sources could not be loaded."}
        onRetry={() => void dataSourcesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Report Design" : "Create Report Design"}
        description="Keep the old drag-and-drop report designer, but bind cover-page fields directly to a selected structured output schema."
        action={(
          <>
            <Button asChild variant="secondary">
              <Link to="/admin/report-designs">Back to list</Link>
            </Button>
            <Button type="button" onClick={saveDesign} isLoading={isSavingDesign}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Design
            </Button>
          </>
        )}
      />

      {saveMutation.isError ? (
        <Alert tone="error">{saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save this report design."}</Alert>
      ) : null}

      <div className="xl:hidden">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-soft">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-100">
            <Monitor className="h-6 w-6 text-ink-700" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-950">Report Designer requires a desktop workspace</h1>
          <p className="mt-2 text-sm text-ink-600">Schema selection and design metadata are available here, but the drag-and-drop cover page tools need a wider viewport.</p>
        </div>
      </div>

      <div
        className={cn(
          "hidden min-w-0 overflow-hidden border border-ink-200 bg-white shadow-soft xl:block",
          isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl",
        )}
      >
        <div className="flex min-w-0 flex-col gap-3 border-b border-ink-200 bg-white px-5 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold text-ink-950">Report Designer</p>
              <p className="mt-0.5 text-xs text-ink-500">{dirty ? "Unsaved changes" : "All changes saved"}</p>
            </div>
            <Badge tone="outline">Live preview</Badge>
            {sourceFieldsQuery.isLoading ? <Badge tone="muted">Loading fields</Badge> : null}
            {selectedElement ? <Badge tone="muted">Editing {selectedElement.type}</Badge> : <Badge tone="muted">Theme font</Badge>}
          </div>

          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <div className="w-56 min-w-48">
              <SelectField
                label="Font"
                value={activeFont}
                onChange={(event) => applyFont(event.target.value)}
                options={supportedReportFonts}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => setIsFullscreen((current) => !current)} aria-label={isFullscreen ? "Exit full-screen editor" : "Open full-screen editor"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
              {isFullscreen ? "Exit Full Screen" : "Full Screen"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRunMode("preview")} disabled={!isEditing || !id}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRunMode("generate")} disabled={!isEditing || !id}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Generate report
            </Button>
            <Button type="button" onClick={saveDesign} isLoading={isSavingDesign} disabled={isSavingDesign}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
          </div>
        </div>

        {sourceFieldsQuery.isError ? (
          <Alert tone="error" className="m-4">
            {sourceFieldsQuery.error instanceof Error ? sourceFieldsQuery.error.message : "Unable to load report data-source fields."}
          </Alert>
        ) : null}

        {fieldWarnings.length > 0 ? (
          <Alert tone="info" className="m-4">
            {fieldWarnings.join(" ")}
          </Alert>
        ) : null}

        {draft.hasMigratedBindings ? (
          <Alert tone="info" className="m-4">
            Older bindings were migrated to the {DEFAULT_REPORT_DATA_SOURCE_KEY} report data source. Save this design to persist the new binding shape.
          </Alert>
        ) : null}

        <div
          className={cn(
            "grid min-h-[42rem] grid-cols-[280px_minmax(0,1fr)_340px] overflow-hidden",
            isFullscreen ? "h-[calc(100vh-5.25rem)]" : "h-[calc(100vh-10rem)]",
          )}
        >
          <AdminReportDesignerSidebar
            designName={draft.name}
            description={draft.description}
            schemas={schemas}
            dataSources={dataSources}
            schemaKey={draft.schemaKey}
            sourceKey={selectedSourceKey}
            schemaVersion={draft.schemaVersion}
            schemaSelected={Boolean(draft.schemaKey)}
            isEditing={isEditing}
            onNameChange={updateDesignName}
            onDescriptionChange={updateDesignDescription}
            onSchemaChange={updateDesignSchema}
            onSourceChange={updateDataSource}
          />
          <ReportCanvas pages={designerPages} onAddPage={addDesignerPage} onDropFields={addDroppedFields} />
          <AdminReportPropertiesPanel
            schemaFields={schemaFields}
            bindings={bindings}
            activePage={activePage}
            bindingDisabledReason={bindingDisabledReason}
            onAddField={addFieldElement}
            onAddFields={(fields) => addFieldElements(fields)}
            onUpdateBinding={updateBinding}
            onDuplicate={duplicateElementWithBinding}
            onRemove={removeElementWithBinding}
          />
        </div>
      </div>

      {runMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
          <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="break-words text-base font-semibold text-ink-950">{runMode === "preview" ? "Preview report design" : "Generate report"}</h2>
                <p className="mt-1 text-sm text-ink-600">Run this saved report design against a case and analysis version.</p>
              </div>
              <Button type="button" variant="ghost" className="px-3" aria-label="Close report run dialog" onClick={() => setRunMode(null)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {runError ? <Alert tone="error">{runError}</Alert> : null}
              <div className="grid gap-4">
                <TextField label="Case id" value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Paste the case id" />
                {analysisVersionsQuery.data?.length ? (
                  <SelectField
                    label="Analysis version"
                    value={analysisId}
                    onChange={(event) => setAnalysisId(event.target.value)}
                    options={[
                      { label: "Select an analysis", value: "" },
                      ...analysisVersionsQuery.data.map((version) => ({
                        label: `Version ${version.versionNumber} - ${version.status}${version.isCurrent ? " - current" : ""}`,
                        value: version.analysisId,
                      })),
                    ]}
                  />
                ) : (
                  <TextField label="Analysis id" value={analysisId} onChange={(event) => setAnalysisId(event.target.value)} placeholder="Paste the analysis id" />
                )}
              </div>

              {analysisVersionsQuery.isLoading ? <LoadingSkeleton className="mt-4 h-12" /> : null}
              {analysisVersionsQuery.isError ? (
                <Alert tone="error" className="mt-4">
                  {analysisVersionsQuery.error instanceof Error ? analysisVersionsQuery.error.message : "Unable to load analysis versions for this case."}
                </Alert>
              ) : null}

              {analysisId && analysisVersionsQuery.data?.find((version) => version.analysisId === analysisId) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="outline">{analysisVersionsQuery.data.find((version) => version.analysisId === analysisId)?.schemaKey || "Unknown schema"}</Badge>
                  {analysisVersionsQuery.data.find((version) => version.analysisId === analysisId)?.schemaVersion ? (
                    <Badge tone="muted">v{analysisVersionsQuery.data.find((version) => version.analysisId === analysisId)?.schemaVersion}</Badge>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-ink-200 px-5 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setRunMode(null)}>Cancel</Button>
              <Button
                type="button"
                isLoading={runMode === "preview" ? previewMutation.isPending : generateMutation.isPending}
                onClick={() => {
                  if (runMode === "preview") {
                    previewMutation.mutate();
                    return;
                  }
                  generateMutation.mutate();
                }}
                disabled={!caseId.trim() || !analysisId.trim()}
              >
                {runActionLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminReportPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        payload={previewPayload}
        title={draft.name || "Report design preview"}
      />

      {!draft.schemaKey ? (
        <EmptyState title="Select a schema to begin" description="Schema selection is required before the field list can be loaded into the old report designer." />
      ) : null}
    </div>
  );
}
