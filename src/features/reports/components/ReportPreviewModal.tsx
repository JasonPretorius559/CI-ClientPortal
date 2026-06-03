import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { formatDate } from "../../../lib/dates";
import { exportElementToPdf } from "../reportExport";
import { sampleReportPreviewData } from "../reportTemplate.defaults";
import { useReportDesignerStore } from "../reportDesigner.store";
import type { ReportPreviewData, ReportSection, ReportTemplate } from "../reports.types";
import { ReportPagePreview } from "./ReportPagePreview";

function asList(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function SectionContent({ section, data }: { section: ReportSection; data: ReportPreviewData }) {
  if (section.type === "customText") return <p>{section.content || "Custom report text."}</p>;
  if (section.type === "executiveSummary") return <p>{stringifyValue(data.executiveSummary)}</p>;
  if (section.type === "metrics") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-200 p-3">
          <p className="text-xs font-semibold uppercase text-ink-500">Confidence</p>
          <p className="mt-1 text-xl font-semibold">{stringifyValue(data.fields?.confidenceScore ?? data.confidenceScore)}</p>
        </div>
        <div className="rounded-lg border border-ink-200 p-3">
          <p className="text-xs font-semibold uppercase text-ink-500">Satisfaction</p>
          <p className="mt-1 text-xl font-semibold">{stringifyValue(data.fields?.satisfactionScore ?? data.satisfactionScore)}</p>
        </div>
      </div>
    );
  }

  const listMap: Partial<Record<ReportSection["type"], unknown>> = {
    recommendations: data.recommendations,
    missingInformation: data.missingInformation,
    documentWarnings: data.documentWarnings,
    supportingDocuments: data.supportingDocuments,
  };

  if (section.type in listMap) {
    const items = asList(listMap[section.type]);
    return items.length ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="break-words rounded-lg border border-ink-200 p-3">
            {stringifyValue(item)}
          </li>
        ))}
      </ul>
    ) : (
      <p>None provided.</p>
    );
  }

  if (section.type === "clientDetails") return <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink-50 p-3">{stringifyValue(data.clientDetails)}</pre>;
  if (section.type === "rawAppendix") return <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink-50 p-3">{stringifyValue(data.rawAnalysis ?? data)}</pre>;
  return <p>Preview not available for this section.</p>;
}

function ReportBodyPreview({ template, data }: { template: ReportTemplate; data: ReportPreviewData }) {
  const sections = [...template.sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  return (
    <div
      className="min-w-0 bg-white"
      style={{
        padding: `${template.page.marginTop}px ${template.page.marginRight}px ${template.page.marginBottom}px ${template.page.marginLeft}px`,
        fontFamily: template.theme.fontFamily,
        fontSize: template.theme.bodyFontSize,
        color: template.theme.textColor,
        lineHeight: template.theme.lineHeight,
      }}
    >
      <div className="mb-8 border-b border-ink-200 pb-5">
        <p className="break-words text-sm font-semibold uppercase tracking-wide" style={{ color: template.theme.accentColor }}>
          {data.caseReference}
        </p>
        <h1 className="mt-2 break-words font-semibold" style={{ fontSize: template.theme.headingFontSize }}>
          {data.caseTitle}
        </h1>
        <p className="mt-2 break-words text-ink-600">
          {data.clientName} · {formatDate(typeof data.reportDate === "string" ? data.reportDate : null)}
        </p>
      </div>

      <div className="grid gap-8">
        {sections.map((section) => (
          <section key={section.id} className="min-w-0">
            <h2 className="break-words font-semibold" style={{ fontSize: section.style?.headingFontSize ?? template.theme.sectionTitleFontSize, color: template.theme.accentColor }}>
              {section.title}
            </h2>
            <div className="mt-3 min-w-0 break-words" style={{ fontSize: section.style?.bodyFontSize ?? template.theme.bodyFontSize }}>
              <SectionContent section={section} data={data} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ReportPreviewModal({
  open,
  onClose,
  template,
  previewData,
}: {
  open: boolean;
  onClose: () => void;
  template: ReportTemplate;
  previewData?: ReportPreviewData | null;
}) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const setPreviewData = useReportDesignerStore((state) => state.setPreviewData);
  const data = previewData ?? sampleReportPreviewData;

  useEffect(() => {
    if (open) setPreviewData(data);
  }, [data, open, setPreviewData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
      <div role="dialog" aria-modal="true" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold text-ink-950">Report Preview</h2>
            <p className="mt-1 break-words text-sm text-ink-600">{template.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => exportRef.current ? void exportElementToPdf(exportRef.current) : undefined}>
              Export Preview PDF
            </Button>
            <Button type="button" variant="ghost" className="px-3" onClick={onClose} aria-label="Close preview">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-ink-100 p-6">
          <div ref={exportRef} className="mx-auto grid w-max max-w-full gap-6">
            {template.coverPage.enabled ? <ReportPagePreview readonly /> : null}
            <div className="w-[794px] max-w-full overflow-hidden border border-ink-300 bg-white shadow-soft">
              <ReportBodyPreview template={template} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
