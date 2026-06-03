import { Monitor } from "lucide-react";
import { ReportPagePreview } from "./ReportPagePreview";
import { getPagePreviewSize } from "./reportPagePreview.utils";
import { useReportDesignerStore } from "../reportDesigner.store";

export function ReportCanvas() {
  const template = useReportDesignerStore((state) => state.template);
  const size = getPagePreviewSize(template);

  return (
    <section className="min-w-0 overflow-hidden border-x border-ink-200 bg-ink-100">
      <div className="flex h-full min-w-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-950">Cover canvas</p>
            <p className="mt-0.5 break-words text-xs text-ink-500">
              {template.page.size} {template.page.orientation} · {size.width} x {size.height}px
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600 sm:flex">
            <Monitor className="h-4 w-4" aria-hidden="true" />
            Desktop designer
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto w-max min-w-0">
            <ReportPagePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
