import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Eye, X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { formatDate } from "../../../lib/dates";
import type { AnalysisVersion } from "../../cases/cases.api";
import { downloadBlob } from "../reportExport";
import { sampleReportPreviewData } from "../reportTemplate.defaults";
import { generateCaseReport, getReportTemplates, previewCaseReport } from "../reports.api";
import { getReportTemplateId, type ReportPreviewData, type ReportTemplate } from "../reports.types";
import { ReportPreviewModal } from "./ReportPreviewModal";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePreviewData(payload: unknown): ReportPreviewData {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  return isRecord(data) ? (data as ReportPreviewData) : sampleReportPreviewData;
}

export function GenerateReportModal({
  open,
  onClose,
  caseId,
  defaultAnalysisId,
  analysisVersions = [],
  template,
}: {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  defaultAnalysisId?: string;
  analysisVersions?: AnalysisVersion[];
  template?: ReportTemplate;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(defaultAnalysisId ?? "");
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["report-templates"],
    queryFn: getReportTemplates,
    enabled: open && !template,
  });

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const selectedTemplate = useMemo(
    () => template ?? templates.find((item) => getReportTemplateId(item) === selectedTemplateId) ?? templates[0],
    [selectedTemplateId, template, templates],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedAnalysisId(defaultAnalysisId ?? "");
  }, [defaultAnalysisId, open]);

  useEffect(() => {
    if (!template && !selectedTemplateId && templates[0]) setSelectedTemplateId(getReportTemplateId(templates[0]));
  }, [selectedTemplateId, template, templates]);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!caseId) return sampleReportPreviewData;
      return normalizePreviewData(await previewCaseReport({ caseId, analysisId: selectedAnalysisId || undefined, templateId: selectedTemplate ? getReportTemplateId(selectedTemplate) : undefined, template }));
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setPreviewOpen(true);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!caseId) throw new Error("Open this from a case to generate a backend report.");
      return generateCaseReport({
        caseId,
        analysisId: selectedAnalysisId || undefined,
        templateId: selectedTemplate && !template ? getReportTemplateId(selectedTemplate) : undefined,
        template,
        format,
      });
    },
    onSuccess: (download) => downloadBlob(download.blob, download.fileName),
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
        <div role="dialog" aria-modal="true" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold text-ink-950">Generate with Template</h2>
              <p className="mt-1 text-sm text-ink-600">Preview and generate a backend report without changing the existing analysis report download.</p>
            </div>
            <Button type="button" variant="ghost" className="px-3" aria-label="Close report generation" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {!caseId ? <Alert tone="info">A case is required for backend report generation. You can still preview sample data.</Alert> : null}
            {templatesQuery.isError ? <Alert tone="error">Unable to load report templates.</Alert> : null}
            {generateMutation.isError ? <Alert tone="error" className="mt-4">{generateMutation.error instanceof Error ? generateMutation.error.message : "Unable to generate report."}</Alert> : null}

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-ink-700">Template</span>
                <select
                  value={selectedTemplate ? getReportTemplateId(selectedTemplate) : ""}
                  disabled={Boolean(template)}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2"
                >
                  {template ? (
                    <option value={getReportTemplateId(template) || "draft"}>{template.name}</option>
                  ) : (
                    templates.map((item) => (
                      <option key={getReportTemplateId(item)} value={getReportTemplateId(item)}>
                        {item.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-ink-700">Analysis version</span>
                <select value={selectedAnalysisId} onChange={(event) => setSelectedAnalysisId(event.target.value)} className="min-h-10 min-w-0 rounded-md border border-ink-300 px-3 py-2">
                  <option value="">Latest / case default</option>
                  {analysisVersions.map((version) => (
                    <option key={version.analysisId} value={version.analysisId}>
                      Version {version.versionNumber} · {version.status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-ink-700">Format</span>
                <select value={format} onChange={(event) => setFormat(event.target.value as "pdf" | "docx")} className="min-h-10 rounded-md border border-ink-300 px-3 py-2">
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </label>

              {selectedTemplate ? (
                <div className="min-w-0 rounded-xl border border-ink-200 bg-ink-50 p-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="break-words font-semibold text-ink-950">{selectedTemplate.name}</p>
                    {selectedTemplate.isDefault ? <Badge tone="solid">Default</Badge> : null}
                  </div>
                  <p className="mt-2 break-words text-sm text-ink-600">{selectedTemplate.description || "No description provided."}</p>
                  <p className="mt-3 break-words text-xs text-ink-500">
                    Version {selectedTemplate.version} · Updated {formatDate(selectedTemplate.updatedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-600">No templates are available yet.</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-ink-200 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="secondary" isLoading={previewMutation.isPending} onClick={() => previewMutation.mutate()} disabled={!selectedTemplate}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview
            </Button>
            <Button type="button" isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate()} disabled={!selectedTemplate || !caseId}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Generate Download
            </Button>
          </div>
        </div>
      </div>

      {selectedTemplate ? (
        <ReportPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} template={selectedTemplate} previewData={previewData} />
      ) : null}
    </>
  );
}
