import { Rnd } from "react-rnd";
import { cn } from "../../../lib/cn";
import { useReportDesignerStore } from "../reportDesigner.store";
import { ReportElementRenderer } from "./ReportElementRenderer";
import { getPagePreviewSize } from "./reportPagePreview.utils";

export function ReportPagePreview({ readonly = false }: { readonly?: boolean }) {
  const template = useReportDesignerStore((state) => state.template);
  const selectedElementId = useReportDesignerStore((state) => state.selectedElementId);
  const previewData = useReportDesignerStore((state) => state.previewData);
  const selectElement = useReportDesignerStore((state) => state.selectElement);
  const updateElement = useReportDesignerStore((state) => state.updateElement);
  const size = getPagePreviewSize(template);

  return (
    <div
      className="relative overflow-hidden border border-ink-300 bg-white shadow-soft"
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: template.coverPage.backgroundColor ?? template.page.backgroundColor,
      }}
      onClick={() => {
        if (!readonly) selectElement(null);
      }}
    >
      {template.coverPage.elements
        .filter((element) => element.page === "cover")
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
