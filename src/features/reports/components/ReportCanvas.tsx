import { Monitor, Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";
import { useReportDesignerStore } from "../reportDesigner.store";
import { ReportPagePreview } from "./ReportPagePreview";
import { getPagePreviewSize } from "./reportPagePreview.utils";

type DesignerPage = {
  id: string;
  name: string;
};

export function ReportCanvas({
  pages = [{ id: "cover", name: "Cover" }],
  onAddPage,
  onDropFields,
}: {
  pages?: DesignerPage[];
  onAddPage?: () => void;
  onDropFields?: (fieldPaths: string[], position: { x: number; y: number }) => void;
}) {
  const template = useReportDesignerStore((state) => state.template);
  const activePage = useReportDesignerStore((state) => state.activePage);
  const setActivePage = useReportDesignerStore((state) => state.setActivePage);
  const size = getPagePreviewSize(template);
  const activePageName = pages.find((page) => page.id === activePage)?.name ?? "Page";

  return (
    <section className="min-w-0 overflow-hidden border-x border-ink-200 bg-ink-100">
      <div className="flex h-full min-w-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-950">{activePageName} canvas</p>
            <p className="mt-0.5 break-words text-xs text-ink-500">
              {template.page.size} {template.page.orientation} - {size.width} x {size.height}px
            </p>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <div className="hidden max-w-md min-w-0 flex-wrap gap-1 rounded-md border border-ink-200 bg-ink-50 p-1 sm:flex">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActivePage(page.id)}
                  className={cn(
                    "min-h-8 min-w-0 rounded px-2 text-xs font-semibold text-ink-600 transition hover:bg-white",
                    activePage === page.id && "bg-white text-ink-950 shadow-sm",
                  )}
                >
                  <span className="block max-w-24 truncate">{page.name}</span>
                </button>
              ))}
            </div>

            {onAddPage ? (
              <Button type="button" variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" onClick={onAddPage}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Page
              </Button>
            ) : null}

            <div className="hidden items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600 sm:flex">
              <Monitor className="h-4 w-4" aria-hidden="true" />
              Desktop
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto w-max min-w-0">
            <ReportPagePreview onDropFields={onDropFields} />
          </div>
        </div>
      </div>
    </section>
  );
}
