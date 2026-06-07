import { Rnd } from "react-rnd";
import type { DragEvent } from "react";
import { cn } from "../../../lib/cn";
import { useReportDesignerStore } from "../reportDesigner.store";
import { ReportElementRenderer } from "./ReportElementRenderer";
import { getPagePreviewSize } from "./reportPagePreview.utils";

export const REPORT_FIELD_DRAG_TYPE = "application/x-report-schema-fields";

export function ReportPagePreview({
  readonly = false,
  pageId,
  onDropFields,
}: {
  readonly?: boolean;
  pageId?: string;
  onDropFields?: (fieldPaths: string[], position: { x: number; y: number }) => void;
}) {
  const template = useReportDesignerStore((state) => state.template);
  const activePage = useReportDesignerStore((state) => state.activePage);
  const selectedElementId = useReportDesignerStore((state) => state.selectedElementId);
  const previewData = useReportDesignerStore((state) => state.previewData);
  const selectElement = useReportDesignerStore((state) => state.selectElement);
  const updateElement = useReportDesignerStore((state) => state.updateElement);
  const size = getPagePreviewSize(template);
  const visiblePage = pageId ?? activePage;
  const canDropFields = Boolean(onDropFields && !readonly);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!canDropFields) return;

    const payload = event.dataTransfer.getData(REPORT_FIELD_DRAG_TYPE);
    if (!payload) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      const fieldPaths = JSON.parse(payload) as unknown;
      if (!Array.isArray(fieldPaths)) return;

      const rect = event.currentTarget.getBoundingClientRect();
      onDropFields?.(
        fieldPaths.filter((fieldPath): fieldPath is string => typeof fieldPath === "string" && fieldPath.trim().length > 0),
        {
          x: Math.max(0, Math.round(event.clientX - rect.left)),
          y: Math.max(0, Math.round(event.clientY - rect.top)),
        },
      );
    } catch {
      // Ignore drag payloads from outside the report designer.
    }
  };

  return (
    <div
      className={cn("relative overflow-hidden border border-ink-300 bg-white shadow-soft", canDropFields && "outline-offset-4")}
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: template.coverPage.backgroundColor ?? template.page.backgroundColor,
      }}
      onDragOver={(event) => {
        if (canDropFields && event.dataTransfer.types.includes(REPORT_FIELD_DRAG_TYPE)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={handleDrop}
      onClick={() => {
        if (!readonly) selectElement(null);
      }}
    >
      {template.coverPage.elements
        .filter((element) => element.page === visiblePage)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => {
          const selected = selectedElementId === element.id;
          const content = (
            <div
              className={cn("h-full w-full overflow-hidden", selected && !readonly && "ring-2 ring-ink-950")}
              onClick={(event) => {
                event.stopPropagation();
                if (!readonly) selectElement(element.id);
              }}
            >
              <ReportElementRenderer element={element} assets={template.assets} previewData={previewData} />
            </div>
          );

          if (readonly || element.locked) {
            return (
              <div
                key={element.id}
                className="absolute min-w-0"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  zIndex: element.zIndex,
                }}
              >
                {content}
              </div>
            );
          }

          return (
            <Rnd
              key={element.id}
              bounds="parent"
              size={{ width: element.width, height: element.height }}
              position={{ x: element.x, y: element.y }}
              dragGrid={[8, 8]}
              resizeGrid={[8, 8]}
              minWidth={24}
              minHeight={24}
              style={{ zIndex: element.zIndex }}
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                selectElement(element.id);
              }}
              onDragStop={(_event, data) => {
                updateElement(element.id, { x: data.x, y: data.y });
              }}
              onResizeStop={(_event, _direction, ref, _delta, position) => {
                updateElement(element.id, {
                  x: position.x,
                  y: position.y,
                  width: Number.parseInt(ref.style.width, 10),
                  height: Number.parseInt(ref.style.height, 10),
                });
              }}
            >
              {content}
            </Rnd>
          );
        })}
    </div>
  );
}
