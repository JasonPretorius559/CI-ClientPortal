import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { useReportDesignerStore } from "../../reports/reportDesigner.store";
import { exportElementToPdf } from "../../reports/reportExport";
import { ReportPagePreview } from "../../reports/components/ReportPagePreview";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload(payload: unknown) {
  if (isRecord(payload) && payload.kind === "json" && "payload" in payload) {
    return unwrapPayload(payload.payload);
  }
  if (isRecord(payload) && "data" in payload) {
    return payload.data ?? payload;
  }
  return payload;
}

function readWarnings(payload: unknown) {
  const data = unwrapPayload(payload);
  if (!isRecord(data)) return [];
  const warnings = data.warnings;
  if (!Array.isArray(warnings)) return [];
  return warnings
    .map((warning) => (typeof warning === "string" ? warning : isRecord(warning) && typeof warning.message === "string" ? warning.message : ""))
    .filter(Boolean);
}

function readHtml(payload: unknown) {
  if (isRecord(payload) && payload.kind === "html" && typeof payload.html === "string") return payload.html;
  const data = unwrapPayload(payload);
  return isRecord(data) && typeof data.html === "string" ? data.html : "";
}

function buildPreviewData(payload: unknown, template: ReturnType<typeof useReportDesignerStore.getState>["template"]) {
  const data = unwrapPayload(payload);
  const fields: Record<string, unknown> = {};

  if (isRecord(data) && Array.isArray(data.hydratedBindings)) {
    for (const binding of data.hydratedBindings) {
      if (!isRecord(binding)) continue;
      const path = typeof binding.path === "string" ? binding.path : "";
      const componentId = typeof binding.componentId === "string" ? binding.componentId : "";
      const value = binding.value;
      if (path) fields[path] = value;
      const element = template.coverPage.elements.find((item) => item.id === componentId);
      if (element?.fieldKey) fields[element.fieldKey] = value;
    }
  }

  return isRecord(data) ? { ...data, fields: { ...(isRecord(data.fields) ? data.fields : {}), ...fields } } : { fields };
}

export function AdminReportPreviewModal({
  open,
  onClose,
  payload,
  title,
}: {
  open: boolean;
  onClose: () => void;
  payload: unknown;
  title: string;
}) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const setPreviewData = useReportDesignerStore((state) => state.setPreviewData);
  const template = useReportDesignerStore((state) => state.template);
  const warnings = readWarnings(payload);
  const html = readHtml(payload);

  useEffect(() => {
    if (open) {
      setPreviewData(buildPreviewData(payload, template) as never);
    }
  }, [open, payload, setPreviewData, template]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 p-4">
      <div role="dialog" aria-modal="true" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words text-base font-semibold text-ink-950">Report Preview</h2>
            <p className="mt-1 break-words text-sm text-ink-600">{title}</p>
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
            {warnings.length > 0 ? (
              <Alert tone="info">
                {warnings.join(" ")}
              </Alert>
            ) : null}
            {html ? (
              <div className="w-[794px] max-w-full overflow-hidden rounded-lg border border-ink-300 bg-white shadow-soft">
                <div className="border-b border-ink-200 px-5 py-4">
                  <p className="text-sm font-semibold text-ink-950">HTML render</p>
                </div>
                <iframe title="Report HTML preview" srcDoc={html} sandbox="" className="h-[48rem] w-full bg-white" />
              </div>
            ) : (
              <ReportPagePreview readonly />
            )}
            <div className="w-[794px] max-w-full overflow-hidden rounded-lg border border-ink-300 bg-white shadow-soft">
              <div className="border-b border-ink-200 px-5 py-4">
                <p className="text-sm font-semibold text-ink-950">Hydrated preview payload</p>
              </div>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words p-5 text-xs text-ink-900">
                {JSON.stringify(unwrapPayload(payload), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
