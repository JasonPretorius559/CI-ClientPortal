import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Monitor } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { createDefaultReportTemplate, sampleReportPreviewData } from "../reportTemplate.defaults";
import { useReportDesignerStore } from "../reportDesigner.store";
import { createReportTemplate, getReportTemplate, previewCaseReport, updateReportTemplate } from "../reports.api";
import { getReportTemplateId, type ReportPreviewData } from "../reports.types";
import { GenerateReportModal } from "./GenerateReportModal";
import { ReportCanvas } from "./ReportCanvas";
import { ReportDesignerSidebar } from "./ReportDesignerSidebar";
import { ReportPreviewModal } from "./ReportPreviewModal";
import { ReportPropertiesPanel } from "./ReportPropertiesPanel";
import { TemplateSaveBar } from "./TemplateSaveBar";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePreviewData(payload: unknown): ReportPreviewData {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  return isRecord(data) ? (data as ReportPreviewData) : sampleReportPreviewData;
}

export function ReportDesignerShell({ templateId }: { templateId?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("caseId") ?? "";
  const analysisId = searchParams.get("analysisId") ?? "";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);
  const template = useReportDesignerStore((state) => state.template);
  const dirty = useReportDesignerStore((state) => state.dirty);
  const setTemplate = useReportDesignerStore((state) => state.setTemplate);
  const markSaved = useReportDesignerStore((state) => state.markSaved);

  const templateQuery = useQuery({
    queryKey: ["report-template", templateId],
    queryFn: () => getReportTemplate(templateId ?? ""),
    enabled: Boolean(templateId),
  });

  useEffect(() => {
    if (templateId && templateQuery.data) setTemplate(templateQuery.data);
    if (!templateId) setTemplate(createDefaultReportTemplate());
  }, [setTemplate, templateId, templateQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingId = getReportTemplateId(template);
      return existingId ? updateReportTemplate(existingId, template) : createReportTemplate(template);
    },
    onSuccess: (savedTemplate) => {
      markSaved(savedTemplate);
      const savedId = getReportTemplateId(savedTemplate);
      if (savedId && !templateId) navigate(`/reports/designer/${encodeURIComponent(savedId)}`, { replace: true });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!caseId) return sampleReportPreviewData;
      return normalizePreviewData(await previewCaseReport({ caseId, analysisId: analysisId || undefined, template }));
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setPreviewOpen(true);
    },
  });

  const previewPayload = useMemo(() => previewData ?? sampleReportPreviewData, [previewData]);

  if (templateQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-16" />
        <LoadingSkeleton className="h-[32rem]" />
      </div>
    );
  }

  if (templateQuery.isError) {
    return (
      <Alert tone="error">
        Unable to load this report template.
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/reports/templates">Back to templates</Link>
        </Button>
      </Alert>
    );
  }

  return (
    <div className="min-w-0">
      <div className="xl:hidden">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center shadow-soft">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-100">
            <Monitor className="h-6 w-6 text-ink-700" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-950">Report Designer requires a desktop workspace</h1>
          <p className="mt-2 text-sm text-ink-600">Templates can be listed on smaller screens, but cover-page drag and resize tools need a wider viewport.</p>
          <Button asChild className="mt-5">
            <Link to="/reports/templates">View Templates</Link>
          </Button>
        </div>
      </div>

      <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft xl:block">
        <TemplateSaveBar
          dirty={dirty}
          saving={saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
          onPreview={() => previewMutation.mutate()}
          onGenerate={() => setGenerateOpen(true)}
        />
        {saveMutation.isError ? <Alert tone="error" className="m-4">{saveMutation.error instanceof Error ? saveMutation.error.message : "Unable to save template."}</Alert> : null}
        {previewMutation.isError ? <Alert tone="error" className="m-4">{previewMutation.error instanceof Error ? previewMutation.error.message : "Unable to preview report."}</Alert> : null}
        <div className="grid h-[calc(100vh-10rem)] min-h-[42rem] grid-cols-[280px_minmax(0,1fr)_340px] overflow-hidden">
          <ReportDesignerSidebar />
          <ReportCanvas />
          <ReportPropertiesPanel />
        </div>
      </div>

      <ReportPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} template={template} previewData={previewPayload} />
      <GenerateReportModal open={generateOpen} onClose={() => setGenerateOpen(false)} caseId={caseId || undefined} defaultAnalysisId={analysisId || undefined} template={template} />
    </div>
  );
}
